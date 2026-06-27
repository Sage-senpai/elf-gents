import { config, requireGithubToken } from "../config";
import { searchRepos, readReadme, devTools, type RepoHit } from "./devtools";
import { runAgentLoop } from "./loop";

/**
 * The second service Elfgents sells: **hackathon prior-art recon**.
 *
 * A builder (or their agent) hands us a hackathon brief — track, theme, what
 * they want to build — and we go into GitHub and surface the existing and past
 * projects worth knowing about before they start: reference implementations to
 * borrow from, prior hackathon winners in the space, and the gap they can
 * actually claim. The deliverable is a scored, cited report that becomes a
 * signed receipt, same as the verifier.
 *
 * Two paths, mirroring verify.ts:
 *  - deterministic gather (always): derive queries from the brief, search
 *    GitHub, dedupe + rank by stars/recency, read READMEs. Real data, no model.
 *  - with ANTHROPIC_API_KEY: a final structured pass writes the "why it's
 *    relevant / what to reuse" notes and the overall strategy. Without a key,
 *    those come from topics + description heuristically.
 *
 * GITHUB_TOKEN is required either way — the dev tools genuinely hit GitHub.
 */

export type ReconBrief = {
  hackathon?: string; // e.g. "CROO Agent Hackathon"
  track?: string; // e.g. "Research & Intelligence"
  theme?: string; // e.g. "verifiable agent-to-agent commerce"
  description?: string; // free text: what the user wants to build
  keywords?: string[]; // optional explicit search terms
};

export type ReconProject = {
  repo: string; // owner/name
  url: string;
  stars: number;
  language: string | null;
  topics: string[];
  why: string; // why it's relevant to this brief
  reuse: string; // what's worth borrowing
};

export type ReconResult = {
  brief: string; // normalized one-line brief
  track?: string;
  queries: string[]; // the GitHub searches we ran
  projects: ReconProject[];
  strategy: string; // synthesized angle: the gap to claim
  model: string; // "heuristic" or the model id
};

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "our",
  "build", "building", "make", "want", "agent", "agents", "using", "use", "into",
  "app", "project", "hackathon", "track", "based", "off", "across", "existing",
]);

function keywords(brief: ReconBrief): string[] {
  if (brief.keywords?.length) return brief.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 8);
  const blob = [brief.theme, brief.description, brief.track].filter(Boolean).join(" ");
  const words = blob
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  return Array.from(new Set(words)).slice(0, 6);
}

function buildQueries(brief: ReconBrief, terms: string[]): string[] {
  const head = terms.slice(0, 4).join(" ");
  const queries = new Set<string>();
  if (head) queries.add(`${head} stars:>10`);
  // an A2A/agent-economy angle, since that's the hackathon's whole premise
  if (head) queries.add(`${terms.slice(0, 3).join(" ")} agent stars:>5`);
  // prior hackathon work tends to be tagged
  if (terms[0]) queries.add(`${terms[0]} ${terms[1] ?? ""} topic:hackathon`.trim());
  return Array.from(queries).slice(0, 3);
}

function oneLineBrief(brief: ReconBrief): string {
  return (
    [brief.hackathon, brief.track, brief.theme, brief.description]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 240) || "(empty brief)"
  );
}

/** Gather + rank repos across the queries. Pure GitHub, no model. */
async function gather(queries: string[]): Promise<RepoHit[]> {
  const buckets = await Promise.all(
    queries.map((q) => searchRepos(q, { sort: "stars", perPage: 8 }).catch(() => [])),
  );
  const byRepo = new Map<string, RepoHit>();
  for (const hit of buckets.flat()) {
    if (!byRepo.has(hit.repo)) byRepo.set(hit.repo, hit);
  }
  return Array.from(byRepo.values())
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);
}

/** Main entry: the recon deliverable. */
export async function runRecon(brief: ReconBrief): Promise<ReconResult> {
  requireGithubToken(); // fail fast + loud — recon genuinely needs GitHub
  const terms = keywords(brief);
  const queries = buildQueries(brief, terms);
  const briefLine = oneLineBrief(brief);

  if (queries.length === 0) {
    return {
      brief: briefLine,
      track: brief.track,
      queries: [],
      projects: [],
      strategy: "Brief was too thin to search. Provide a theme, track, or description.",
      model: "none",
    };
  }

  const repos = await gather(queries);
  // read READMEs for the top few (caps GitHub calls)
  const readmes = await Promise.all(
    repos.slice(0, 4).map((r) => readReadme(r.repo, 2500).then((md) => ({ repo: r.repo, md }))),
  );
  const readmeByRepo = Object.fromEntries(readmes.map((r) => [r.repo, r.md]));

  if (config.anthropic.key) {
    return synthesizeWithModel(brief, briefLine, queries, repos, readmeByRepo);
  }
  return synthesizeHeuristic(brief, briefLine, queries, repos);
}

