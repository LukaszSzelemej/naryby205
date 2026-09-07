import {
  formatDepth,
  formatSize,
  KIND_LABEL,
  managerOf,
  speciesName,
  waterTitle,
} from "@/lib/catalog";
import type { Water } from "@/lib/types";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function shareWaterCard(w: Water) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Brak canvas");

  ctx.fillStyle = "#080c10";
  ctx.fillRect(0, 0, 1080, 1350);
  const g = ctx.createRadialGradient(540, 280, 40, 540, 280, 700);
  g.addColorStop(0, "rgba(34, 197, 94, 0.22)");
  g.addColorStop(1, "rgba(8, 12, 16, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1350);

  const logo = await loadImg("/brand/logo-karp-circle.png");
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 168, 88, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, 452, 80, 176, 176);
    ctx.restore();
  }

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ATLAS WĘDKARSKI", 540, 300);

  ctx.fillStyle = "#f4f7f5";
  ctx.font = "700 56px system-ui, sans-serif";
  const title = waterTitle(w);
  const lines: string[] = [];
  const words = title.split(" ");
  let row = "";
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > 920 && row) {
      lines.push(row);
      row = word;
    } else row = next;
  }
  if (row) lines.push(row);
  lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, 540, 380 + i * 64));

  const y0 = 380 + Math.min(lines.length, 3) * 64 + 24;
  ctx.fillStyle = "#9ca8a1";
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillText(
    [KIND_LABEL[w.kind], w.gmina, w.powiat].filter(Boolean).join(" · "),
    540,
    y0,
  );

  const mgr = managerOf(w);
  const bits = [
    formatSize(w),
    formatDepth(w) ? `głęb. ${formatDepth(w)}` : null,
    w.noKill ? "no kill" : null,
    w.night ? "noc" : null,
    w.boats ? "łodzie" : null,
  ].filter(Boolean) as string[];

  ctx.fillStyle = "#d7e3dc";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText(bits.join("  ·  ") || mgr.name, 540, y0 + 70);

  ctx.fillStyle = "#8b9a92";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText(mgr.name, 540, y0 + 118);

  const fish = [...new Set(w.species)]
    .map(speciesName)
    .sort((a, b) => a.localeCompare(b, "pl"))
    .slice(0, 8)
    .join(" · ");
  ctx.fillStyle = "#c5d4cb";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(fish, 540, y0 + 180);

  roundRect(ctx, 120, 1180, 840, 88, 44);
  ctx.fillStyle = "#16a34a";
  ctx.fill();
  ctx.fillStyle = "#04140c";
  ctx.font = "700 32px system-ui, sans-serif";
  ctx.fillText("atlaswedkarski.pl", 540, 1236);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Nie zapisano obrazka");
  const file = new File([blob], `${w.id}.png`, { type: "image/png" });
  const text = `${waterTitle(w)} — Atlas wędkarski`;
  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: text, text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: text, text: `${text}\nhttps://www.atlaswedkarski.pl` });
      return;
    }
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError") return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
