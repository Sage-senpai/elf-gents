import { runListener } from "@/lib/cap/listener";
import { config, MOCK } from "@/lib/config";

/**
 * Entry point for the always-on agent process.
 *   pnpm worker
 *
 * Runs the CAP provider listener. In MOCK mode (no CROO key) it simulates one
 * paid order so you can see the whole verify -> receipt -> deliver flow with
 * zero setup.
 */
async function main() {
  console.log("┌────────────────────────────────────────────┐");
  console.log("│  Elfgents — verification agent (CROO/CAP)    │");
  console.log("└────────────────────────────────────────────┘");
  console.log(`mode:  ${MOCK ? "MOCK (no CROO key set)" : "LIVE"}`);
  console.log(`price: ${config.priceUsdc} USDC / job`);
  console.log(`judge: ${config.anthropic.key ? config.anthropic.model : "heuristic (offline)"}`);
  console.log(`wallet:${config.walletKey ? " set (receipts signed)" : " none (receipts unsigned)"}`);

  await runListener();
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