/* --------- deterministic synthesis (no key) ------------------------------ */
function synthesizeHeuristic(
  brief: ReconBrief,
  briefLine: string,
  queries: string[],
  repos: RepoHit[],
): ReconResult {
  const projects: ReconProject[] = repos.map((r) => ({
    repo: r.repo,
    url: r.url,
    stars: r.stars,
    language: r.language,
    topics: r.topics,
    why:
      `Matches the brief on ${r.topics.slice(0, 3).join(", ") || r.language || "theme"}. ` +
      (r.description ? `"${r.description.slice(0, 120)}"` : ""),
    reuse:
      r.language
        ? `${r.language} project — read its README for patterns to adapt.`
        : "Read its README for patterns to adapt.",
  }));
  const top = projects[0];
  const strategy =
    `Found ${projects.length} prior-art repos. The space is ` +
    (top && top.stars > 500 ? "crowded — differentiate on the A2A/payment angle and verifiable delivery, "
      : "relatively open — ") +
    `which CAP rewards. Set ANTHROPIC_API_KEY for a sharper, model-written strategy.`;
  return { brief: briefLine, track: brief.track, queries, projects, strategy, model: "heuristic" };
}

/* --------- model synthesis (with key) ------------------------------------ */
async function synthesizeWithModel(
  brief: ReconBrief,
  briefLine: string,
  queries: string[],
  repos: RepoHit[],
  readmeByRepo: Record<string, string>,
): Promise<ReconResult> {
  const Anthropic = (await import("@anthropic-ai/sdk").catch(() => null)) as any;
  if (!Anthropic) return synthesizeHeuristic(brief, briefLine, queries, repos);

  const client = new Anthropic.default({ apiKey: config.anthropic.key });
  const corpus = repos
    .map((r, i) => {
      const md = readmeByRepo[r.repo] ? `\nREADME:\n${readmeByRepo[r.repo]}` : "";
      return `[${i + 1}] ${r.repo} (★${r.stars}, ${r.language ?? "?"}, topics: ${r.topics.join(", ")})\n${r.description}${md}`;
    })
    .join("\n\n---\n\n");

  const msg = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 1200,
    system:
      "You are a hackathon recon analyst. Given a builder's brief and a list of " +
      "existing GitHub projects (with READMEs), for each project write a one-sentence " +
      "'why' (why it's relevant to THIS brief) and a one-sentence 'reuse' (the most " +
      "concrete thing to borrow). Then write a 'strategy': the gap or angle the builder " +
      "should claim to stand out, grounded in what already exists. Be specific and honest " +
      "— if the space is crowded, say so. Reply as compact JSON: " +
      "{projects:[{repo,why,reuse}], strategy}. Output JSON only.",
    messages: [
      { role: "user", content: `BRIEF:\n${briefLine}\n\nEXISTING PROJECTS:\n${corpus}` },
    ],
  });

  const text = (msg.content?.[0]?.text ?? "{}").trim().replace(/^```json|```$/g, "");
  try {
    const j = JSON.parse(text);
    const notes = new Map<string, { why?: string; reuse?: string }>(
      (j.projects ?? []).map((p: any) => [p.repo, { why: p.why, reuse: p.reuse }]),
    );
    const projects: ReconProject[] = repos.map((r) => ({
      repo: r.repo,
      url: r.url,
      stars: r.stars,
      language: r.language,
      topics: r.topics,
      why: notes.get(r.repo)?.why ?? r.description ?? "",
      reuse: notes.get(r.repo)?.reuse ?? "See README.",
    }));
    return {
      brief: briefLine,
      track: brief.track,
      queries,
      projects,
      strategy: String(j.strategy ?? "").slice(0, 800),
      model: config.anthropic.model,
    };
  } catch {
    return synthesizeHeuristic(brief, briefLine, queries, repos);
  }
}

/* --------- agentic mode: let the model drive the dev tools --------------- */
/**
 * The "harder mode" from loop.ts: instead of a fixed query plan, the model
 * decides which GitHub searches to run, reads what it finds, and iterates.
 * Returns a free-text brief (not the structured ReconResult) — handy for a
 * richer report or a demo of the dev tools in a real tool-call loop.
 */
export async function runReconAgentic(brief: ReconBrief): Promise<string> {
  return runAgentLoop({
    system:
      "You are a hackathon recon analyst with GitHub dev tools. Find the existing and " +
      "past projects most worth knowing about for the builder's brief. Search, read " +
      "READMEs of the most promising repos, then output a short report: the top 5 repos " +
      "(owner/name + one line on what to reuse) and the single best angle to differentiate. " +
      "Always read a repo before recommending it.",
    messages: [{ role: "user", content: `BRIEF:\n${oneLineBrief(brief)}` }],
    tools: devTools,
    maxTurns: 8,
  });
}
