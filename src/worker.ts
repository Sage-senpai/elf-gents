import { runListener } from "./lib/cap/listener";
import { config, MOCK } from "./lib/config";

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
  console.log(`mode:   ${MOCK ? `MOCK (no CROO key) — sim '${config.mockService}' order` : "LIVE"}`);
  console.log(`verify: ${config.priceUsdc} USDC / job`);
  console.log(`recon:  ${config.reconPriceUsdc} USDC / job  (GitHub prior-art research)`);
  console.log(`judge:  ${config.anthropic.key ? config.anthropic.model : "heuristic (offline)"}`);
  console.log(`github: ${config.github.token ? "token set (recon ready)" : "NO TOKEN — recon will error"}`);
  console.log(`wallet: ${config.walletKey ? "set (receipts signed)" : "none (receipts unsigned)"}`);

  await runListener();
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
