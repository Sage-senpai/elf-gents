# Elfgents

> The elf that checks your agent's work.

A callable, paid agent for the [CROO Agent Protocol (CAP)](https://docs.croo.network). Other agents
hire it per job, and every job comes back as a **tamper-proof, on-chain receipt** the hiring agent
can staple to its own delivery. It lists **three services**:

- **`verify`** — hand it a claim and the sources behind it; it reads them and judges whether they
  actually support the claim.
- **`recon`** — hand it a hackathon brief; it searches GitHub for the existing and past projects
  worth knowing about, ranks them, and synthesizes the angle you can claim.
- **`validate`** — hand it a deliverable and a JSON Schema; it proves whether the payload conforms
  before it settles. Deterministic, no keys.

Extracted from [Elf](https://github.com/Sage-senpai/Elf), a cross-functional builder workspace. Elf
hashed and anchored every agent run so its work was provable. Elfgents takes that provenance layer and
makes it a service any agent can call.

> 📖 **Full docs:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) (services, lifecycle, file map) ·
> [`docs/HACKATHON.md`](./docs/HACKATHON.md) (hackathon facts + go-live + submission checklist).

---

## Why this exists

Every agent in the CROO economy sells output, and nobody can trust it. The Research track *requires*
verifiable sources. CAP itself is built on "verifiable delivery." Elfgents is the shared trust layer:
a dependency other agents hire so their own deliveries can be called **verified** instead of **claimed**.

That's the wedge — it's not a destination, it's a part. One good service, and other people's agents
become your customers.

## What it does

**`verify`** — `{ claim, sources[] }` → fetch each source, grade support (model-graded with an
ANTHROPIC key, deterministic heuristic without one) → a signed `Receipt` (verdict, confidence,
citations).

**`recon`** — `{ track, theme, description }` → derive GitHub queries, search + dedupe + rank repos,
read their READMEs, synthesize *why-relevant / what-to-reuse* per repo plus an overall *strategy* →
a signed `Receipt` (scored repos + angle). **Requires `GITHUB_TOKEN`.**

**`validate`** — `{ deliverable, schema }` → check the payload against a JSON Schema with a focused
draft-07 validator → a signed `Receipt` (`valid`, per-path errors). Deterministic, no keys — the
trust check any CAP agent can hire before its own delivery settles.

All receipts are content-addressed (`keccak256`), hash-chained to the previous job, and signed by
the agent's wallet — across **every** service, so a run is one tamper-evident sequence.

### Dev tools (so the agent can actually go into GitHub)

The recon service ships a real dev-tool set the agent loop can call —
`github_search_repos`, `github_search_code`, `github_read_readme`, `github_get_repo`
(`src/lib/agent/devtools.ts`). They back both the deterministic recon path and an agentic mode
(`runReconAgentic`) where the model drives the searches itself.

## Tracks

Built to span more than one:

- **Data & Verification** — provenance + output checks (core).
- **Developer Tooling** — infrastructure other CAP builders hire.
- **Research & Intelligence** — verifies research claims with sources.
- **Open — Any A2A** — one agent paying another, per job.

## Run it (zero setup, MOCK mode)

No CROO key needed to see the whole lifecycle:

```bash
pnpm install
pnpm worker          # boots the agent, simulates one paid 'verify' order end-to-end
pnpm worker:recon    # simulates one paid 'recon' order (needs GITHUB_TOKEN)
pnpm worker:validate # simulates one paid 'validate' order (no keys needed)
pnpm demo            # the A2A side: a second agent "hires" verify
pnpm demo:recon "verifiable agent commerce"   # hire recon (needs GITHUB_TOKEN)
pnpm demo:validate   # hire validate (no keys needed)
pnpm dev             # the landing page at http://localhost:3000
```

In MOCK mode the CAP layer fires a synthetic paid order and the agent runs offline, so you can watch
`order -> work -> receipt -> deliver` with nothing configured (recon still needs `GITHUB_TOKEN`,
since it makes real GitHub calls).

## Go live

```bash
cp .env.example .env.local
# 1. Register the agent + both services in the CROO dashboard, paste CROO_SDK_KEY
# 2. Fund the agent's AA wallet with USDC on Base (address shown in the dashboard)
# 3. pnpm add @croo-network/sdk
# 4. Set GITHUB_TOKEN (recon), and optionally AGENT_WALLET_PRIVATE_KEY (signs receipts) + ANTHROPIC_API_KEY
pnpm worker          # now LIVE: listens for real negotiations + paid orders
```

Service registration and pricing happen in the **dashboard**, not in code (a CAP gotcha). The SDK is
only for the runtime: listen, accept, deliver. Full steps in [`docs/HACKATHON.md`](./docs/HACKATHON.md).

## CAP SDK methods used

> Listed here because the BUIDL submission asks for it. Confirmed against the published
> [`@croo-network/sdk`](https://github.com/CROO-Network/node-sdk) examples (Node 18+).

**Provider** (`src/lib/cap/client.ts`, `listener.ts`):
`new AgentClient({ baseURL, wsURL, rpcURL }, sdkKey)` · `client.connectWebSocket()` ·
`stream.on(EventType.NegotiationCreated, …)` → `client.acceptNegotiation(id)` ·
`stream.on(EventType.OrderPaid, …)` → `client.getOrder(id)` ·
`client.deliverOrder(id, { deliverableType: DeliverableType.Schema, deliverableSchema })` ·
`client.rejectOrder(id, reason)`

**Requester / A2A demo** (`scripts/demo-requester.ts`):
`client.negotiateOrder({ serviceId, requirements })` ·
`stream.on(EventType.OrderCreated, …)` → `client.payOrder(id)` ·
`stream.on(EventType.OrderCompleted, …)` → `client.getDelivery(id)`

## Project layout

```
src/
  app/                 Next.js landing page (the agentic flow, not a workspace)
  lib/
    cap/               CROO/CAP integration — client + provider listener
    agent/             services router · verify · recon · validate · dev tools · tool-call loop
    provenance/        signed, hash-chained receipts (from Elf's audit layer)
    config.ts          env + the MOCK switch
  worker.ts            the always-on agent process  (pnpm worker)
scripts/
  demo-requester.ts    a second agent hiring this one  (pnpm demo / pnpm demo:recon)
docs/
  ARCHITECTURE.md      services, lifecycle, file map, env
  HACKATHON.md         hackathon facts + go-live + submission checklist
```

## License

MIT. See [LICENSE](./LICENSE).
