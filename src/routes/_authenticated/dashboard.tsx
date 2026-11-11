import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, CalendarClock } from "lucide-react";
import { FIELD_OPTIONS, effectiveStatus, type FieldKey, type EventRow } from "@/lib/giveaway";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Os meus giveaways — Sorteio" }, { name: "description", content: "Painel do organizador." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: events = [] } = useQuery({
    queryKey: ["events", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
      if (error) throw error; return data as EventRow[];
    },
  });
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Painel do organizador</p><h1 className="text-4xl font-bold">Os teus giveaways</h1></div>
        <CreateEvent ownerId={user.id} />
      </div>
      {events.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center text-muted-foreground">Ainda não criaste nenhum evento. Começa pelo botão "Novo evento".</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const st = effectiveStatus(ev);
            return (
              <Link key={ev.id} to="/events/$id" params={{ id: ev.id }} className="group rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop transition-transform hover:-translate-y-1">
                <StatusBadge status={st} />
                <h2 className="mt-3 text-xl font-bold group-hover:text-primary">{ev.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
                {ev.closes_at && <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3" /> Fecha {new Date(ev.closes_at).toLocaleString("pt-PT")}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateEvent({ ownerId }: { ownerId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [rules, setRules] = useState("");
  const [closesAt, setClosesAt] = useState(""); const [fields, setFields] = useState<FieldKey[]>(["name", "email"]); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return void toast.error("Indica um título");
    if (fields.length === 0) return void toast.error("Escolhe pelo menos um campo");
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      owner_id: ownerId, title: title.trim().slice(0, 150), description: description.trim(), rules: rules.trim(),
      closes_at: closesAt ? new Date(closesAt).toISOString() : null, fields,
    });
    setBusy(false);
    if (error) return void toast.error("Não foi possível criar o evento");
    toast.success("Evento criado!"); setOpen(false); setTitle(""); setDescription(""); setRules(""); setClosesAt("");
    qc.invalidateQueries({ queryKey: ["events"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="hero" size="lg"><Plus /> Novo evento</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">Criar giveaway</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Título</Label><Input value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="Ganha uns auscultadores!" /></div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>Regras</Label><Textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="1. Segue a conta…" /></div>
          <div><Label>Data/hora de fecho (opcional)</Label><Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} /></div>
          <div>
            <Label>Campos de inscrição</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FIELD_OPTIONS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 rounded-xl border p-2 text-sm">
                  <Checkbox checked={fields.includes(f.key)} onCheckedChange={(c) => setFields(c ? [...fields, f.key] : fields.filter((x) => x !== f.key))} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
          <Button variant="hero" size="lg" className="w-full" disabled={busy}>Criar evento</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
