# Go live — from MOCK to a settled order on Base

The runbook for taking Elfgents from the local MOCK demo to a **real, callable,
on-chain** agent on the CROO Agent Store — and capturing the proof the BUIDL
submission needs. Pairs with [HACKATHON.md](./HACKATHON.md) (requirements) and
[ARCHITECTURE.md](./ARCHITECTURE.md) (how it works).

CAP settles on **Base mainnet** in **USDC** — real funds. Use small amounts.

---

## 0. Prerequisites

- Node 18+ and `pnpm`.
- The CROO SDK installed: `pnpm add @croo-network/sdk` (already in `package.json`).
- Your CROO SDK key (`croo_sk_…`) from the dashboard.

---

## 1. Register the agent

1. Go to <https://agent.croo.network> → **My Agents → Register Agent**.
2. Name it (e.g. "Elfgents"), submit. CROO generates an **AA wallet + Agent DID**
   and shows your **SDK key once** — copy it now.

## 2. Fund the agent's AA wallet

The agent pays/settles from its **AA wallet** (shown in the dashboard) — *not*
the controller address. Deposit a little **USDC on Base** there. The SDK checks
this balance before sending transactions.

## 3. Register the three services

Dashboard → your agent → **+ Add Service** (pricing/SLA live here, not in code):

| Service | Requirements (Schema) | Deliverable | Suggested price |
|---------|----------------------|-------------|-----------------|
| `verify` | `{ claim, sources[] }` | Schema | 0.10 USDC |
| `recon` | `{ track, theme, description }` | Schema | 0.25 USDC |
| `validate` | `{ deliverable, schema }` | Schema | 0.02 USDC |

Set a sane SLA (e.g. 30 min). Keep services **flat-priced** (no fund transfer) —
the provider accepts with `acceptNegotiation`, which is what this code does.

## 4. Configure `.env`

> `config.ts` loads via `dotenv/config`, which reads **`.env`** (not `.env.local`).

```bash
cp .env.example .env
# set at minimum:
#   CROO_SDK_KEY=croo_sk_...
#   GITHUB_TOKEN=...                 # required for the recon service
#   AGENT_WALLET_PRIVATE_KEY=0x...   # signs receipts (separate from the AA wallet)
#   ANTHROPIC_API_KEY=...            # optional: model-graded verify + recon synthesis
```

## 5. Preflight

```bash
pnpm preflight
```

Checks env, the SDK install, your receipt signer, and a real authenticated
round-trip to the CROO API + WebSocket. Fix every `✗` before continuing — it
exits non-zero so you can't miss one.

## 6. Run the provider (go live)

```bash
pnpm worker        # LIVE: listens for negotiations + paid orders, delivers receipts
```

You should see `mode: LIVE` and `[cap] live — listening…`. Leave it running.

## 7. Prove it — one paid order end-to-end

The cleanest proof is a **second agent** hiring this one (self-hiring with the
same key may be rejected). From a funded requester agent, in another terminal:

```bash
# requester env: CROO_SDK_KEY for the *buyer* agent + the service id to hire
export CROO_TARGET_SERVICE_ID=<the verify service id>
pnpm demo "The Stellar network settles in 3-5 seconds." https://stellar.org/learn/the-power-of-stellar
```

On completion the demo prints the **on-chain proof**:

```
── settled on Base ───────────────
  status:   completed   price: 0.10 USDC
  create:   https://basescan.org/tx/0x…
  pay:      https://basescan.org/tx/0x…
  deliver:  https://basescan.org/tx/0x…
  clear:    https://basescan.org/tx/0x…
── receipt ───────────────────────
  service:     verify
  contentHash: 0x…
  signer:      0x…
  signature:   0x…
```

Screen-record this + the provider terminal for the demo video. Repeat with
`pnpm demo:recon "…"` and `pnpm demo:validate` to show all three services.

---

## What the lifecycle does on-chain

`negotiateOrder` → provider `acceptNegotiation` (creates order) → requester
`payOrder` (escrows USDC) → provider reads `negotiation.requirements`, runs the
service, `deliverOrder` (the signed receipt) → backend verifies + clears →
escrow releases: platform fee → Treasury, remainder → the agent's wallet.

If input is unusable the provider `rejectOrder`s and the buyer is refunded.

---

## Submission checklist (mirror of HACKATHON.md §submission)

- [ ] Agent + 3 services live on the Agent Store (discoverable)
- [ ] One real order settled on Base (tx hashes captured)
- [ ] Public repo, MIT license
- [ ] ≤5-min demo video + this README/runbook + SDK methods listed
- [ ] BUIDL filed on DoraHacks with repo + video

---

## Troubleshooting

- **`mode: MOCK` unexpectedly** — `CROO_SDK_KEY` is empty/whitespace, or it's in
  `.env.local` instead of `.env`.
- **`InsufficientBalanceError`** — fund the **AA wallet** (dashboard address) with
  USDC on Base, not the controller.
- **recon order rejected** — `GITHUB_TOKEN` is missing; the recon service requires it.
- **`@croo-network/sdk` not installed** — `pnpm add @croo-network/sdk`.
- **provider never accepts** — the worker isn't running, or the service is
  `require_fund_transfer=true` (use a flat-priced service, or extend the client to
  call `acceptNegotiationWithFundAddress`).
