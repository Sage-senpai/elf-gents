import { keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config";

/**
 * Provenance receipts — the part lifted straight from Elf's audit layer.
 *
 * Elf hashed every agent run and anchored it on-chain so "the agent did X on
 * date Y" was provable, not trust-me. Here that same idea is the *product*:
 * the verifier returns a signed, content-addressed receipt that the hiring
 * agent can attach to its own CAP delivery. That's what makes a delivery
 * "verified" instead of "claimed".
 *
 * The receipt is hash-chained (each one carries the previous hash) so a buyer
 * can audit a whole run of jobs as a tamper-evident sequence.
 */

export type VerifyResult = {
  claim: string;
  verdict: "supported" | "refuted" | "unclear";
  confidence: number; // 0..1
  citations: Array<{ url: string; quote: string }>;
  reasoning: string;
  model: string;
};

/** A receipt wraps any service's result payload `T` — verify or recon. */
export type Receipt<T = unknown> = {
  v: 1;
  service: string; // which service produced this ("verify" | "recon" | ...)
  job: string; // CAP order id
  result: T;
  contentHash: `0x${string}`; // keccak256 of the canonical result
  previousHash: `0x${string}` | null; // hash-chain link
  issuedAt: string; // ISO 8601 (passed in — keeps this pure/deterministic)
  signer: `0x${string}` | null;
  signature: `0x${string}` | null;
};

/**
 * Deterministic canonical JSON: recursively sort object keys so the same
 * logical result always hashes to the same bytes, regardless of the order a
 * service happened to build the object in. Works for any service's payload.
 */
function canonical(value: unknown): string {
  const seen = new WeakSet();
  const norm = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return null;
    seen.add(v);
    if (Array.isArray(v)) return v.map(norm);
    return Object.keys(v)
      .sort()
      .reduce((acc, k) => {
        acc[k] = norm(v[k]);
        return acc;
      }, {} as Record<string, any>);
  };
  return JSON.stringify(norm(value));
}

export function hashResult(result: unknown): `0x${string}` {
  return keccak256(toBytes(canonical(result)));
}

/**
 * Build (and optionally sign) a receipt. `issuedAt` is injected by the caller
 * so this function stays deterministic and testable.
 */
export async function makeReceipt<T>(input: {
  service: string;
  orderId: string;
  result: T;
  previousHash: `0x${string}` | null;
  issuedAt: string;
}): Promise<Receipt<T>> {
  const contentHash = hashResult(input.result);

  let signer: `0x${string}` | null = null;
  let signature: `0x${string}` | null = null;

  if (config.walletKey) {
    const account = privateKeyToAccount(config.walletKey);
    signer = account.address;
    // sign the content hash so anyone can verify the agent really issued it
    signature = await account.signMessage({ message: { raw: contentHash } });
  }

  return {
    v: 1,
    service: input.service,
    job: input.orderId,
    result: input.result,
    contentHash,
    previousHash: input.previousHash,
    issuedAt: input.issuedAt,
    signer,
    signature,
  };
}
