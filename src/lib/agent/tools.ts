/**
 * Tools the verifier can call inside its loop. Same shape as Elf's Cowork
 * tools: { name, description, input_schema, handler }. The description is the
 * part that matters — it's how the model decides when to reach for a tool,
 * and on CROO it's also what a buyer reads before hiring you.
 */
export type Tool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  handler: (args: Record<string, any>) => Promise<unknown>;
};

/** Fetch a source URL and return readable-ish text (HTML stripped). */
async function fetchUrl(url: string): Promise<{ url: string; text: string; ok: boolean }> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "elfgents-verifier/0.1" } });
    if (!res.ok) return { url, text: `HTTP ${res.status}`, ok: false };
    const raw = await res.text();
    const text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    return { url, text, ok: true };
  } catch (err) {
    return { url, text: `fetch failed: ${(err as Error).message}`, ok: false };
  }
}

export const verifierTools: Tool[] = [
  {
    name: "fetch_source",
    description:
      "Fetch the text of a source URL so you can check whether it actually " +
      "supports the claim. Always fetch a source before citing it — never " +
      "cite a URL you have not read.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string", description: "The source URL to read." } },
      required: ["url"],
    },
    handler: async (args) => fetchUrl(String(args.url)),
  },
];

export { fetchUrl };
