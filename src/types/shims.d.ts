/**
 * Ambient shim for the one OPTIONAL runtime dependency.
 *
 * `@anthropic-ai/sdk` is loaded with dynamic `import().catch()` and only used
 * when ANTHROPIC_API_KEY is set — it's intentionally not in package.json so the
 * project installs and runs (MOCK / heuristic mode) with zero keys. This keeps
 * `tsc` / `next build` green. `pnpm add @anthropic-ai/sdk` and its real types
 * take over automatically.
 *
 * (@croo-network/sdk is now installed, so it uses its real published types.)
 */
declare module "@anthropic-ai/sdk";
