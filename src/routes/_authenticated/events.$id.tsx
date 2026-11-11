import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Lock,
  Unlock,
  Shuffle,
  Check,
  X,
  Trophy,
  Users,
  ExternalLink,
  Download,
  Search,
  Sparkles,
  Share2,
} from "lucide-react";
import { effectiveStatus, eventFields, pickRandom, type EventRow } from "@/lib/giveaway";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({
    meta: [
      { title: "Gerir evento — Sorteio" },
      { name: "description", content: "Gestão do giveaway e sorteio." },
    ],
  }),
  component: EventAdmin,
});

type Entry = {
  id: string;
  name: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  other_social: string | null;
  status: string;
  created_at: string;
};

function EventAdmin() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "disqualified" | "winner">("all");

  const { data: ev, isLoading: isEvLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as EventRow;
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["entries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Entry[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`entries-${id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries", filter: `event_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["entries", id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<Entry | null>(null);
  const [candidate, setCandidate] = useState<Entry | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pool = useMemo(() => entries.filter((e) => e.status === "valid"), [entries]);
  const winner = useMemo(
    () => entries.find((e) => e.id === ev?.winner_entry_id) || entries.find((e) => e.status === "winner"),
    [entries, ev?.winner_entry_id]
  );
  const disq = useMemo(() => entries.filter((e) => e.status === "disqualified"), [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.instagram?.toLowerCase().includes(q) ||
        e.tiktok?.toLowerCase().includes(q) ||
        e.other_social?.toLowerCase().includes(q)
      );
    });
  }, [entries, statusFilter, searchTerm]);

  if (isEvLoading || !ev) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground animate-pulse">
        A carregar dados do sorteio…
      </div>
    );
  }

  const status = effectiveStatus(ev);
  const fields = eventFields(ev);
  const url = typeof window !== "undefined" ? `${window.location.origin}/e/${ev.slug}` : `/e/${ev.slug}`;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["event", id] });
    qc.invalidateQueries({ queryKey: ["entries", id] });
  };

  async function closeEvent() {
    const { error } = await supabase.from("events").update({ status: "closed" }).eq("id", id);
    if (error) return void toast.error("Erro ao encerrar as inscrições.");
    toast.success("Inscrições encerradas com sucesso.");
    refresh();
  }

  async function reopenEvent() {
    const { error } = await supabase.from("events").update({ status: "active", closes_at: null }).eq("id", id);
    if (error) return void toast.error("Erro ao reabrir o evento.");
    toast.success("Inscrições reabertas!");
    refresh();
  }

  function draw() {
    if (pool.length === 0) {
      return void toast.error("Não há participantes válidos para sortear.");
    }
    const chosen = pickRandom(pool);
    setSpinning(true);
    setCandidate(null);
    let delay = 40;
    const total = 3400;
    let elapsed = 0;

    const tick = () => {
      elapsed += delay;
      if (elapsed >= total) {
        setDisplay(chosen);
        setCandidate(chosen);
        setSpinning(false);
        return;
      }
      setDisplay(pool[Math.floor(Math.random() * pool.length)]!);
      delay = Math.min(delay * 1.08, 340);
      timer.current = window.setTimeout(tick, delay);
    };
    tick();
  }

  async function validate() {
    if (!candidate) return;
    const a = await supabase.from("entries").update({ status: "winner" }).eq("id", candidate.id);
    const b = await supabase.from("events").update({ status: "completed", winner_entry_id: candidate.id }).eq("id", id);
    if (a.error || b.error) return void toast.error("Erro ao validar vencedor.");

    toast.success("🏆 Vencedor confirmado e validado! Parabéns!");
    setCandidate(null);
    setDisplay(null);
    refresh();
  }

  async function invalidate() {
    if (!candidate) return;
    const { error } = await supabase.from("entries").update({ status: "disqualified" }).eq("id", candidate.id);
    if (error) return void toast.error("Erro ao desqualificar.");

    toast("Participante desqualificado. Podes efetuar um novo sorteio.");
    setCandidate(null);
    setDisplay(null);
    refresh();
  }

  function exportCSV() {
    if (entries.length === 0) return void toast.error("Não existem inscrições para exportar.");

    const headers = [
      fields.includes("name") ? "Nome" : null,
      fields.includes("email") ? "Email" : null,
      fields.includes("instagram") ? "Instagram" : null,
      fields.includes("tiktok") ? "TikTok" : null,
      fields.includes("other") ? "Outra Rede" : null,
      "Estado",
      "Data de Inscrição",
    ].filter(Boolean);

    const rows = entries.map((e) => {
      const cols = [
        fields.includes("name") ? `"${(e.name || "").replace(/"/g, '""')}"` : null,
        fields.includes("email") ? `"${(e.email || "").replace(/"/g, '""')}"` : null,
        fields.includes("instagram") ? `"${(e.instagram || "").replace(/"/g, '""')}"` : null,
        fields.includes("tiktok") ? `"${(e.tiktok || "").replace(/"/g, '""')}"` : null,
        fields.includes("other") ? `"${(e.other_social || "").replace(/"/g, '""')}"` : null,
        `"${e.status}"`,
        `"${new Date(e.created_at).toLocaleString("pt-PT")}"`,
      ].filter(Boolean);
      return cols.join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `inscricoes_${ev.slug}.csv`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
    toast.success("Ficheiro CSV exportado!");
  }

  const label = (e: Entry) =>
    e.name || e.email || (e.instagram && "@" + e.instagram) || (e.tiktok && "@" + e.tiktok) || e.other_social || "—";

  return (
    <div className="space-y-8 animate-pop-in">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar ao Painel
        </Link>
      </div>

      {/* Header do Sorteio */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {ev.closes_at && (
              <span className="text-xs text-muted-foreground">
                Fecho: {new Date(ev.closes_at).toLocaleString("pt-PT")}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">{ev.title}</h1>
          {ev.description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{ev.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "active" ? (
            <Button variant="outline" size="sm" onClick={closeEvent} className="font-semibold">
              <Lock className="size-4 mr-1.5" /> Encerrar Inscrições
            </Button>
          ) : (
            status === "closed" && (
              <Button variant="outline" size="sm" onClick={reopenEvent} className="font-semibold">
                <Unlock className="size-4 mr-1.5" /> Reabrir Inscrições
              </Button>
            )
          )}
        </div>
      </div>

      {/* Grid com Partilha, Métricas e Sorteio */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cartão de Partilha & QR Code */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Share2 className="size-4 text-primary" />
                Partilhar Giveaway
              </h2>
            </div>
            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm border border-border">
              <QRCodeSVG value={url} size={150} level="M" />
            </div>
            <div className="mt-4 flex gap-2">
              <Input readOnly value={url} className="text-xs bg-muted/50 truncate" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado para a área de transferência!");
                }}
                title="Copiar Link"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" /> Abrir página pública de inscrição
          </a>
        </div>

        {/* Cartão de Participantes em Tempo Real */}
        <div className="rounded-3xl border-2 border-foreground bg-hero p-6 text-primary-foreground shadow-pop flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <Users className="size-8" />
              <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Em direto
              </span>
            </div>
            <div className="mt-4 font-display text-6xl font-extrabold tabular-nums tracking-tight">
              {entries.length}
            </div>
            <div className="text-sm font-medium opacity-90">participantes registados</div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
            <span>{pool.length} válidos para sorteio</span>
            <span>{disq.length} desqualificados</span>
          </div>
        </div>

        {/* Cartão da Roleta / Sorteio */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              Sorteio do Vencedor
            </h2>

            {status === "completed" && winner ? (
              <div className="text-center py-2">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
                  <Trophy className="size-6 animate-bounce" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Vencedor Validado
                </p>
                <WinnerCard e={winner} fields={fields} />
              </div>
            ) : status === "active" ? (
              <div className="py-6 text-center text-sm text-muted-foreground space-y-3">
                <Lock className="mx-auto size-8 text-muted-foreground/60" />
                <p>
                  As inscrições ainda estão ativas. Encerra as inscrições para sortear o vencedor.
                </p>
                <Button variant="outline" size="sm" onClick={closeEvent} className="font-semibold">
                  Encerrar agora e Sortear
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`grid h-24 place-items-center overflow-hidden rounded-2xl border-2 border-foreground bg-muted px-3 text-center font-display text-2xl font-bold shadow-inner ${
                    spinning ? "scale-[0.98] border-primary" : display ? "animate-pop-in bg-primary/10" : ""
                  }`}
                >
                  {display ? (
                    <span className="truncate max-w-[240px]">{label(display)}</span>
                  ) : (
                    <span className="text-muted-foreground text-xl flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" /> Pronto a rodar
                    </span>
                  )}
                </div>

                {candidate && !spinning ? (
                  <div className="space-y-3 animate-pop-in">
                    <p className="text-xs text-center font-bold uppercase text-primary tracking-wider">
                      Candidato Sorteado
                    </p>
                    <WinnerCard e={candidate} fields={fields} />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="success" size="lg" className="font-bold shadow-pop" onClick={validate}>
                        <Check className="size-4 mr-1" /> Validar
                      </Button>
                      <Button variant="destructive" size="lg" className="font-bold" onClick={invalidate}>
                        <X className="size-4 mr-1" /> Invalidar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full font-bold shadow-pop text-base"
                    disabled={spinning || pool.length === 0}
                    onClick={draw}
                  >
                    <Shuffle className="size-5 mr-1" />
                    {spinning ? "A sortear…" : "Sortear Vencedor"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Inscrições com Filtro, Busca e Exportação */}
      <div className="rounded-3xl border-2 border-foreground bg-card shadow-pop overflow-hidden">
        <div className="border-b-2 border-foreground p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Participantes Inscritos</h2>
            <p className="text-xs text-muted-foreground">
              Lista atualizada em tempo real conforme as inscrições são submetidas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar inscritos…"
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={entries.length === 0}
              className="h-8 text-xs font-semibold"
            >
              <Download className="size-3.5 mr-1.5" /> Exportar CSV
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto size-8 opacity-40 mb-2" />
            Ainda sem inscrições. Partilha o link do giveaway para começares a receber participantes!
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum participante encontrado para a pesquisa "{searchTerm}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <tr>
                  {fields.includes("name") && <th className="p-3.5 font-bold">Nome</th>}
                  {fields.includes("email") && <th className="p-3.5 font-bold">Email</th>}
                  {fields.includes("instagram") && <th className="p-3.5 font-bold">Instagram</th>}
                  {fields.includes("tiktok") && <th className="p-3.5 font-bold">TikTok</th>}
                  {fields.includes("other") && <th className="p-3.5 font-bold">Outra</th>}
                  <th className="p-3.5 font-bold">Estado</th>
                  <th className="p-3.5 font-bold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((e) => (
                  <tr
                    key={e.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      e.status === "disqualified" ? "opacity-50 line-through" : ""
                    } ${e.status === "winner" ? "bg-amber-500/10 font-bold" : ""}`}
                  >
                    {fields.includes("name") && <td className="p-3.5">{e.name || "—"}</td>}
                    {fields.includes("email") && <td className="p-3.5">{e.email || "—"}</td>}
                    {fields.includes("instagram") && (
                      <td className="p-3.5 text-primary">{e.instagram ? `@${e.instagram}` : "—"}</td>
                    )}
                    {fields.includes("tiktok") && (
                      <td className="p-3.5">{e.tiktok ? `@${e.tiktok}` : "—"}</td>
                    )}
                    {fields.includes("other") && <td className="p-3.5">{e.other_social || "—"}</td>}
                    <td className="p-3.5 whitespace-nowrap">
                      {e.status === "winner" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300 font-bold">
                          🏆 Vencedor
                        </span>
                      ) : e.status === "disqualified" ? (
                        <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive font-medium">
                          Desqualificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                          Válido
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerCard({ e, fields }: { e: Entry; fields: string[] }) {
  const rows: [string, string | null][] = [
    ["Nome", fields.includes("name") ? e.name : null],
    ["Email", fields.includes("email") ? e.email : null],
    ["Instagram", e.instagram && "@" + e.instagram],
    ["TikTok", e.tiktok && "@" + e.tiktok],
    ["Outra rede", e.other_social],
  ];

  return (
    <dl className="mt-2 space-y-1.5 rounded-2xl bg-muted/80 p-3.5 text-left text-xs border border-border">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate font-bold text-foreground">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
