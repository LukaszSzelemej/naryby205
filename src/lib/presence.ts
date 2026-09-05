const CHANNEL = "atlas-online";
const SID_KEY = "atlas.sid";

function sid() {
  try {
    let id = sessionStorage.getItem(SID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return `tmp-${Math.random().toString(36).slice(2)}`;
  }
}

export function startPresence(onCount: (n: number) => void): () => void {
  const id = sid();
  const tabs = new Set<string>([id]);
  let channel: BroadcastChannel | null = null;
  let timer: number | undefined;
  let last = 1;

  const emit = (n: number) => {
    const v = Math.max(1, n);
    if (v === last) return;
    last = v;
    onCount(v);
  };

  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as { t: string; id: string };
      if (!msg?.id || msg.id === id) return;
      if (msg.t === "hello" || msg.t === "ping") {
        tabs.add(msg.id);
        channel?.postMessage({ t: "ack", id });
        emit(tabs.size);
      } else if (msg.t === "ack") {
        tabs.add(msg.id);
        emit(tabs.size);
      } else if (msg.t === "bye") {
        tabs.delete(msg.id);
        emit(tabs.size);
      }
    };
    channel.postMessage({ t: "hello", id });
  } catch {
    /* no BroadcastChannel */
  }

  const pingServer = async () => {
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const j = (await res.json()) as { n?: number };
        if (typeof j.n === "number" && j.n >= tabs.size) {
          emit(j.n);
          return;
        }
      }
    } catch {
      /* fall back to tabs */
    }
    emit(tabs.size);
  };

  void pingServer();
  timer = window.setInterval(() => {
    channel?.postMessage({ t: "ping", id });
    void pingServer();
  }, 30000);

  const onHide = () => {
    if (document.visibilityState === "hidden") {
      channel?.postMessage({ t: "bye", id });
    } else {
      channel?.postMessage({ t: "hello", id });
      void pingServer();
    }
  };
  document.addEventListener("visibilitychange", onHide);

  return () => {
    channel?.postMessage({ t: "bye", id });
    channel?.close();
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onHide);
  };
}
