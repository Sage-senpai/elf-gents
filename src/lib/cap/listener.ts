import { getCapClient } from "@/lib/cap/client";
import { verifyClaim } from "@/lib/agent/verify";
import { makeReceipt } from "@/lib/provenance/receipt";

/**
 * The provider loop — Elfgents earning money.
 *
 * Buyer pays -> USDC is escrowed in CAPVault -> we get OrderPaid -> we do the
 * work (verify) -> we deliver the signed receipt -> settlement lands in our
 * wallet. If the input is unusable we rejectOrder so the buyer is refunded.
 *
 * `previousHash` chains receipts across the process lifetime so a buyer can
 * audit a run of jobs as a tamper-evident sequence.
 */
export async function runListener() {
  const cap = await getCapClient();
  let previousHash: `0x${string}` | null = null;

  await cap.start({
    onOrderPaid: async (order) => {
      const { orderId, input } = order;
      console.log(`\n[job ${orderId}] claim: "${input.claim}"`);

      if (!input?.claim) {
        await cap.reject(orderId, "No claim supplied.");
        return;
      }

      try {
        const result = await verifyClaim({
          claim: input.claim,
          sources: input.sources ?? [],
        });

        const receipt = await makeReceipt({
          orderId,
          result,
          previousHash,
          issuedAt: new Date().toISOString(),
        });
        previousHash = receipt.contentHash;

        await cap.deliver(orderId, receipt);
        console.log(
          `[job ${orderId}] delivered: ${result.verdict} ` +
            `(${Math.round(result.confidence * 100)}%) hash ${receipt.contentHash.slice(0, 14)}…`,
        );
      } catch (err) {
        console.error(`[job ${orderId}] failed:`, err);
        await cap.reject(orderId, "Verifier error — please retry.");
      }
    },
  });

  return cap.mode;
}
