import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { config, MOCK } from "../src/lib/config";

/**
 * Go-live preflight — the doctor.
 *
 *   pnpm preflight
 *
 * Checks everything Elfgents needs to run LIVE on CROO before you flip the
 * switch: env vars, the SDK install, your receipt signer, and a real
 * authenticated round-trip to the CROO API + WebSocket. Prints a green/red
 * checklist and exits non-zero if anything required is missing, so it doubles
 * as a CI gate.
 */

type Status = "ok" | "warn" | "fail" | "skip";
type Check = { name: string; status: Status; detail: string };

const SYM: Record<Status, string> = { ok: "✓", warn: "!", fail: "✗", skip: "·" };

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

async function main() {
  const checks: Check[] = [];
  const add = (name: string, status: Status, detail: string) => checks.push({ name, status, detail });

  // --- env ---------------------------------------------------------------
  const key = config.croo.sdkKey.trim();
  add(
    "CROO_SDK_KEY",
    key ? (key.startsWith("croo_sk_") ? "ok" : "warn") : "fail",
    key
      ? key.startsWith("croo_sk_")
        ? `set (${key.slice(0, 12)}…)`
        : "set, but not in croo_sk_… format — double-check you copied the SDK key"
      : "missing — register the agent at https://agent.croo.network and paste the key",
  );
  add("CROO_API_URL", config.croo.apiUrl ? "ok" : "fail", config.croo.apiUrl || "missing");
  add("CROO_WS_URL", config.croo.wsUrl ? "ok" : "fail", config.croo.wsUrl || "missing");
  add("BASE_RPC_URL", "ok", config.croo.rpcUrl);
  add(
    "CROO_TARGET_SERVICE_ID",
    config.croo.targetServiceId ? "ok" : "skip",
    config.croo.targetServiceId ? "set (needed only by the requester/demo)" : "unset — only the requester side needs it",
  );

  add(
    "GITHUB_TOKEN (recon)",
    config.github.token ? "ok" : "warn",
    config.github.token ? "set — recon service ready" : "missing — the recon service will error until set",
  );
  add(
    "ANTHROPIC_API_KEY",
    config.anthropic.key ? "ok" : "skip",
    config.anthropic.key ? `set (${config.anthropic.model})` : "unset — verify uses heuristic, recon uses heuristic notes",
  );

  // --- receipt signer ----------------------------------------------------
  if (config.walletKey) {
    try {
      const account = privateKeyToAccount(config.walletKey);
      add("Receipt signer (AGENT_WALLET_PRIVATE_KEY)", "ok", `signs as ${account.address}`);
    } catch {
      add("Receipt signer (AGENT_WALLET_PRIVATE_KEY)", "fail", "set but not a valid 0x private key");
    }
  } else {
    add("Receipt signer (AGENT_WALLET_PRIVATE_KEY)", "warn", "unset — receipts deliver unsigned");
  }

  // --- SDK install -------------------------------------------------------
  let sdk: any = null;
  try {
    sdk = await import("@croo-network/sdk");
    add("@croo-network/sdk", "ok", "installed");
  } catch {
    add("@croo-network/sdk", "fail", "not installed — run: pnpm add @croo-network/sdk");
  }

  // --- live round-trip ---------------------------------------------------
  if (sdk && key) {
    let client: any;
    try {
      client = new sdk.AgentClient(
        { baseURL: config.croo.apiUrl, wsURL: config.croo.wsUrl, rpcURL: config.croo.rpcUrl },
        key,
      );
    } catch (err) {
      add("AgentClient", "fail", String((err as Error).message).slice(0, 120));
    }

    if (client) {
      try {
        await withTimeout(client.listOrders({ role: "provider", pageSize: 1 }), 12000, "listOrders");
        add("API auth (listOrders)", "ok", "SDK key accepted by the API");
      } catch (err) {
        add("API auth (listOrders)", "fail", String((err as Error).message).slice(0, 120));
      }
      try {
        const stream = (await withTimeout(client.connectWebSocket(), 12000, "connectWebSocket")) as any;
        add("WebSocket", "ok", "connected — ready to receive negotiations + paid orders");
        stream.close();
      } catch (err) {
        add("WebSocket", "fail", String((err as Error).message).slice(0, 120));
      }
    }
  } else {
    add("API auth + WebSocket", "skip", "needs both @croo-network/sdk and CROO_SDK_KEY");
  }

  // --- report ------------------------------------------------------------
  console.log("\n┌─ Elfgents preflight ──────────────────────────────────────┐");
  console.log(`│  mode would be: ${MOCK ? "MOCK (no CROO key)" : "LIVE"}`);
  console.log("└───────────────────────────────────────────────────────────┘\n");
  const pad = Math.max(...checks.map((c) => c.name.length));
  for (const c of checks) {
    console.log(`  ${SYM[c.status]}  ${c.name.padEnd(pad)}  ${c.detail}`);
  }

  const fails = checks.filter((c) => c.status === "fail");
  const warns = checks.filter((c) => c.status === "warn");
  console.log(
    `\n  ${fails.length === 0 ? "✓ ready" : `✗ ${fails.length} blocker(s)`}` +
      `${warns.length ? `, ${warns.length} warning(s)` : ""}.\n`,
  );
  if (fails.length) {
    console.log("  Fix the ✗ items, then re-run `pnpm preflight`. See docs/GO-LIVE.md.\n");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("preflight crashed:", err);
  process.exit(1);
});
