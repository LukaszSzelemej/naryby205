import { closedEndingDays, SPECIES } from "@/lib/catalog";

const KEY = "atlas.tarlo";
const SW = "/atlas-sw.js";

export function tarloPref(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function tarloItems(at = new Date()) {
  return SPECIES.map((s) => {
    const days = closedEndingDays(s, at);
    return days != null ? { id: s.id, name: s.name, days } : null;
  }).filter((x): x is { id: string; name: string; days: number } => x != null);
}

function soon(at = new Date()) {
  return tarloItems(at).filter((x) => x.days <= 1);
}

async function ensureSw() {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.register(SW, { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

function payload() {
  return tarloItems().map((x) => ({ name: x.name, days: x.days }));
}

export async function setTarloPref(on: boolean): Promise<"ok" | "denied" | "unsupported"> {
  if (!on) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return "ok";
  }
  if (!("Notification" in window)) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
  const reg = await ensureSw();
  try {
    await (reg as { periodicSync?: { register: (t: string, o: { minInterval: number }) => Promise<void> } } | null)
      ?.periodicSync?.register("atlas-tarlo", { minInterval: 12 * 60 * 60 * 1000 });
  } catch {
    /* not supported */
  }
  reg?.active?.postMessage({ type: "tarlo", items: payload() });
  fireIfDue(reg);
  return "ok";
}

function fireIfDue(reg: ServiceWorkerRegistration | null) {
  const hits = soon();
  if (!hits.length || Notification.permission !== "granted") return;
  const body =
    hits[0].days === 0
      ? hits.map((h) => `${h.name}: ochrona kończy się dziś`).join(". ")
      : hits.map((h) => `${h.name}: ochrona kończy się jutro`).join(". ");
  const title = "Atlas wędkarski — tarło";
  if (reg) void reg.showNotification(title, { body, tag: "atlas-tarlo" });
  else new Notification(title, { body });
}

export async function bootTarlo() {
  if (!tarloPref()) return;
  const reg = await ensureSw();
  reg?.active?.postMessage({ type: "tarlo", items: payload() });
  fireIfDue(reg);
}
