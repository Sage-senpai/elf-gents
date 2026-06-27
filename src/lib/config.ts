import "dotenv/config";

/**
 * Central config + the one flag everything keys off: MOCK.
 *
 * If there's no CROO key, the agent still boots and runs the full job
 * lifecycle against a simulated order, so you can demo the flow with zero
 * setup. Drop in real keys and the same code path goes live.
 */
export const config = {
  croo: {
    apiUrl: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsUrl: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    rpcUrl: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    sdkKey: process.env.CROO_SDK_KEY ?? "",
    targetServiceId: process.env.CROO_TARGET_SERVICE_ID ?? "",
  },
  priceUsdc: process.env.SERVICE_PRICE_USDC ?? "1.00",
  reconPriceUsdc: process.env.RECON_PRICE_USDC ?? "3.00",
  walletKey: (process.env.AGENT_WALLET_PRIVATE_KEY ?? "") as `0x${string}` | "",
  anthropic: {
    key: process.env.ANTHROPIC_API_KEY ?? "",
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  },
  // Required by the `recon` service (GitHub prior-art research). Free to mint:
  // github.com/settings/tokens — a classic token with `public_repo` scope is enough.
  github: {
    token: process.env.GITHUB_TOKEN ?? "",
  },
  // Which service the MOCK CAP client simulates a paid order for: "verify" | "recon".
  mockService: (process.env.MOCK_SERVICE ?? "verify") as "verify" | "recon",
};

/** The recon service genuinely calls GitHub — no token, no service. */
export function requireGithubToken(): string {
  if (!config.github.token.trim()) {
    throw new Error(
      "GITHUB_TOKEN is required for the recon service. Mint one at " +
        "https://github.com/settings/tokens (scope: public_repo) and set GITHUB_TOKEN.",
    );
  }
  return config.github.token;
}

/** No CROO key -> run the whole thing against a simulated order. */
export const MOCK = config.croo.sdkKey.trim() === "";
