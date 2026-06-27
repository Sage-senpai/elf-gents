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
    sdkKey: process.env.CROO_SDK_KEY ?? "",
  },
  priceUsdc: process.env.SERVICE_PRICE_USDC ?? "1.00",
  walletKey: (process.env.AGENT_WALLET_PRIVATE_KEY ?? "") as `0x${string}` | "",
  anthropic: {
    key: process.env.ANTHROPIC_API_KEY ?? "",
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  },
};

/** No CROO key -> run the whole thing against a simulated order. */
export const MOCK = config.croo.sdkKey.trim() === "";
