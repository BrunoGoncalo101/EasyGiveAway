export const FIELD_OPTIONS = [
  { key: "name", label: "Nome", placeholder: "O teu nome" },
  { key: "email", label: "Email", placeholder: "nome@exemplo.com" },
  { key: "instagram", label: "Instagram", placeholder: "@handle" },
  { key: "tiktok", label: "TikTok", placeholder: "@handle" },
  { key: "other", label: "Outra rede social", placeholder: "ex: twitter.com/handle" },
] as const;
export type FieldKey = (typeof FIELD_OPTIONS)[number]["key"];

export type EventRow = {
  id: string; slug: string; title: string; description: string; rules: string;
  closes_at: string | null; status: string; fields: unknown; winner_entry_id: string | null; owner_id: string; created_at: string;
};

export function eventFields(ev: { fields: unknown }): FieldKey[] {
  return Array.isArray(ev.fields) ? (ev.fields as FieldKey[]) : ["name", "email"];
}

/** Effective state: closes automatically once closes_at has passed. */
export function effectiveStatus(ev: { status: string; closes_at: string | null }, now = Date.now()) {
  if (ev.status === "completed") return "completed";
  if (ev.status === "closed") return "closed";
  if (ev.closes_at && new Date(ev.closes_at).getTime() <= now) return "closed";
  return "active";
}

export const STATUS_LABEL: Record<string, string> = { active: "Ativo", closed: "Encerrado", completed: "Concluído" };

export function pickRandom<T>(items: T[]): T {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return items[a[0]! % items.length]!;
}
