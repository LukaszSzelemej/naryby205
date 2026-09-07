import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export const ScreenFrame = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; onBack?: () => void }
>(function ScreenFrame({ children, className, onBack }, ref) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  return (
    <div
      ref={ref}
      className={cn("page-scroll bg-background page-enter", className)}
      onTouchStart={
        onBack
          ? (e) => {
              const t = e.changedTouches[0];
              if (t.clientX > 36) {
                tracking.current = false;
                return;
              }
              tracking.current = true;
              startX.current = t.clientX;
              startY.current = t.clientY;
            }
          : undefined
      }
      onTouchEnd={
        onBack
          ? (e) => {
              if (!tracking.current) return;
              tracking.current = false;
              const t = e.changedTouches[0];
              const dx = t.clientX - startX.current;
              const dy = t.clientY - startY.current;
              if (dx > 72 && Math.abs(dy) < 80) onBack();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
});

export function EmptyState({
  icon,
  title,
  body,
  action,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="empty-card mx-auto flex max-w-sm flex-col items-center px-4 py-10 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-card-2 text-primary ring-1 ring-border">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      {body && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{body}</p>}
      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="tap mt-5 min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Skel({ className }: { className?: string }) {
  return <div className={cn("skel", className)} aria-hidden />;
}

export function WeatherSkeleton() {
  return (
    <div className="mt-4" role="status" aria-live="polite">
      <Skel className="h-24 w-full rounded-2xl" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
            <Skel className="h-3 w-16 rounded-md" />
            <Skel className="mt-3 h-6 w-24 rounded-md" />
          </div>
        ))}
      </div>
      <p className="sr-only">Pobieranie pogody</p>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Pobieranie danych">
      <Skel className="h-4 w-40 rounded-md" />
      <Skel className="h-3 w-28 rounded-md" />
      <div className="mt-2 space-y-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skel key={i} className="h-3.5 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className="meter"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function useFlash(ms = 1400) {
  const [on, setOn] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback(() => {
    setOn(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(() => () => {
    if (t.current) clearTimeout(t.current);
  }, []);
  return [on, flash] as const;
}
