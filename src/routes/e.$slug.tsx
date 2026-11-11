import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Countdown } from "@/components/Countdown";
import { FIELD_OPTIONS, effectiveStatus, eventFields, type EventRow } from "@/lib/giveaway";
import { Gift, PartyPopper, Lock } from "lucide-react";

export const Route = createFileRoute("/e/$slug")({
  head: () => ({ meta: [
    { title: "Participa no giveaway" }, { name: "description", content: "Inscreve-te e habilita-te a ganhar." },
    { property: "og:title", content: "Participa no giveaway" }, { property: "og:description", content: "Inscreve-te e habilita-te a ganhar." },
  ] }),
  component: PublicEvent,
});

const MSG: Record<string, string> = {
  closed: "As inscrições já fecharam.", missing: "Preenche todos os campos.", invalid_email: "Email inválido.",
  too_long: "Algum campo é demasiado longo.", duplicate: "Já existe uma inscrição com este email ou handle.", not_found: "Evento não encontrado.",
};

function PublicEvent() {
  const { slug } = Route.useParams();
  const { data: ev, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => { const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle(); return data as EventRow | null; },
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">A carregar…</div>;
  if (!ev) return <div className="grid min-h-screen place-items-center"><h1 className="text-3xl font-bold">Evento não encontrado</h1></div>;
  const status = effectiveStatus(ev);
  const fields = eventFields(ev);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (fields.includes("email") && !z.string().trim().email().max(255).safeParse(values["email"] ?? "").success) return void setError(MSG["invalid_email"]!);
    for (const f of fields) if (!(values[f] ?? "").trim()) return void setError(MSG["missing"]!);
    setBusy(true);
    const { data, error: err } = await supabase.rpc("submit_entry", {
      _slug: slug, _name: values["name"] ?? "", _email: values["email"] ?? "", _instagram: values["instagram"] ?? "", _tiktok: values["tiktok"] ?? "", _other: values["other"] ?? "",
    });
    setBusy(false);
    if (err) return void setError("Ocorreu um erro. Tenta novamente.");
    if (data === "ok") setDone(true); else setError(MSG[data as string] ?? "Erro.");
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-2 font-display font-bold"><span className="grid size-9 place-items-center rounded-xl bg-hero text-primary-foreground"><Gift className="size-5" /></span>Giveaway</div>
        <h1 className="text-5xl font-bold leading-tight">{ev.title}</h1>
        {ev.description && <p className="whitespace-pre-line text-lg text-muted-foreground">{ev.description}</p>}
        {status === "active" && ev.closes_at && <div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Termina em</p><Countdown to={ev.closes_at} /></div>}
        {ev.rules && <div className="rounded-3xl border-2 border-border bg-card p-5"><h2 className="mb-2 font-bold">Regras</h2><p className="whitespace-pre-line text-sm text-muted-foreground">{ev.rules}</p></div>}

        <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop">
          {status !== "active" ? (
            <div className="py-6 text-center"><Lock className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-3 text-2xl font-bold">Inscrições encerradas</h2><p className="mt-1 text-muted-foreground">Este giveaway já não aceita novas inscrições.</p></div>
          ) : done ? (
            <div className="animate-pop-in py-6 text-center"><PartyPopper className="mx-auto size-12 text-primary" /><h2 className="mt-3 text-2xl font-bold">Inscrição confirmada!</h2><p className="mt-1 text-muted-foreground">Boa sorte 🍀</p></div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-2xl font-bold">Inscreve-te</h2>
              {FIELD_OPTIONS.filter((f) => fields.includes(f.key)).map((f) => (
                <div key={f.key}><Label>{f.label}</Label>
                  <Input type={f.key === "email" ? "email" : "text"} placeholder={f.placeholder} maxLength={f.key === "email" ? 255 : 120}
                    value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} /></div>
              ))}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button variant="hero" size="xl" className="w-full" disabled={busy}>{busy ? "A enviar…" : "Participar"}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
