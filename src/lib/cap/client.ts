import { config, MOCK } from "../config";

/**
 * Thin wrapper over @croo-network/sdk — the same "provider interface" idea Elf
 * used so no SDK leaks into the rest of the code. Swap the impl, keep the shape.
 *
 * The method names + payload shapes below match the published node-sdk
 * (github.com/CROO-Network/node-sdk, examples/provider.ts + requester.ts):
 *
 *   new AgentClient({ baseURL, wsURL, rpcURL }, sdkKey)   // sdkKey = croo_sk_...
 *   const stream = await client.connectWebSocket()
 *   stream.on(EventType.NegotiationCreated, e => client.acceptNegotiation(e.negotiation_id))
 *   stream.on(EventType.OrderPaid,          e => client.deliverOrder(e.order_id, {...}))
 *   client.deliverOrder(orderId, { deliverableType: DeliverableType.Schema, deliverableSchema })
 *   client.getOrder(orderId)    // to read the requirements the buyer sent
 *   client.rejectOrder(orderId, reason)
 *
 * The buyer sends the job as `requirements` (a JSON string) on negotiateOrder;
 * the provider reads it back off the order. We tolerate a couple of field names
 * because the exact Order shape isn't published — see parseRequirements().
 *
 * No SDK / no key -> a MOCK that fires one synthetic paid order (verify or
 * recon, per MOCK_SERVICE) so the whole lifecycle runs with zero CAP setup.
 */

export type IncomingOrder = {
  orderId: string;
  input: Record<string, any>; // the parsed `requirements` the buyer sent
};

export interface CapClient {
  readonly mode: "live" | "mock";
  start(handlers: {
    onOrderPaid: (order: IncomingOrder) => Promise<void>;
  }): Promise<void>;
  deliver(orderId: string, content: unknown): Promise<void>;
  reject(orderId: string, reason: string): Promise<void>;
}

/** The buyer ships the job as a JSON string in `requirements`. Be liberal. */
function parseRequirements(source: any): Record<string, any> {
  const raw =
    source?.requirements ?? source?.input ?? source?.order?.requirements ?? source?.order?.input;
  if (raw == null) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

/* ------------------------------- live ----------------------------------- */
async function makeLiveClient(): Promise<CapClient> {
  const sdk = (await import("@croo-network/sdk").catch(() => null)) as any;
  if (!sdk) {
    console.warn("[cap] @croo-network/sdk not installed — falling back to mock.");
    return makeMockClient();
  }
  const { AgentClient, EventType, DeliverableType } = sdk;
  const client = new AgentClient(
    { baseURL: config.croo.apiUrl, wsURL: config.croo.wsUrl, rpcURL: config.croo.rpcUrl },
    config.croo.sdkKey,
  );

  return {
    mode: "live",
    async start(handlers) {
      const stream = await client.connectWebSocket();

      // Accept jobs at our listed terms -> creates the on-chain order.
      stream.on(EventType.NegotiationCreated, async (e: any) => {
        try {
          await client.acceptNegotiation(e.negotiation_id);
        } catch (err) {
          console.error("[cap] acceptNegotiation failed:", err);
        }
      });

      // Buyer paid -> USDC escrowed -> read requirements and do the work.
      stream.on(EventType.OrderPaid, async (e: any) => {
        let input = parseRequirements(e);
        if (Object.keys(input).length === 0) {
          // requirements aren't on the event; fetch the order to read them.
          try {
            input = parseRequirements(await client.getOrder(e.order_id));
          } catch {
            /* fall through with {} -> the router will reject */
          }
        }
        await handlers.onOrderPaid({ orderId: e.order_id, input });
      });

      console.log("[cap] live — listening for negotiations and paid orders.");
    },

    async deliver(orderId, content) {
      // Our deliverable is a structured receipt -> Schema, carried as JSON text.
      await client.deliverOrder(orderId, {
        deliverableType: DeliverableType.Schema,
        deliverableSchema: JSON.stringify(content),
      });
    },

    async reject(orderId, reason) {
      await client.rejectOrder(orderId, reason);
    },
  };
}

/* ------------------------------- mock ----------------------------------- */
const MOCK_ORDERS: Record<"verify" | "recon", IncomingOrder["input"]> = {
  verify: {
    claim: "The Stellar network settles transactions in 3-5 seconds.",
    sources: ["https://stellar.org/learn/the-power-of-stellar"],
  },
  recon: {
    hackathon: "CROO Agent Hackathon",
    track: "Research & Intelligence",
    theme: "verifiable agent-to-agent commerce",
    description: "A paid agent that fact-checks claims with on-chain provenance receipts.",
  },
};

function makeMockClient(): CapClient {
  return {
    mode: "mock",
    async start(handlers) {
      const which = config.mockService;
      console.log(`[cap] MOCK — simulating one paid '${which}' order in 1s...`);
      setTimeout(() => {
        void handlers.onOrderPaid({ orderId: `mock_order_${which}`, input: MOCK_ORDERS[which] });
      }, 1000);
    },
    async deliver(orderId, content) {
      console.log(`[cap] MOCK deliver -> ${orderId}`);
      console.log(JSON.stringify(content, null, 2));
    },
    async reject(orderId, reason) {
      console.log(`[cap] MOCK reject -> ${orderId}: ${reason}`);
    },
  };
}

export async function getCapClient(): Promise<CapClient> {
  return MOCK ? makeMockClient() : makeLiveClient();
}
