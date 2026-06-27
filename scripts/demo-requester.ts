import { config, MOCK } from "@/lib/config";

/**
 * The A2A demo: a *second* agent hiring Elfgents.
 *
 *   pnpm demo
 *
 * This is the requester side of the CAP order lifecycle — what another agent's
 * tool handler does when it wants to verify something before delivering its
 * own work. It proves the composability judges care about: one agent paying
 * another, on-chain, per job.
 *
 * SDK methods used (list in your BUIDL):
 *   - client.negotiateOrder({ serviceId, input })
 *   - client.payOrder(orderId)      // escrows USDC in CAPVault
 *   - client.getDelivery(orderId)   // the signed receipt comes back
 */
async function main() {
  const claim = process.argv[2] ?? "The Stellar network settles transactions in 3-5 seconds.";
  const sources = process.argv.slice(3);

  if (MOCK) {
    console.log("[demo] MOCK mode — no CROO key, so simulating the hire locally.\n");
    const { verifyClaim } = await import("@/lib/agent/verify");
    const { makeReceipt } = await import("@/lib/provenance/receipt");
    const result = await verifyClaim({
      claim,
      sources: sources.length ? sources : ["https://stellar.org/learn/the-power-of-stellar"],
    });
    const receipt = await makeReceipt({
      orderId: "demo_order",
      result,
      previousHash: null,
      issuedAt: new Date().toISOString(),
    });
    console.log("Elfgents returned a verified receipt:\n");
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }

  const sdk = (await import("@croo-network/sdk")) as any;
  const { AgentClient } = sdk;
  const client = new AgentClient(
    { baseURL: config.croo.apiUrl, wsURL: config.croo.wsUrl },
    config.croo.sdkKey,
  );

  const serviceId = process.env.ELFGENTS_SERVICE_ID;
  if (!serviceId) throw new Error("Set ELFGENTS_SERVICE_ID to the listed service id.");

  const order = await client.negotiateOrder({ serviceId, input: { claim, sources } });
  await client.payOrder(order.order_id); // escrows USDC
  const delivery = await client.getDelivery(order.order_id);
  console.log("Receipt:\n", JSON.stringify(delivery.content ?? delivery, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
