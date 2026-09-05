import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Polish 9-digit numbers written as 3+3+3 groups, optional +48. */
const PHONE_RE = /(?:\+48[\s.-]?)?(?:\d{3}[\s.-]){2}\d{3}/g;

export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("48")) return d.slice(2);
  if (d.length === 9) return d;
  return null;
}

export function formatPlPhone(n: string): string {
  const d = normalizePhone(n) ?? n.replace(/\D/g, "");
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return n;
}

export function telHref(n: string): string {
  const d = normalizePhone(n);
  return d ? `tel:+48${d}` : `tel:${n}`;
}

export function phonesIn(...chunks: Array<string | string[] | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of chunks) {
    const texts = Array.isArray(c) ? c : c ? [c] : [];
    for (const t of texts) {
      for (const m of t.matchAll(PHONE_RE)) {
        const n = normalizePhone(m[0]);
        if (n && !seen.has(n)) {
          seen.add(n);
          out.push(n);
        }
      }
    }
  }
  return out;
}

export function splitPhoneParts(text: string): Array<{ t: string; tel?: string }> {
  const parts: Array<{ t: string; tel?: string }> = [];
  let last = 0;
  for (const m of text.matchAll(PHONE_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ t: text.slice(last, start) });
    const n = normalizePhone(m[0]);
    parts.push(n ? { t: formatPlPhone(n), tel: telHref(n) } : { t: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last) });
  return parts;
}

export function openExternal(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* iframe / permission */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  } catch {
    return false;
  }
}
