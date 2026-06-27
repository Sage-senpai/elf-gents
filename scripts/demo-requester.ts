import { config, MOCK } from "../src/lib/config";

/**
 * The A2A demo: a *second* agent hiring Elfgents.
 *
 *   pnpm demo                       # verify a claim (default)
 *   pnpm demo "<claim>" <url...>    # verify a specific claim + sources
 *   pnpm demo --recon "<theme>"     # hire the recon service instead
 *
 * This is the requester side of the CAP order lifecycle — what another agent's
 * tool handler does when it wants something verified, or wants prior-art recon,
 * before delivering its own work. It proves the composability judges care
 * about: one agent paying another, on-chain, per job.
 *
 * SDK methods used (list in your BUIDL):
 *   - client.negotiateOrder({ serviceId, requirements })   // requirements = JSON string
 *   - client.payOrder(orderId)                             // on EventType.OrderCreated, escrows USDC
 *   - client.getDelivery(orderId)                          // on EventType.OrderCompleted
 */

/** Build the job payload from argv. Returns the `requirements` object. */
function buildInput(): Record<string, any> {
  const args = process.argv.slice(2);
  if (args[0] === "--recon") {
    const theme = args[1] ?? "verifiable agent-to-agent commerce";
    return {
      hackathon: "CROO Agent Hackathon",
      track: process.env.RECON_TRACK ?? "Research & Intelligence",
      theme,
      description: args.slice(2).join(" ") || undefined,
    };
  }
  const claim = args[0] ?? "The Stellar network settles transactions in 3-5 seconds.";
  const sources = args.slice(1);
  return { claim, sources: sources.length ? sources : ["https://stellar.org/learn/the-power-of-stellar"] };
}

async function runMock(input: Record<string, any>) {
  console.log("[demo] MOCK mode — no CROO key, so simulating the hire locally.\n");
  const { routeOrder } = await import("../src/lib/agent/services");
  const { makeReceipt } = await import("../src/lib/provenance/receipt");
  const { service, result } = await routeOrder(input);
  const receipt = await makeReceipt({
    service,
    orderId: "demo_order",
    result,
    previousHash: null,
    issuedAt: new Date().toISOString(),
  });
  console.log(`Elfgents returned a verified receipt (service: ${service}):\n`);
  console.log(JSON.stringify(receipt, null, 2));
}

async function runLive(input: Record<string, any>) {
  const sdk = (await import("@croo-network/sdk")) as any;
  const { AgentClient, EventType, DeliverableType } = sdk;
  const client = new AgentClient(
    { baseURL: config.croo.apiUrl, wsURL: config.croo.wsUrl, rpcURL: config.croo.rpcUrl },
    config.croo.sdkKey,
  );

  const serviceId = config.croo.targetServiceId;
  if (!serviceId) throw new Error("Set CROO_TARGET_SERVICE_ID to the listed Elfgents service id.");

  const stream = await client.connectWebSocket();

  // Pay once the provider accepts and the on-chain order is created.
  stream.on(EventType.OrderCreated, async (e: any) => {
    console.log(`[demo] order ${e.order_id} created — paying (escrows USDC)...`);
    const res = await client.payOrder(e.order_id);
    console.log(`[demo] payment tx: ${res.txHash}`);
  });

  // The signed receipt comes back as the deliverable.
  stream.on(EventType.OrderCompleted, async (e: any) => {
    const delivery = await client.getDelivery(e.order_id);
    const body =
      delivery.deliverableType === DeliverableType.Schema
        ? delivery.deliverableSchema
        : delivery.deliverableText;
    console.log("[demo] Receipt:\n", body);
    stream.close();
    process.exit(0);
  });

  const neg = await client.negotiateOrder({
    serviceId,
    requirements: JSON.stringify(input),
  });
  console.log(`[demo] negotiation ${neg.negotiationId} opened — waiting for the provider to accept...`);
}

async function main() {
  const input = buildInput();
  if (MOCK) return runMock(input);
  return runLive(input);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
