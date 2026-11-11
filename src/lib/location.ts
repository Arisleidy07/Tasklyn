import type { Task } from "@/types";

const URL_RE = /^(https?:\/\/|www\.)/i;
const MAPS_HOST_RE =
  /(^|\.)(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|goo\.gl\/maps|maps\.app\.goo\.gl|g\.co\/kgs|google\.[a-z.]+\/\?q=|maps\.apple\.com|waze\.com)/i;

export const looksLikeUrl = (value?: string | null): boolean =>
  !!value && URL_RE.test(value.trim());

/** Ensure a pasted link has a protocol so `<a href>` opens it as an external URL. */
export const normalizeMapsUrl = (value: string): string => {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

export const isMapsUrl = (value?: string | null): boolean =>
  looksLikeUrl(value) && MAPS_HOST_RE.test(normalizeMapsUrl(value || ""));

export const buildMapsSearchUrl = (address: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;

export interface ResolvedTaskLocation {
  /** Human-readable address / place name (may be empty). */
  address: string;
  /** Link to open in Google Maps (explicit link, legacy URL stored in `location`, or search by address). */
  url: string;
  /** True when the user pasted an explicit maps link (vs. a generated search URL). */
  hasExplicitUrl: boolean;
}

/**
 * Resolve the location info of a task, tolerating legacy data where a maps
 * link was stored directly in the `location` field.
 */
export const resolveTaskLocation = (
  task: Pick<Task, "location" | "locationUrl">,
): ResolvedTaskLocation | null => {
  const rawLocation = task.location?.trim() || "";
  const rawUrl = task.locationUrl?.trim() || "";

  const legacyUrl = !rawUrl && looksLikeUrl(rawLocation) ? rawLocation : "";
  const address = legacyUrl ? "" : rawLocation;
  const explicit = rawUrl || legacyUrl;

  if (!address && !explicit) return null;

  return {
    address,
    url: explicit ? normalizeMapsUrl(explicit) : buildMapsSearchUrl(address),
    hasExplicitUrl: !!explicit,
  };
};
