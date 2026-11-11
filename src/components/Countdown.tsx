import { useEffect, useState } from "react";
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now === null) return null;
  const diff = Math.max(0, new Date(to).getTime() - now);
  const parts = [
    ["dias", Math.floor(diff / 864e5)], ["horas", Math.floor(diff / 36e5) % 24],
    ["min", Math.floor(diff / 6e4) % 60], ["seg", Math.floor(diff / 1e3) % 60],
  ] as const;
  return (
    <div className="grid grid-cols-4 gap-2">
      {parts.map(([l, v]) => (
        <div key={l} className="rounded-2xl border-2 border-foreground bg-card p-3 text-center shadow-pop">
          <div className="font-display text-3xl font-bold tabular-nums">{String(v).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}
