# Elfgents — Architecture & Services

> The elf that checks your agent's work — and now scouts the field before you build.

Elfgents is a **callable, paid agent on the CROO Agent Protocol (CAP)**. Other agents (or
humans, via the Agent Store) hire it per job. It lists **two services**, each of which returns a
signed, content-addressed, hash-chained **provenance receipt** the buyer can staple to their own
delivery.

The provenance layer is lifted from [Elf](https://github.com/Sage-senpai/Elf), a builder
workspace that hashed and anchored every agent run. Elfgents turns that one capability into a
service any agent can call.

---

## The services

| Service | Buyer sends | Elfgents does | Returns |
|--------|-------------|---------------|---------|
| **`verify`** | `{ claim, sources[] }` | Fetches each source, judges whether they support the claim | Receipt of a `VerifyResult` (verdict + confidence + citations) |
| **`recon`** | `{ hackathon?, track?, theme?, description?, keywords[]? }` | Searches GitHub for prior art / past projects, ranks them, synthesizes an angle | Receipt of a `ReconResult` (scored repos + strategy) |
| **`validate`** | `{ deliverable, schema }` | Checks the deliverable against a JSON Schema (deterministic, no keys) | Receipt of a `ConformanceResult` (valid + per-path errors) |

They share one provider loop, one receipt format, and one hash-chain — so a buyer can audit a run
of mixed jobs as a single tamper-evident sequence. The router (`src/lib/agent/services.ts`)
dispatches by input shape.

### `verify` — claim → signed verdict
The original service. Constrained by design: the caller hands us the sources, we only judge support.

- **With `ANTHROPIC_API_KEY`** — a strict fact-checker model reads each source and grades support.
- **Without one** — a deterministic keyword-overlap heuristic, so the agent still returns a real,
  reproducible verdict offline.

Code: `src/lib/agent/verify.ts`.

### `recon` — hackathon brief → prior-art report
The new service. This is the "harder mode": the agent goes *into* GitHub.

1. Derive search **queries** from the brief (track + theme + description → keywords).
2. **Search GitHub** across those queries, dedupe, rank by stars/recency (`src/lib/agent/devtools.ts`).
3. **Read READMEs** of the top repos so recommendations aren't name-deep.
4. **Synthesize**:
   - **With `ANTHROPIC_API_KEY`** — the model writes per-repo *why it's relevant* / *what to reuse*
     and an overall *strategy* (the gap to claim), grounded in the READMEs it just read.
   - **Without one** — heuristic notes from topics/description + a templated strategy.

**`GITHUB_TOKEN` is required** for `recon` — it makes real GitHub API calls (search + readme).
The service fails fast with a clear message if the token is missing.

Code: `src/lib/agent/recon.ts`. There's also an **agentic mode** (`runReconAgentic`) that hands the
GitHub dev tools to the tool-call loop in `src/lib/agent/loop.ts` and lets the model decide which
searches to run — useful for a richer report or to demo the dev tools in a real loop.

### `validate` — deliverable → conformance receipt
The purest trust-layer service. Every CAP agent delivers a `Schema` result; `validate` is the
dependency any of them can hire to *prove* a delivery conforms to an agreed JSON Schema before it
settles — both sides get a signed receipt that says "this payload matched this contract".

- **Deterministic, dependency-free, no keys.** Ships a focused JSON-Schema validator
  (`src/lib/agent/validate.ts`) covering the draft-07 subset CAP deliverables use: `type` (incl.
  `integer` and type-unions), `required`, `properties`, `enum`/`const`, `additionalProperties`,
  `items` + `minItems`/`maxItems`, string `minLength`/`maxLength`/`pattern`, numeric
  `minimum`/`maximum`/`exclusive*`, and `nullable`.
- Returns `{ valid, errorCount, errors: [{ path, message }], schemaTitle }` with JSON-Pointer paths.
- Accepts the deliverable/schema as objects *or* JSON strings (CAP delivers Schema as a string).

---

## Developer tools (new)

The verifier only ever needed one tool, `fetch_source`. The recon service adds a real **dev-tool**
set — the thing the agent was missing — in the same `{ name, description, input_schema, handler }`
shape the loop already speaks (`src/lib/agent/devtools.ts`):

| Tool | What it does |
|------|--------------|
| `github_search_repos` | Search public repos (supports qualifiers like `stars:>50 pushed:>2025-01-01`) |
| `github_search_code` | Search code across GitHub for a symbol/import/API call |
| `github_read_readme` | Read a repo's README before recommending it |
| `github_get_repo` | Fetch a single repo's metadata (stars, language, topics, last push) |

These also back the deterministic recon path directly (not just the model loop), so recon works
with or without an inference key.

---

## The CAP order lifecycle (how it settles)

```
negotiate → accept → (order) created → pay → paid → deliver → completed → settle
```

1. **Negotiate** — a buyer requests one of our services at the listed price.
2. **Accept** — we accept on `NegotiationCreated`, which creates the on-chain order.
3. **Pay** — buyer calls `payOrder`; USDC is escrowed (Base mainnet). We never touch it yet.
4. **OrderPaid** — we read the buyer's `requirements`, route to the right service, do the work.
5. **Deliver** — we return the signed receipt as a `Schema` deliverable.
6. **Settle** — on delivery, escrow releases: platform fee → Treasury, remainder → our wallet.

If the input matches no service, or is unusable, we `rejectOrder` and the buyer is refunded.

**Reject/expire semantics:** reject at `created` = no payment yet; reject/expire at `paid` =
auto-refund to the requester.

---

## The deliverable: a receipt, not just an answer

Every job returns a signed, content-addressed `Receipt` (`src/lib/provenance/receipt.ts`):

```jsonc
{
  "v": 1,
  "service": "verify",          // which service produced this
  "job": "order_8f2a…",         // CAP order id
  "result": { /* VerifyResult or ReconResult */ },
  "contentHash": "0x4c9f…",     // keccak256 of the canonical (key-sorted) result
  "previousHash": "0x1ab0…",    // hash-chained to the previous job
  "issuedAt": "2026-06-27T…",
  "signer": "0x9Ad…",           // the agent's wallet (EIP-191 signed)
  "signature": "0x…"            // proves Elfgents issued this exact result
}
```

- **Content-addressed** — `contentHash` is `keccak256` of a deterministic, recursively key-sorted
  JSON of the result, so the same logical result always hashes the same way.
- **Signed** — if `AGENT_WALLET_PRIVATE_KEY` is set, the content hash is signed so anyone can prove
  the agent issued it.
- **Hash-chained** — each receipt carries the previous one's hash, across *both* services, making a
  run auditable as a tamper-evident sequence.

---

## File map

```
src/
  app/                     Next.js landing page (the agentic flow, not a workspace)
  lib/
    cap/
      client.ts            CAP SDK wrapper (live) + MOCK client (verify | recon order sim)
      listener.ts          provider loop: OrderPaid → route → receipt → deliver
    agent/
      services.ts          router: input shape → verify | recon | validate
      verify.ts            the verify service (model-graded or heuristic)
      recon.ts             the recon service (GitHub gather → synthesize)
      validate.ts          the validate service (JSON-Schema conformance, deterministic)
      devtools.ts          GitHub dev tools (search/read) — used by recon + the loop
      tools.ts             fetch_source (used by verify)
      loop.ts              generic tool-call loop (used by recon's agentic mode)
    provenance/
      receipt.ts           signed, hash-chained, content-addressed receipts (generic over result)
    config.ts              env + the MOCK switch + requireGithubToken()
  worker.ts                the always-on agent process   (pnpm worker)
scripts/
  demo-requester.ts        a second agent hiring this one (pnpm demo / pnpm demo:recon)
docs/
  ARCHITECTURE.md          this file
  HACKATHON.md             CROO hackathon facts + submission guide
```

---

## Environment

| Var | Required? | Purpose |
|-----|-----------|---------|
| `CROO_SDK_KEY` | live only | `croo_sk_…` from the dashboard. Blank ⇒ **MOCK mode**. |
| `CROO_API_URL` / `CROO_WS_URL` | live | CAP API + WebSocket endpoints |
| `BASE_RPC_URL` | optional | Base JSON-RPC (defaults to `https://mainnet.base.org`) |
| `CROO_TARGET_SERVICE_ID` | demo (live) | the service id the requester hires |
| `SERVICE_PRICE_USDC` / `RECON_PRICE_USDC` / `VALIDATE_PRICE_USDC` | optional | banner pricing (real price is set in the dashboard) |
| `MOCK_SERVICE` | optional | which service the MOCK client simulates: `verify` \| `recon` \| `validate` |
| `GITHUB_TOKEN` | **recon** | required for the recon service's GitHub calls |
| `AGENT_WALLET_PRIVATE_KEY` | optional | signs receipts (separate from the CAP payment AA wallet) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | optional | model-graded verify + model-written recon synthesis |

> **Two wallets, don't confuse them.** `AGENT_WALLET_PRIVATE_KEY` signs *receipts* only. CAP
> *payments* settle to the AA wallet CROO generates for your agent in the dashboard — fund that one
> with USDC on Base.

---

## Run it

```bash
pnpm install

# MOCK (zero CROO setup) — watch the full lifecycle
pnpm worker                # simulates one paid 'verify' order
pnpm worker:recon          # simulates one paid 'recon' order (needs GITHUB_TOKEN)
pnpm worker:validate       # simulates one paid 'validate' order (no keys needed)

# the A2A side — a second agent hiring this one
pnpm demo                  # verify a claim
pnpm demo:recon "verifiable agent commerce"   # hire recon (needs GITHUB_TOKEN)
pnpm demo:validate         # hire validate (no keys needed)

pnpm dev                   # the landing page at http://localhost:3000
```

Going live (real CAP): register the agent + both services in the dashboard, set `CROO_SDK_KEY`,
`pnpm add @croo-network/sdk`, then `pnpm worker`. See [HACKATHON.md](./HACKATHON.md) for the full
go-live + submission checklist.
