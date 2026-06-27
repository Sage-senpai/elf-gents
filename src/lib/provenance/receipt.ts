import { keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "@/lib/config";

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

export type Receipt = {
  v: 1;
  job: string; // CAP order id
  result: VerifyResult;
  contentHash: `0x${string}`; // keccak256 of the canonical result
  previousHash: `0x${string}` | null; // hash-chain link
  issuedAt: string; // ISO 8601 (passed in — keeps this pure/deterministic)
  signer: `0x${string}` | null;
  signature: `0x${string}` | null;
};

function canonical(result: VerifyResult): string {
  // stable key order so the same result always hashes the same way
  return JSON.stringify({
    claim: result.claim,
    verdict: result.verdict,
    confidence: result.confidence,
    citations: result.citations.map((c) => ({ url: c.url, quote: c.quote })),
    model: result.model,
  });
}

export function hashResult(result: VerifyResult): `0x${string}` {
  return keccak256(toBytes(canonical(result)));
}

/**
 * Build (and optionally sign) a receipt. `issuedAt` is injected by the caller
 * so this function stays deterministic and testable.
 */
export async function makeReceipt(input: {
  orderId: string;
  result: VerifyResult;
  previousHash: `0x${string}` | null;
  issuedAt: string;
}): Promise<Receipt> {
  const contentHash = hashResult(input.result);

  let signer: `0x${string}` | null = null;
  let signature: `0x${string}` | null = null;

  if (config.walletKey) {
    const account = privateKeyToAccount(config.walletKey);
    signer = account.address;
    // sign the content hash so anyone can verify the verifier really issued it
    signature = await account.signMessage({ message: { raw: contentHash } });
  }

  return {
    v: 1,
    job: input.orderId,
    result: input.result,
    contentHash,
    previousHash: input.previousHash,
    issuedAt: input.issuedAt,
    signer,
    signature,
  };
}
