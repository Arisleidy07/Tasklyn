import type { Task } from "@/types";

const PROTOCOL_RE = /^(https?:\/\/|www\.)/i;

/** True when the value starts like a URL (has a protocol or www.). */
export const looksLikeUrl = (value?: string | null): boolean =>
  !!value && PROTOCOL_RE.test(value.trim());

/**
 * Returns the value as an absolute http(s) URL, or null when it is not a
 * valid http(s) URL. Never invents protocols for plain text.
 */
export const toHttpUrl = (value?: string | null): URL | null => {
  const v = value?.trim();
  if (!v) return null;
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
};

/** Normalize a validated maps URL for storage (ensures https://). */
export const normalizeMapsUrl = (value: string): string => {
  const url = toHttpUrl(value);
  return url ? url.toString() : "";
};

/**
 * True only for URLs that are genuinely Google Maps links:
 * - maps.app.goo.gl / goo.gl/maps / g.co/kgs short links
 * - *.google.<tld>/maps... and maps.google.<tld> hosts
 * Rejects other domains (YouTube, etc.) and plain text.
 */
export const isMapsUrl = (value?: string | null): boolean => {
  const url = toHttpUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl") return path.startsWith("/maps");
  if (host === "g.co") return path.startsWith("/kgs");

  const isGoogleHost = /(^|\.)google\.[a-z.]+$/.test(host);
  const isMapsGoogleHost = /(^|\.)maps\.google\.[a-z.]+$/.test(host);
  if (!isGoogleHost && !isMapsGoogleHost) return false;

  return path === "/maps" || path.startsWith("/maps/") || path.startsWith("/maps?");
};

/** True when the value is non-empty but is NOT a valid maps URL. */
export const isInvalidMapsInput = (value?: string | null): boolean => {
  const v = value?.trim();
  return !!v && !isMapsUrl(v);
};

export const buildMapsSearchUrl = (address: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;

export interface ResolvedTaskLocation {
  /** Human-readable address / place name (may be empty). */
  address: string;
  /** Link to open in Google Maps (explicit link, legacy URL stored in `location`, or search by address). */
  url: string;
  /** The explicit maps link saved by the user (empty when only an address exists). */
  explicitUrl: string;
  /** True when the user pasted an explicit maps link (vs. a generated search URL). */
  hasExplicitUrl: boolean;
}

/**
 * Resolve the location info of a task, tolerating legacy data where a maps
 * link was stored directly in the `location` field. Only genuine Google
 * Maps URLs are treated as links; anything else stays plain text.
 */
export const resolveTaskLocation = (
  task: Pick<Task, "location" | "locationUrl">,
): ResolvedTaskLocation | null => {
  const rawLocation = task.location?.trim() || "";
  const rawUrl = task.locationUrl?.trim() || "";

  // Legacy: a maps URL saved inside `location` (only when it really is maps)
  const legacyUrl = !rawUrl && isMapsUrl(rawLocation) ? rawLocation : "";
  const address = legacyUrl ? "" : rawLocation;
  const explicit = rawUrl && isMapsUrl(rawUrl) ? rawUrl : legacyUrl;

  if (!address && !explicit) return null;

  const explicitUrl = explicit ? normalizeMapsUrl(explicit) : "";
  return {
    address,
    url: explicitUrl || buildMapsSearchUrl(address),
    explicitUrl,
    hasExplicitUrl: !!explicitUrl,
  };
};
