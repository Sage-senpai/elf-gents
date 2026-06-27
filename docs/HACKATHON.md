# CROO Agent Hackathon — facts, go-live, and submission

A condensed, source-cited brief for shipping and submitting Elfgents. Anything that could only be
read from an **image** on the DoraHacks page (exact prize split, judging weights) is marked
**UNCONFIRMED** — verify it on the live page before relying on it.

Primary sources:
- Hackathon: <https://dorahacks.io/hackathon/croo-hackathon> (+ `/detail`)
- Kaggle mirror: <https://www.kaggle.com/competitions/croo-ai-agent-hackathon-10-k-usd-prize-pool>
- CAP docs: <https://docs.croo.network/developer-docs/quick-start>
- node-sdk: <https://github.com/CROO-Network/node-sdk>

---

## What it is

Ship an **agent powered by CAP** and prove that A2A composability + on-chain commerce drive
autonomous applications. The agent goes **live on the CROO Agent Store** (a real marketplace, not a
sandbox) where other agents can hire it as a paid dependency.

- **Prize pool:** ~**$10,200 USD** total, **plus** an Agent Store featured listing and `$CROO`
  airdrop-whitelist eligibility. A time-limited **0% gas fee** runs during the Agent Store launch.
  - Per-track / per-place split: **UNCONFIRMED** (published only as an image on `/detail`).
- **Timeline:** submissions **open 2026/06/09 09:00**, **deadline 2026/07/12 09:00** (a ~30-day
  sprint). Timezone not labeled — DoraHacks deadlines are conventionally **UTC**; confirm on the
  live page. (A stray snippet said "July 9" — the DoraHacks timeline field shows **07/12**, treat
  that as authoritative.)
- **Judging criteria:** **UNCONFIRMED** (image-only on `/detail`). Read it directly before
  finalizing.

### The six tracks (verbatim)

1. **Research & Intelligence Agents** — paid research with verifiable sources
2. **Data & Verification Agents** — provenance, credentials, output checks
3. **Creator & Content Ops Agents** — priced, composable creator services
4. **DeFi / On-chain Ops Agents** — monitoring, alerts, execution
5. **Developer Tooling Agents** — tools for other CAP builders
6. **Open – Any A2A Agents** — anything proving A2A composability

**Where Elfgents fits** (it spans several — pick a primary on the BUIDL form):
- **Data & Verification** — provenance receipts + output checks (`verify`). *Strongest fit.*
- **Developer Tooling** — GitHub recon + dev tools other CAP builders hire (`recon`).
- **Research & Intelligence** — verifies research claims with sources; scouts prior art.
- **Open – Any A2A** — the `pnpm demo` flow is literally one agent paying another, per job.

---

## Submission checklist (all five required)

From `/detail`:

1. **Listed on the CROO Agent Store** — discoverable by humans and other agents (the agent **must
   be live/registered** at <https://agent.croo.network>).
2. **Integrated with CAP** — callable, settles on-chain.
3. **Open source** — public repo, permissive license (MIT / Apache-2.0 / similar). ✅ Elfgents is MIT.
4. **Demo + README** — a **≤ 5-min demo video**, setup instructions, and the **SDK methods used**
   (we list these below and in the README).
5. **BUIDL filed on DoraHacks** — all required fields completed. The form requires at minimum a
   **GitHub/GitLab/Bitbucket link** and a **demo video**; standard BUIDL fields (name, logo,
   tagline, description, track, team) also apply. Exact required-field set: **UNCONFIRMED**.

---

## Go live (turn MOCK into a real listing)

You already have your CROO API key. Steps:

1. **Register the agent** — <https://agent.croo.network> → *My Agents → Register Agent*. CROO
   generates an **AA wallet + Agent DID** and shows your **SDK key (`croo_sk_…`) once** — save it.
2. **Fund the agent's AA wallet** with USDC **on Base** (the AA wallet address in the dashboard —
   *not* the controller address). The SDK checks this balance before transacting.
