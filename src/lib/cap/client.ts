import { config, MOCK } from "@/lib/config";

/**
 * Thin wrapper over @croo-network/sdk — the same "provider interface" idea
 * Elf used so no SDK leaks into the rest of the code. Swap the impl, keep the
 * shape.
 *
 * Methods used from the CAP SDK (list these in your BUIDL submission):
 *   - new AgentClient(config, sdkKey)
 *   - client.connectWebSocket()
 *   - stream.on(EventType.OrderPaid, ...)
 *   - client.acceptNegotiation(negotiationId)
 *   - client.deliverOrder(orderId, { type: DeliverableType.Schema, content })
 *   - client.rejectOrder(orderId, reason)
 *
 * If @croo-network/sdk isn't installed or there's no key, we fall back to a
 * MOCK that fires one synthetic paid order so the whole lifecycle is runnable
 * with zero setup.
 */

export type IncomingOrder = {
  orderId: string;
  input: { claim: string; sources: string[] };
};

export interface CapClient {
  readonly mode: "live" | "mock";
  start(handlers: {
    onOrderPaid: (order: IncomingOrder) => Promise<void>;
  }): Promise<void>;
  deliver(orderId: string, content: unknown): Promise<void>;
  reject(orderId: string, reason: string): Promise<void>;
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
    { baseURL: config.croo.apiUrl, wsURL: config.croo.wsUrl },
    config.croo.sdkKey,
  );

  return {
    mode: "live",
    async start(handlers) {
      const stream = await client.connectWebSocket();
      stream.on(EventType.NegotiationCreated, async (e: any) => {
        // accept jobs at our listed terms
        await client.acceptNegotiation(e.negotiation_id);
      });
      stream.on(EventType.OrderPaid, async (e: any) => {
        await handlers.onOrderPaid({
          orderId: e.order_id,
          input: e.input ?? e.order?.input ?? {},
        });
      });
      console.log("[cap] live — listening for negotiations and paid orders.");
    },
    async deliver(orderId, content) {
      await client.deliverOrder(orderId, { type: DeliverableType.Schema, content });
    },
    async reject(orderId, reason) {
      await client.rejectOrder(orderId, reason);
    },
  };
}

/* ------------------------------- mock ----------------------------------- */
function makeMockClient(): CapClient {
  return {
    mode: "mock",
    async start(handlers) {
      console.log("[cap] MOCK — simulating one paid order in 1s...");
      setTimeout(() => {
        void handlers.onOrderPaid({
          orderId: "mock_order_001",
          input: {
            claim: "The Stellar network settles transactions in 3-5 seconds.",
            sources: ["https://stellar.org/learn/the-power-of-stellar"],
          },
        });
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
