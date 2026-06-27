import { verifyClaim } from "./verify";
import { runRecon, type ReconBrief } from "./recon";
import { validateDeliverable } from "./validate";

/**
 * The service router — Elfgents lists several services, so an incoming CAP
 * order has to be dispatched to the right handler.
 *
 * In production the order carries the serviceId you registered in the dashboard;
 * we also discriminate on the input shape so the same worker handles every
 * service and the MOCK demo works without real service ids:
 *   - { deliverable, schema }            -> validate
 *   - { claim, sources }                 -> verify
 *   - { hackathon | track | theme | ... } -> recon
 *
 * Each handler returns the result payload; the listener wraps it in a signed
 * receipt tagged with the service name.
 */
export type ServiceName = "verify" | "recon" | "validate";

export type RoutedResult =
  | { service: "verify"; result: Awaited<ReturnType<typeof verifyClaim>> }
  | { service: "recon"; result: Awaited<ReturnType<typeof runRecon>> }
  | { service: "validate"; result: ReturnType<typeof validateDeliverable> };

export class UnroutableOrderError extends Error {}

export function pickService(input: any): ServiceName {
  if (input?.schema != null && "deliverable" in (input ?? {})) return "validate";
  if (input?.claim != null) return "verify";
  if (input?.hackathon || input?.track || input?.theme || input?.description || input?.keywords) {
    return "recon";
  }
  throw new UnroutableOrderError(
    "Order input matched no service. Send { deliverable, schema } for validate, " +
      "{ claim, sources } for verify, or { track, theme, description } for recon.",
  );
}

export async function routeOrder(input: any): Promise<RoutedResult> {
  const service = pickService(input);
  if (service === "validate") {
    return { service, result: validateDeliverable({ deliverable: input.deliverable, schema: input.schema }) };
  }
  if (service === "recon") {
    const brief: ReconBrief = {
      hackathon: input.hackathon,
      track: input.track,
      theme: input.theme,
      description: input.description,
      keywords: input.keywords,
    };
    return { service, result: await runRecon(brief) };
  }
  return {
    service,
    result: await verifyClaim({ claim: input.claim, sources: input.sources ?? [] }),
  };
}
