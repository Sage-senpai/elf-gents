import { config } from "@/lib/config";
import type { Tool } from "@/lib/agent/tools";

/**
 * The agentic loop — the engine, ported from Elf's Cowork tool-call loop.
 *
 * `verify.ts` is a constrained specialization (caller hands us the sources).
 * This generic loop is here for the harder mode: when the agent has to decide
 * *which* sources to fetch itself, it thinks, calls a tool, reads the result,
 * and repeats until it can answer — the same think -> act -> observe -> repeat
 * shape the whole pitch is built on. Bounded turns so it can't run up a bill.
 */
export type LoopMessage = { role: "user" | "assistant"; content: any };

export async function runAgentLoop(opts: {
  system: string;
  messages: LoopMessage[];
  tools: Tool[];
  maxTurns?: number;
}): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk").catch(() => null)) as any;
  if (!Anthropic || !config.anthropic.key) {
    throw new Error("runAgentLoop needs ANTHROPIC_API_KEY. Use verifyClaim() for the offline path.");
  }
  const client = new Anthropic.default({ apiKey: config.anthropic.key });
  const byName = Object.fromEntries(opts.tools.map((t) => [t.name, t]));
  const schema = opts.tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
  const messages = [...opts.messages];

  for (let turn = 0; turn < (opts.maxTurns ?? 6); turn++) {
    const msg = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 1024,
      system: opts.system,
      tools: schema,
      messages,
    });
    messages.push({ role: "assistant", content: msg.content });

    if (msg.stop_reason !== "tool_use") {
      const text = (msg.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      return text;
    }

    const results = [];
    for (const block of msg.content.filter((b: any) => b.type === "tool_use")) {
      const tool = byName[block.name];
      const out = tool ? await tool.handler(block.input) : { error: "unknown tool" };
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(out) });
    }
    messages.push({ role: "user", content: results });
  }
  return ""; // hit the turn cap
}
