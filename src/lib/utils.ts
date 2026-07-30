import { customAlphabet } from "nanoid";

const slugify = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${base || "site"}-${slugify()}`;
}

export function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 48) return cleaned || "Untitled site";
  return `${cleaned.slice(0, 45)}...`;
}