3. **Register the services** in the dashboard (pricing/SLA live here, *not* in code — a CAP gotcha):
   - `verify` — Requirements: Schema `{ claim, sources[] }`; Deliverable: Schema; price e.g. 1 USDC.
   - `recon` — Requirements: Schema `{ track, theme, description }`; Deliverable: Schema; price e.g. 3 USDC.
4. **Configure + install:**
   ```bash
   cp .env.example .env.local
   # set CROO_SDK_KEY, GITHUB_TOKEN (for recon), optionally AGENT_WALLET_PRIVATE_KEY + ANTHROPIC_API_KEY
   pnpm add @croo-network/sdk
   ```
5. **Run the provider:** `pnpm worker` — it now listens for real negotiations and paid orders.
6. **(Optional) prove A2A:** from a funded requester agent, set `CROO_TARGET_SERVICE_ID` and run
   `pnpm demo` — record this for the demo video. It's the cleanest proof of composability.

---

## CAP SDK methods used (paste into the BUIDL "SDK methods" field)

Confirmed against `github.com/CROO-Network/node-sdk` examples. Package: **`@croo-network/sdk`**
(Node 18+).

**Provider** (`src/lib/cap/client.ts`, `listener.ts`):
- `new AgentClient({ baseURL, wsURL, rpcURL }, sdkKey)`
- `client.connectWebSocket()` → `stream.on(EventType.…)` / `stream.close()`
- `stream.on(EventType.NegotiationCreated, …)` → `client.acceptNegotiation(negotiationId)`
- `stream.on(EventType.OrderPaid, …)` → `client.getOrder(orderId)` (read `requirements`)
- `client.deliverOrder(orderId, { deliverableType: DeliverableType.Schema, deliverableSchema })`
- `client.rejectOrder(orderId, reason)`

**Requester / A2A demo** (`scripts/demo-requester.ts`):
- `client.negotiateOrder({ serviceId, requirements })` *(requirements = JSON string)*
- `stream.on(EventType.OrderCreated, …)` → `client.payOrder(orderId)` *(escrows USDC, returns `txHash`)*
- `stream.on(EventType.OrderCompleted, …)` → `client.getDelivery(orderId)`

**Enums:**
- `EventType`: `NegotiationCreated`, `NegotiationRejected`, `NegotiationExpired`, `OrderCreated`,
  `OrderPaid`, `OrderCompleted`, `OrderRejected`, `OrderExpired`
- `DeliverableType`: `Text` (`"text"`), `Schema` (`"schema"`)

> **Payload-shape caveat:** exact TS interfaces for `NegotiateOrderRequest` / `DeliverOrderRequest`
> aren't published in the docs — field names above are confirmed by the working `examples/*.ts`.
> `client.ts` reads `requirements` defensively (`parseRequirements`) in case the live Order shape
> differs. Re-check against the installed SDK's `src/` once `pnpm add @croo-network/sdk` is run.

---

## Demo video outline (≤ 5 min)

1. **The pitch (30s)** — "every agent sells output, nobody can trust it. Elfgents is the shared
   trust layer: claim in, signed receipt out."
2. **MOCK lifecycle (60s)** — `pnpm worker`, watch `OrderPaid → verify → receipt → deliver`.
3. **A2A hire (60s)** — `pnpm demo` in a second terminal: one agent paying another, receipt returned.
4. **The new service (60s)** — `pnpm demo:recon "…"`: GitHub prior-art recon → scored repos + strategy.
5. **Live on CROO (60s)** — the agent's Agent Store listing + a real paid order settling on Base.
6. **The receipt (30s)** — open it: `contentHash`, `signature`, `previousHash` (the hash-chain).

---

## Pre-submit verification (do these on the live pages)

1. Confirm the **deadline timezone** for `2026/07/12 09:00` (assume UTC, but check).
2. Read the **per-track / per-place prize split** image on `/detail`.
3. Read the **judging-criteria** image on `/detail` (weights drive what to emphasize).
4. Confirm the **full BUIDL required-field list** on the submission form.
5. Confirm the installed SDK's `deliverOrder` / `negotiateOrder` field names match `client.ts`.
