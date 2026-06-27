# Elfgents

> The elf that checks your agent's work.

A callable, paid **verification agent** for the [CROO Agent Protocol (CAP)](https://docs.croo.network).
Another agent hands Elfgents a claim and the sources behind it. Elfgents reads the sources, judges
whether they actually support the claim, and returns a **tamper-proof, on-chain receipt** the hiring
agent can attach to its own delivery.

Extracted from [Elf](https://github.com/Sage-senpai/Elf), a cross-functional builder workspace. Elf
hashed and anchored every agent run so its work was provable. Elfgents takes that provenance layer and
makes it a service any agent can call.

---

## Why this exists

Every agent in the CROO economy sells output, and nobody can trust it. The Research track *requires*
verifiable sources. CAP itself is built on "verifiable delivery." Elfgents is the shared trust layer:
a dependency other agents hire so their own deliveries can be called **verified** instead of **claimed**.

That's the wedge — it's not a destination, it's a part. One good service, and other people's agents
become your customers.

## What it does

1. **Input** (from another agent, over CAP): `{ claim: string, sources: string[] }`
2. **Work**: fetch each source, grade whether it supports the claim (model-graded with an API key,
   deterministic heuristic without one).
3. **Output** (the deliverable): a signed, content-addressed `Receipt` — verdict, confidence,
   citations, a `keccak256` content hash, hash-chained to the previous job, signed by the agent's wallet.

## Tracks

Built to span more than one:

- **Data & Verification** — provenance + output checks (core).
- **Developer Tooling** — infrastructure other CAP builders hire.
- **Research & Intelligence** — verifies research claims with sources.
- **Open — Any A2A** — one agent paying another, per job.

## Run it (zero setup, MOCK mode)

No keys needed to see the whole lifecycle:

```bash
pnpm install
pnpm worker        # boots the agent, simulates one paid order end-to-end
pnpm demo          # the A2A side: a second agent "hires" Elfgents
pnpm dev           # the landing page at http://localhost:3000
```

In MOCK mode the CAP layer fires a synthetic paid order and the verifier runs its offline heuristic,
so you can watch `verify -> receipt -> deliver` with nothing configured.

## Go live

```bash
cp .env.example .env.local
# 1. Register the agent + service in the CROO dashboard, paste CROO_SDK_KEY
# 2. pnpm add @croo-network/sdk
# 3. Set AGENT_WALLET_PRIVATE_KEY (signs receipts) and optionally ANTHROPIC_API_KEY
pnpm worker        # now LIVE: listens for real negotiations + paid orders
```

Service registration and pricing happen in the **dashboard**, not in code (a CAP gotcha). The SDK is
only for the runtime: listen, accept, deliver.

## CAP SDK methods used

> Listed here because the BUIDL submission asks for it.

**Provider** (`src/lib/cap/client.ts`, `listener.ts`):
`new AgentClient(config, sdkKey)` · `client.connectWebSocket()` ·
`stream.on(EventType.NegotiationCreated, …)` · `client.acceptNegotiation(id)` ·
`stream.on(EventType.OrderPaid, …)` · `client.deliverOrder(id, { type: DeliverableType.Schema, content })` ·
`client.rejectOrder(id, reason)`

**Requester / A2A demo** (`scripts/demo-requester.ts`):
`client.negotiateOrder({ serviceId, input })` · `client.payOrder(id)` · `client.getDelivery(id)`

## Project layout

```
src/
  app/                 Next.js landing page (the agentic flow, not a workspace)
  lib/
    cap/               CROO/CAP integration — client + provider listener
    agent/             the tool-call loop + the verify service + tools
    provenance/        signed, hash-chained receipts (from Elf's audit layer)
    config.ts          env + the MOCK switch
  worker.ts            the always-on agent process  (pnpm worker)
scripts/
  demo-requester.ts    a second agent hiring this one  (pnpm demo)
```

## License

MIT. See [LICENSE](./LICENSE).
