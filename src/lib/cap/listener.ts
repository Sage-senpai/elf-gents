import { getCapClient } from "./client";
import { routeOrder, UnroutableOrderError } from "../agent/services";
import { makeReceipt } from "../provenance/receipt";

/**
 * The provider loop — Elfgents earning money.
 *
 * Buyer pays -> USDC is escrowed in CAPVault -> we get OrderPaid -> we do the
 * work (verify or recon) -> we deliver the signed receipt -> settlement lands
 * in our wallet. If the input is unusable we rejectOrder so the buyer is
 * refunded.
 *
 * `previousHash` chains receipts across the process lifetime so a buyer can
 * audit a run of jobs as a tamper-evident sequence — across *both* services.
 */
export async function runListener() {
  const cap = await getCapClient();
  let previousHash: `0x${string}` | null = null;

  await cap.start({
    onOrderPaid: async (order) => {
      const { orderId, input } = order;

      try {
        const { service, result } = await routeOrder(input);
        console.log(`\n[job ${orderId}] service: ${service}`);

        const receipt = await makeReceipt({
          service,
          orderId,
          result,
          previousHash,
          issuedAt: new Date().toISOString(),
        });
        previousHash = receipt.contentHash;

        await cap.deliver(orderId, receipt);
        const r = result as any;
        const summary =
          service === "verify"
            ? `${r.verdict} (${Math.round(r.confidence * 100)}%)`
            : service === "recon"
              ? `${r.projects?.length ?? 0} repos`
              : `${r.valid ? "valid" : `${r.errorCount} error(s)`}`;
        console.log(
          `[job ${orderId}] delivered: ${summary} hash ${receipt.contentHash.slice(0, 14)}…`,
        );
      } catch (err) {
        if (err instanceof UnroutableOrderError) {
          await cap.reject(orderId, err.message);
          return;
        }
        console.error(`[job ${orderId}] failed:`, err);
        await cap.reject(orderId, "Agent error — please retry.");
      }
    },
  });

  return cap.mode;
}
