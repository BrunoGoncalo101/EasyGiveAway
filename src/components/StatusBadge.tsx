import { STATUS_LABEL } from "@/lib/giveaway";

export function StatusBadge({ status }: { status: string }) {
  const cls = status === "active" ? "bg-accent text-accent-foreground" : status === "completed" ? "bg-hero text-primary-foreground" : "bg-muted text-muted-foreground";
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{STATUS_LABEL[status]}</span>;
}

