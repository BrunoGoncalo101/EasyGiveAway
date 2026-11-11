import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Copy, Lock, Shuffle, Check, X, Trophy, Users, ExternalLink } from "lucide-react";
import { effectiveStatus, eventFields, pickRandom, type EventRow } from "@/lib/giveaway";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({ meta: [{ title: "Gerir evento — Sorteio" }, { name: "description", content: "Gestão do giveaway e sorteio." }] }),
  component: EventAdmin,
});

type Entry = { id: string; name: string | null; email: string | null; instagram: string | null; tiktok: string | null; other_social: string | null; status: string; created_at: string };

function EventAdmin() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: ev } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => { const { data, error } = await supabase.from("events").select("*").eq("id", id).single(); if (error) throw error; return data as EventRow; },
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["entries", id],
    queryFn: async () => { const { data, error } = await supabase.from("entries").select("*").eq("event_id", id).order("created_at", { ascending: false }); if (error) throw error; return data as Entry[]; },
  });
  useEffect(() => {
    const ch = supabase.channel(`entries-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "entries", filter: `event_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["entries", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<Entry | null>(null);
  const [candidate, setCandidate] = useState<Entry | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!ev) return <div className="text-muted-foreground">A carregar…</div>;
  const status = effectiveStatus(ev);
  const fields = eventFields(ev);
  const url = typeof window !== "undefined" ? `${window.location.origin}/e/${ev.slug}` : `/e/${ev.slug}`;
  const pool = entries.filter((e) => e.status === "valid");
  const winner = entries.find((e) => e.id === ev.winner_entry_id);
  const disq = entries.filter((e) => e.status === "disqualified");

  const refresh = () => { qc.invalidateQueries({ queryKey: ["event", id] }); qc.invalidateQueries({ queryKey: ["entries", id] }); };
  async function closeEvent() {
    const { error } = await supabase.from("events").update({ status: "closed" }).eq("id", id);
    if (error) return void toast.error("Erro ao encerrar"); toast.success("Inscrições encerradas"); refresh();
  }
  function draw() {
    if (pool.length === 0) return void toast.error("Não há participantes válidos para sortear");
    const chosen = pickRandom(pool);
    setSpinning(true); setCandidate(null);
    let delay = 40; const total = 3200; let elapsed = 0;
    const tick = () => {
      elapsed += delay;
      if (elapsed >= total) { setDisplay(chosen); setCandidate(chosen); setSpinning(false); return; }
      setDisplay(pool[Math.floor(Math.random() * pool.length)]!);
      delay = Math.min(delay * 1.08, 320);
      timer.current = window.setTimeout(tick, delay);
    };
    tick();
  }
  async function validate() {
    if (!candidate) return;
    const a = await supabase.from("entries").update({ status: "winner" }).eq("id", candidate.id);
    const b = await supabase.from("events").update({ status: "completed", winner_entry_id: candidate.id }).eq("id", id);
    if (a.error || b.error) return void toast.error("Erro ao validar");
    toast.success("Vencedor confirmado! 🎉"); setCandidate(null); setDisplay(null); refresh();
  }
  async function invalidate() {
    if (!candidate) return;
    const { error } = await supabase.from("entries").update({ status: "disqualified" }).eq("id", candidate.id);
    if (error) return void toast.error("Erro ao desqualificar");
    toast("Participante desqualificado. Podes sortear de novo."); setCandidate(null); setDisplay(null); refresh();
  }
  const label = (e: Entry) => e.name || e.email || (e.instagram && "@" + e.instagram) || (e.tiktok && "@" + e.tiktok) || e.other_social || "—";

  return (
    <div className="space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><StatusBadge status={status} /><h1 className="mt-2 text-4xl font-bold">{ev.title}</h1>
          {ev.closes_at && <p className="mt-1 text-sm text-muted-foreground">Fecho: {new Date(ev.closes_at).toLocaleString("pt-PT")}</p>}</div>
        {status === "active" && <Button variant="outline" onClick={closeEvent}><Lock /> Encerrar inscrições</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop">
          <h2 className="mb-4 text-lg font-bold">Partilhar</h2>
          <div className="mx-auto w-fit rounded-2xl bg-card p-3"><QRCodeSVG value={url} size={160} /></div>
          <div className="mt-4 flex gap-2">
            <Input readOnly value={url} className="text-xs" />
            <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copiado"); }}><Copy /></Button>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary"><ExternalLink className="size-4" /> Abrir página pública</a>
        </div>

        <div className="rounded-3xl border-2 border-foreground bg-hero p-6 text-primary-foreground shadow-pop">
          <Users className="size-8" />
          <div className="mt-4 font-display text-6xl font-bold tabular-nums">{entries.length}</div>
          <div className="text-sm opacity-90">participantes inscritos · em tempo real</div>
          <div className="mt-4 text-sm opacity-90">{pool.length} elegíveis · {disq.length} desqualificados</div>
        </div>

        <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop">
          <h2 className="mb-4 text-lg font-bold">Sorteio</h2>
          {status === "completed" && winner ? (
            <div className="text-center"><Trophy className="mx-auto size-10 text-primary" /><p className="mt-2 text-sm text-muted-foreground">Vencedor validado</p>
              <WinnerCard e={winner} fields={fields} /></div>
          ) : status === "active" ? (
            <p className="text-sm text-muted-foreground">Encerra as inscrições (ou espera pelo fecho automático) para poderes sortear.</p>
          ) : (
            <div className="space-y-4">
              <div className={`grid h-24 place-items-center overflow-hidden rounded-2xl border-2 border-foreground bg-muted px-3 text-center font-display text-2xl font-bold ${spinning ? "" : display ? "animate-pop-in" : ""}`}>
                {display ? label(display) : "?"}
              </div>
              {candidate && !spinning ? (
                <>
                  <WinnerCard e={candidate} fields={fields} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="success" onClick={validate}><Check /> Validar</Button>
                    <Button variant="destructive" onClick={invalidate}><X /> Invalidar</Button>
                  </div>
                </>
              ) : (
                <Button variant="hero" size="lg" className="w-full" disabled={spinning || pool.length === 0} onClick={draw}><Shuffle /> {spinning ? "A sortear…" : "Sortear vencedor"}</Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border-2 border-foreground bg-card shadow-pop">
        <h2 className="border-b-2 border-foreground p-5 text-lg font-bold">Inscrições</h2>
        {entries.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Ainda sem inscrições.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr>
                {fields.includes("name") && <th className="p-3">Nome</th>}{fields.includes("email") && <th className="p-3">Email</th>}
                {fields.includes("instagram") && <th className="p-3">Instagram</th>}{fields.includes("tiktok") && <th className="p-3">TikTok</th>}
                {fields.includes("other") && <th className="p-3">Outra</th>}<th className="p-3">Estado</th><th className="p-3">Data</th></tr></thead>
              <tbody>{entries.map((e) => (
                <tr key={e.id} className={`border-t ${e.status === "disqualified" ? "text-muted-foreground line-through" : ""}`}>
                  {fields.includes("name") && <td className="p-3">{e.name}</td>}{fields.includes("email") && <td className="p-3">{e.email}</td>}
                  {fields.includes("instagram") && <td className="p-3">{e.instagram && "@" + e.instagram}</td>}{fields.includes("tiktok") && <td className="p-3">{e.tiktok && "@" + e.tiktok}</td>}
                  {fields.includes("other") && <td className="p-3">{e.other_social}</td>}
                  <td className="p-3">{e.status === "winner" ? "🏆 Vencedor" : e.status === "disqualified" ? "Desqualificado" : "Válido"}</td>
                  <td className="p-3 whitespace-nowrap">{new Date(e.created_at).toLocaleString("pt-PT")}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerCard({ e, fields }: { e: Entry; fields: string[] }) {
  const rows: [string, string | null][] = [
    ["Nome", fields.includes("name") ? e.name : null], ["Email", fields.includes("email") ? e.email : null],
    ["Instagram", e.instagram && "@" + e.instagram], ["TikTok", e.tiktok && "@" + e.tiktok], ["Outra rede", e.other_social],
  ];
  return (
    <dl className="mt-3 space-y-1 rounded-2xl bg-muted p-4 text-left text-sm">
      {rows.filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-semibold">{v}</dd></div>)}
    </dl>
  );
}
