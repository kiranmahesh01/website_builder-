/**
 * OmniRoute — self-hosted OpenAI-compatible gateway.
 * @see https://github.com/diegosouzapw/OmniRoute
 *
 * Default local base: http://127.0.0.1:20128/v1
 * Model `auto` lets OmniRoute pick from connected free/paid backends.
 */

export const DEFAULT_OMNIROUTE_BASE_URL = "http://127.0.0.1:20128/v1";
export const DEFAULT_OMNIROUTE_MODEL = "auto";

export type OmniRouteModelOption = {
  id: string;
  label: string;
  role: string;
};

export const OMNIROUTE_MODEL_OPTIONS: OmniRouteModelOption[] = [
  {
    id: "auto",
    label: "Auto — OmniRoute smart route",
    role: "Routes across connected free/paid backends with failover",
  },
];

export function defaultOmniRouteModel(): string {
  return process.env.OMNIROUTE_MODEL?.trim() || DEFAULT_OMNIROUTE_MODEL;
}

export function omnrouteBaseUrl(): string {
  const raw =
    process.env.OMNIROUTE_BASE_URL?.trim() || DEFAULT_OMNIROUTE_BASE_URL;
  return raw.replace(/\/+$/, "");
}

/** True when Magic AI should expose OmniRoute as a configured provider. */
export function hasOmniRoute(): boolean {
  return Boolean(
    process.env.OMNIROUTE_BASE_URL?.trim() ||
      process.env.OMNIROUTE_API_KEY?.trim(),
  );
}

export function isAllowedOmniRouteModel(id?: string | null): boolean {
  if (!id?.trim()) return false;
  const model = id.trim();
  if (model === "auto") return true;
  // OmniRoute catalogs use provider/model prefixes (e.g. oc/…, felo/…).
  return model.length > 0 && !model.includes(" ");
}

export function isRetryableOmniRouteError(message: string): boolean {
  return /429|rate|404|unavailable|overloaded|capacity|timeout|500|502|503|504|529|empty response|invalid json|ECONNREFUSED|fetch failed|network/i.test(
    message,
  );
}
