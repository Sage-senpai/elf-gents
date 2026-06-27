import { requireGithubToken } from "../config";
import type { Tool } from "./tools";

/**
 * Developer tools — the part the existing agent was missing.
 *
 * The verifier only ever needed `fetch_source`. The `recon` service needs to
 * actually go *into* GitHub: search repos and code, read READMEs, inspect a
 * project's shape. These are real GitHub REST calls (no scraping), exposed in
 * the same { name, description, input_schema, handler } shape the loop already
 * speaks, so the agentic loop in `loop.ts` can reach for them mid-think.
 *
 * Every call is authenticated — GITHUB_TOKEN is required (5000 req/hr + code
 * search). The description field is doing double duty: it's how the model
 * decides when to call a tool, and on CROO it's what a buyer reads.
 */

const API = "https://api.github.com";

async function gh(path: string, params?: Record<string, string | number>): Promise<any> {
  const token = requireGithubToken();
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "elfgents-recon/0.1",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/* ----------------------------- raw helpers ------------------------------- */
/** These back both the tool handlers and the deterministic recon path. */

export type RepoHit = {
  repo: string; // owner/name
  url: string;
  description: string;
  stars: number;
  language: string | null;
  topics: string[];
  pushedAt: string;
};

function toRepoHit(item: any): RepoHit {
  return {
    repo: item.full_name,
    url: item.html_url,
    description: item.description ?? "",
    stars: item.stargazers_count ?? 0,
    language: item.language ?? null,
    topics: item.topics ?? [],
    pushedAt: item.pushed_at ?? "",
  };
}

export async function searchRepos(
  query: string,
  opts: { sort?: "stars" | "updated"; perPage?: number } = {},
): Promise<RepoHit[]> {
  const data = await gh("/search/repositories", {
    q: query,
    sort: opts.sort ?? "stars",
    order: "desc",
    per_page: Math.min(opts.perPage ?? 8, 30),
  });
  return (data.items ?? []).map(toRepoHit);
}

export async function searchCode(query: string, perPage = 5): Promise<
  Array<{ repo: string; path: string; url: string }>
> {
  const data = await gh("/search/code", { q: query, per_page: Math.min(perPage, 20) });
  return (data.items ?? []).map((i: any) => ({
    repo: i.repository?.full_name ?? "",
    path: i.path,
    url: i.html_url,
  }));
}

export async function getRepo(fullName: string): Promise<RepoHit & { topics: string[] }> {
  const item = await gh(`/repos/${fullName}`);
  return toRepoHit(item);
}

/** README, decoded, trimmed to something a model can read cheaply. */
export async function readReadme(fullName: string, maxChars = 4000): Promise<string> {
  try {
    const data = await gh(`/repos/${fullName}/readme`);
    const raw = Buffer.from(data.content ?? "", data.encoding ?? "base64").toString("utf8");
    return raw.replace(/\s+\n/g, "\n").trim().slice(0, maxChars);
  } catch {
    return "";
  }
}

/* ------------------------------- as tools -------------------------------- */
export const devTools: Tool[] = [
  {
    name: "github_search_repos",
    description:
      "Search public GitHub repositories. Use this to find prior art, reference " +
      "implementations, and past hackathon projects related to a theme. Supports " +
      "GitHub search qualifiers, e.g. 'stellar payments stars:>50 pushed:>2025-01-01'. " +
      "Returns repos sorted by stars with description, language, and topics.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "GitHub repo search query (qualifiers allowed)." },
        sort: { type: "string", enum: ["stars", "updated"], description: "Ranking. Default stars." },
      },
      required: ["query"],
    },
    handler: async (args) =>
      searchRepos(String(args.query), { sort: args.sort === "updated" ? "updated" : "stars" }),
  },
  {
    name: "github_search_code",
    description:
      "Search code across public GitHub for a specific symbol, import, or API call " +
      "(e.g. 'AgentClient deliverOrder language:ts'). Use it to see how others wired " +
      "a specific SDK or pattern. Returns repo + file path matches.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "GitHub code search query." } },
      required: ["query"],
    },
    handler: async (args) => searchCode(String(args.query)),
  },
  {
    name: "github_read_readme",
    description:
      "Read a repository's README so you can judge what it actually does and what is " +
      "reusable. Always read a repo's README before recommending it — never recommend " +
      "a repo from its name alone.",
    input_schema: {
      type: "object",
      properties: { repo: { type: "string", description: "owner/name, e.g. 'stellar/soroban-examples'." } },
      required: ["repo"],
    },
    handler: async (args) => ({ repo: args.repo, readme: await readReadme(String(args.repo)) }),
  },
  {
    name: "github_get_repo",
    description:
      "Fetch a single repository's metadata (stars, language, topics, last push) by " +
      "owner/name. Use to confirm a project is real and maintained before citing it.",
    input_schema: {
      type: "object",
      properties: { repo: { type: "string", description: "owner/name." } },
      required: ["repo"],
    },
    handler: async (args) => getRepo(String(args.repo)),
  },
];
