import { config } from "../config";
import { fetchUrl } from "./tools";
import type { VerifyResult } from "../provenance/receipt";

/**
 * The service Elfgents sells: take a claim plus the sources the caller gives
 * us, read the sources, and decide whether they actually support the claim.
 * Returns a verdict with citations — the raw material for a provenance
 * receipt.
 *
 * Two paths:
 *  - with an ANTHROPIC_API_KEY: the model reads each source and judges support.
 *  - without one: a deterministic keyword-overlap heuristic, so the agent
 *    still returns a real, reproducible verdict offline. Good enough to demo
 *    the full CAP lifecycle; swap the key in for real judgement.
 */
export type VerifyInput = {
  claim: string;
  sources: string[]; // URLs the caller wants checked
};

export async function verifyClaim(input: VerifyInput): Promise<VerifyResult> {
  const claim = (input.claim ?? "").trim();
  const sources = (input.sources ?? []).filter(Boolean).slice(0, 5);

  if (!claim) {
    return {
      claim,
      verdict: "unclear",
      confidence: 0,
      citations: [],
      reasoning: "No claim provided.",
      model: "none",
    };
  }

  const fetched = await Promise.all(sources.map((u) => fetchUrl(u)));
  const readable = fetched.filter((f) => f.ok);

  if (readable.length === 0) {
    return {
      claim,
      verdict: "unclear",
      confidence: 0.1,
      citations: [],
      reasoning: "Could not read any of the provided sources.",
      model: config.anthropic.key ? config.anthropic.model : "heuristic",
    };
  }

  if (config.anthropic.key) {
    return judgeWithModel(claim, readable);
  }
  return judgeWithHeuristic(claim, readable);
}

/* --------- deterministic offline judge (no key needed) ------------------- */
function judgeWithHeuristic(
  claim: string,
  sources: Array<{ url: string; text: string }>,
): VerifyResult {
  const terms = claim
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const unique = Array.from(new Set(terms));

  let best = { url: "", quote: "", score: 0 };
  for (const s of sources) {
    const hay = s.text.toLowerCase();
    const hits = unique.filter((t) => hay.includes(t)).length;
    const score = unique.length ? hits / unique.length : 0;
    if (score > best.score) {
      const idx = hay.indexOf(unique.find((t) => hay.includes(t)) ?? "");
      best = {
        url: s.url,
        quote: s.text.slice(Math.max(0, idx - 40), idx + 160).trim(),
        score,
      };
    }
  }

  const verdict = best.score >= 0.6 ? "supported" : best.score >= 0.3 ? "unclear" : "refuted";
  return {
    claim,
    verdict,
    confidence: Number(best.score.toFixed(2)),
    citations: best.url ? [{ url: best.url, quote: best.quote }] : [],
    reasoning:
      `Heuristic term-overlap check across ${sources.length} source(s). ` +
      `Best source matched ${Math.round(best.score * 100)}% of claim terms. ` +
      `(Set ANTHROPIC_API_KEY for model-graded judgement.)`,
    model: "heuristic",
  };
}

/* --------- model-graded judge (with key) --------------------------------- */
async function judgeWithModel(
  claim: string,
  sources: Array<{ url: string; text: string }>,
): Promise<VerifyResult> {
  // Lazy import so the web build never bundles the SDK.
  const Anthropic = (await import("@anthropic-ai/sdk").catch(() => null)) as any;
  if (!Anthropic) return judgeWithHeuristic(claim, sources);

  const client = new Anthropic.default({ apiKey: config.anthropic.key });
  const corpus = sources
    .map((s, i) => `[${i + 1}] ${s.url}\n${s.text.slice(0, 4000)}`)
    .join("\n\n");

  const msg = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 700,
    system:
      "You are a strict fact-checker. Decide whether the SOURCES support the " +
      "CLAIM. Reply as compact JSON: {verdict:'supported'|'refuted'|'unclear'," +
      "confidence:0..1, citations:[{url,quote}], reasoning}. Quote only text " +
      "that appears verbatim in a source. Default to 'unclear' if the sources " +
      "do not directly address the claim. Output JSON only.",
    messages: [{ role: "user", content: `CLAIM:\n${claim}\n\nSOURCES:\n${corpus}` }],
  });

  const text = (msg.content?.[0]?.text ?? "{}").trim().replace(/^```json|```$/g, "");
  try {
    const j = JSON.parse(text);
    return {
      claim,
      verdict: ["supported", "refuted", "unclear"].includes(j.verdict) ? j.verdict : "unclear",
      confidence: Math.max(0, Math.min(1, Number(j.confidence) || 0)),
      citations: Array.isArray(j.citations) ? j.citations.slice(0, 4) : [],
      reasoning: String(j.reasoning ?? "").slice(0, 600),
      model: config.anthropic.model,
    };
  } catch {
    return judgeWithHeuristic(claim, sources);
  }
}
