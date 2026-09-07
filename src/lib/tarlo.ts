import { closedEndingDays, SPECIES } from "@/lib/catalog";

const KEY = "atlas.tarlo";
const HYDRO_KEY = "atlas.hydro";
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

function urlBase64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensureSw() {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.register(SW, { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

function payload() {
  return tarloItems().map((x) => ({
    name: x.name,
    end: Date.now() + x.days * 86_400_000,
  }));
}

export function hydroPref(): boolean {
  try {
    return localStorage.getItem(HYDRO_KEY) === "1";
  } catch {
    return false;
  }
}

async function subscribePush(reg: ServiceWorkerRegistration) {
  if (!("PushManager" in window)) return;
  const info = await fetch("/api/push").then((r) => r.json() as Promise<{ publicKey?: string }>);
  if (!info?.publicKey) return;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(info.publicKey),
  });
  await fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sub,
      tarlo: tarloPref(),
      hydro: hydroPref(),
    }),
  });
}

export async function setTarloPref(on: boolean): Promise<"ok" | "denied" | "unsupported"> {
  if (!on) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    const reg = await ensureSw();
    if (reg) {
      try {
        await subscribePush(reg);
      } catch {
        /* ignore */
      }
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
  if (reg) {
    try {
      await subscribePush(reg);
    } catch {
      /* iOS needs installed PWA */
    }
    reg.active?.postMessage({ type: "tarlo", items: payload() });
  }
  fireIfDue(reg);
  void fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tick: true }),
  }).catch(() => undefined);
  return "ok";
}

export async function setHydroPref(on: boolean): Promise<"ok" | "denied" | "unsupported"> {
  if (!on) {
    try {
      localStorage.removeItem(HYDRO_KEY);
    } catch {
      /* ignore */
    }
    const reg = await ensureSw();
    if (reg) {
      try {
        await subscribePush(reg);
      } catch {
        /* ignore */
      }
    }
    return "ok";
  }
  if (!("Notification" in window)) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    localStorage.setItem(HYDRO_KEY, "1");
  } catch {
    /* ignore */
  }
  const reg = await ensureSw();
  if (reg) {
    try {
      await subscribePush(reg);
    } catch {
      /* iOS */
    }
  }
  void fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tick: true }),
  }).catch(() => undefined);
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
  if (!tarloPref() && !hydroPref()) return;
  const reg = await ensureSw();
  if (reg) {
    try {
      await subscribePush(reg);
    } catch {
      /* ignore */
    }
    reg.active?.postMessage({ type: "tarlo", items: payload() });
  }
  fireIfDue(reg);
  void fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tick: true }),
  }).catch(() => undefined);
}
