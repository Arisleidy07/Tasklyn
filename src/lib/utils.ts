import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

export function generateId(): string {
  return uuidv4();
}

export function generateToken(): string {
  return nanoid(24);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatActivityDateTime(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString("es-ES", { month: "long" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} ${year} • ${time}`;
}

/**
 * Detect and convert phone numbers to clickable tel: links
 * Supports various formats: 8095551234, (809) 555-1234, +1-809-555-1234
 */
export function linkifyPhoneNumbers(text: string): string {
  // Phone number regex - matches various formats
  const phoneRegex =
    /(?:(?:\+?1[-.\s]?)?(?:\(?([0-9]{3})\)?[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{4}))/g;

  return text.replace(phoneRegex, (match, areaCode, prefix, line) => {
    // Clean the number for tel: link (remove all non-digits, keep + if present)
    const cleanNumber = match.replace(/[^\d+]/g, "");
    return `<a href="tel:${cleanNumber}" class="text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2 hover:decoration-2 transition-colors font-medium">${match}</a>`;
  });
}
