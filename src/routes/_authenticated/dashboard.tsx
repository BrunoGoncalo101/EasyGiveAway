import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Plus,
  CalendarClock,
  Users,
  Copy,
  ExternalLink,
  Search,
  Trash2,
  Gift,
  Trophy,
  Sparkles,
} from "lucide-react";
import { FIELD_OPTIONS, effectiveStatus, type FieldKey, type EventRow } from "@/lib/giveaway";

type EventWithEntries = EventRow & {
  entries?: { count: number }[];
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Os meus giveaways — Easy Giveaway" },
      { name: "description", content: "Painel do organizador — Easy Giveaway." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "closed" | "completed">("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", user.id],
    queryFn: async () => {
      // Tentar buscar eventos com a contagem de inscritos
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*, entries(count)")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data) return data as EventWithEntries[];
      } catch {
        // Fallback para select básico caso o schema não suporte count embedded
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EventWithEntries[];
    },
  });

  const stats = useMemo(() => {
    let totalEntries = 0;
    let activeCount = 0;
    let completedCount = 0;

    events.forEach((ev) => {
      const st = effectiveStatus(ev);
      if (st === "active") activeCount++;
      if (st === "completed") completedCount++;
      const count = ev.entries?.[0]?.count ?? 0;
      totalEntries += count;
    });

    return {
      total: events.length,
      active: activeCount,
      completed: completedCount,
      totalEntries,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const st = effectiveStatus(ev);
      if (filter !== "all" && st !== filter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          ev.title.toLowerCase().includes(query) ||
          ev.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [events, filter, search]);

  async function handleDeleteEvent(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    try {
      // Primeiro apagar entradas associadas se existirem
      await supabase.from("entries").delete().eq("event_id", id);
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;

      toast.success("Giveaway eliminado com sucesso.");
      qc.invalidateQueries({ queryKey: ["events", user.id] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível eliminar o evento.");
    }
  }

  function copyLink(slug: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/e/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link público copiado!");
  }

  return (
    <div className="space-y-8 animate-pop-in">
      {/* Header com Boas-Vindas e Ação Principal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            Painel do Organizador
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Os teus Giveaways
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere os teus sorteios, acompanha participantes e roda a roleta em tempo real.
          </p>
        </div>
        <CreateEvent ownerId={user.id} />
      </div>

      {/* Cartões de Métricas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-pop">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Total Criados</span>
            <Gift className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{stats.total}</div>
        </div>

        <div className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-pop">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">A Decorrer</span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-pop">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Sorteados</span>
            <Trophy className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{stats.completed}</div>
        </div>

        <div className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-pop">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Inscrições</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{stats.totalEntries}</div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      {events.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por título ou descrição…"
              className="pl-9 h-10 border-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            {(
              [
                ["all", "Todos"],
                ["active", "Ativos"],
                ["closed", "Encerrados"],
                ["completed", "Concluídos"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                variant={filter === key ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-lg text-xs font-semibold"
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Eventos */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 rounded-3xl border-2 border-border bg-card p-6 animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-foreground/30 bg-card p-12 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-pop mb-4">
            <Gift className="size-7" />
          </div>
          <h3 className="text-xl font-bold">Ainda não criaste nenhum sorteio</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Cria o teu primeiro giveaway em menos de 1 minuto. Define o prémio, as regras e partilha o link com o teu público.
          </p>
          <div className="mt-6">
            <CreateEvent ownerId={user.id} />
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Nenhum giveaway encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => {
            const st = effectiveStatus(ev);
            const count = ev.entries?.[0]?.count ?? 0;

            return (
              <div
                key={ev.id}
                className="group relative flex flex-col justify-between rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={st} />
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                      <Users className="size-3.5" />
                      <span>{count} {count === 1 ? "inscrito" : "inscritos"}</span>
                    </div>
                  </div>

                  <Link to="/events/$id" params={{ id: ev.id }} className="block mt-4">
                    <h2 className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {ev.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground min-h-[40px]">
                      {ev.description || "Sem descrição adicional."}
                    </p>
                  </Link>

                  {ev.closes_at && (
                    <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5 shrink-0 text-primary" />
                      <span>
                        Fecha a {new Date(ev.closes_at).toLocaleDateString("pt-PT")} às{" "}
                        {new Date(ev.closes_at).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold"
                      onClick={(e) => copyLink(ev.slug, e)}
                      title="Copiar link do giveaway"
                    >
                      <Copy className="size-3.5 mr-1" />
                      Link
                    </Button>
                    <a
                      href={`/e/${ev.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center size-8 rounded-lg border border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Abrir página pública"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar evento"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar este giveaway?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é irreversível. O giveaway "{ev.title}" e todas as suas inscrições serão permanentemente apagados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => handleDeleteEvent(ev.id, e)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button asChild variant="hero" size="sm" className="h-8 font-bold text-xs">
                      <Link to="/events/$id" params={{ id: ev.id }}>
                        Gerir
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [fields, setFields] = useState<FieldKey[]>(["name", "email"]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return void toast.error("Indica um título para o giveaway");
    if (fields.length === 0) return void toast.error("Escolhe pelo menos um campo para os inscritos");

    setBusy(true);
    try {
      const { error } = await supabase.from("events").insert({
        owner_id: ownerId,
        title: title.trim().slice(0, 150),
        description: description.trim(),
        rules: rules.trim(),
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        fields,
      });

      if (error) throw error;

      toast.success("Giveaway criado com sucesso! 🎉");
      setOpen(false);
      setTitle("");
      setDescription("");
      setRules("");
      setClosesAt("");
      qc.invalidateQueries({ queryKey: ["events"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível criar o evento");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg" className="font-bold shadow-pop">
          <Plus className="size-5" /> Novo Giveaway
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-hero text-primary-foreground text-sm">
              <Gift className="size-4" />
            </span>
            Criar Giveaway
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="ev-title" className="text-xs font-semibold">
              Título do Giveaway *
            </Label>
            <Input
              id="ev-title"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sorteio de Auscultadores Sony XM5"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ev-desc" className="text-xs font-semibold">
              Descrição (opcional)
            </Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreve o prémio, quem pode participar ou informações extras…"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ev-rules" className="text-xs font-semibold">
              Regras e Condições (opcional)
            </Label>
            <Textarea
              id="ev-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="1. Segue a página no Instagram&#10;2. Apenas envios para Portugal e Espanha…"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ev-closes" className="text-xs font-semibold">
              Data e Hora de Encerramento (opcional)
            </Label>
            <Input
              id="ev-closes"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Se definido, as inscrições fecham automaticamente nesta data.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold">
              Campos de Inscrição Solicitados *
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Escolhe que dados os participantes devem preencher para concorrer.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_OPTIONS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-2.5 text-sm cursor-pointer hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={fields.includes(f.key)}
                    onCheckedChange={(checked) =>
                      setFields(
                        checked
                          ? [...fields, f.key]
                          : fields.filter((x) => x !== f.key)
                      )
                    }
                  />
                  <span className="font-medium text-xs">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="hero"
              size="lg"
              className="w-full font-bold shadow-pop"
              disabled={busy}
            >
              {busy ? "A criar giveaway…" : "Lançar Giveaway"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
