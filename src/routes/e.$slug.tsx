import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Countdown } from "@/components/Countdown";
import { FIELD_OPTIONS, effectiveStatus, eventFields, type EventRow } from "@/lib/giveaway";
import { Gift, PartyPopper, Lock, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/e/$slug")({
  head: () => ({
    meta: [
      { title: "Participa no giveaway — Easy Giveaway" },
      { name: "description", content: "Inscreve-te e habilita-te a ganhar prémios fantásticos." },
      { property: "og:title", content: "Participa no giveaway — Easy Giveaway" },
      {
        property: "og:description",
        content: "Inscreve-te e habilita-te a ganhar prémios fantásticos.",
      },
    ],
  }),
  component: PublicEvent,
});

const MSG: Record<string, string> = {
  closed: "As inscrições já foram encerradas.",
  missing: "Por favor preenche todos os campos obrigatórios.",
  invalid_email: "Por favor indica um endereço de email válido.",
  too_long: "Algum dos campos excede o tamanho máximo permitido.",
  duplicate: "Já existe uma participação registada com este email ou conta de rede social.",
  not_found: "Este giveaway não foi encontrado.",
};

function PublicEvent() {
  const { slug } = Route.useParams();
  const { data: ev, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data as EventRow | null;
    },
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground animate-pulse">
        A carregar giveaway…
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="space-y-4">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="size-6" />
          </div>
          <h1 className="text-3xl font-extrabold">Giveaway não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            O link pode estar incorreto ou o evento pode ter sido removido.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Voltar à Página Principal</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = effectiveStatus(ev);
  const fields = eventFields(ev);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      fields.includes("email") &&
      !z.string().trim().email().max(255).safeParse(values["email"] ?? "").success
    ) {
      return void setError(MSG["invalid_email"]!);
    }

    for (const f of fields) {
      if (!(values[f] ?? "").trim()) {
        return void setError(MSG["missing"]!);
      }
    }

    setBusy(true);

    // Sanitizar handles removendo arrobas no início
    const cleanHandle = (val?: string) => (val ? val.trim().replace(/^@+/, "") : "");

    const { data, error: err } = await supabase.rpc("submit_entry", {
      _slug: slug,
      _name: (values["name"] ?? "").trim(),
      _email: (values["email"] ?? "").trim().toLowerCase(),
      _instagram: cleanHandle(values["instagram"]),
      _tiktok: cleanHandle(values["tiktok"]),
      _other: (values["other"] ?? "").trim(),
    });

    setBusy(false);

    if (err) {
      return void setError("Ocorreu um erro ao submeter a inscrição. Tenta novamente.");
    }

    if (data === "ok") {
      setDone(true);
    } else {
      setError(MSG[data as string] ?? "Ocorreu um erro ao validar a inscrição.");
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-background flex flex-col justify-between">
      <div className="mx-auto max-w-xl w-full space-y-6 animate-pop-in">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-display font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-hero text-primary-foreground shadow-pop">
              <Gift className="size-5" />
            </span>
            Easy Giveaway
          </Link>
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-foreground">
            {ev.title}
          </h1>
          {ev.description && (
            <p className="mt-3 whitespace-pre-line text-base sm:text-lg text-muted-foreground leading-relaxed">
              {ev.description}
            </p>
          )}
        </div>

        {status === "active" && ev.closes_at && (
          <div className="rounded-2xl border-2 border-foreground bg-card p-4 shadow-pop">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
              Tempo restante para inscrições
            </p>
            <Countdown to={ev.closes_at} />
          </div>
        )}

        {ev.rules && (
          <div className="rounded-3xl border-2 border-border bg-card p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Regras e Condições
            </h2>
            <p className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
              {ev.rules}
            </p>
          </div>
        )}

        <div className="rounded-3xl border-2 border-foreground bg-card p-7 shadow-pop">
          {status !== "active" ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Lock className="size-6" />
              </div>
              <h2 className="text-2xl font-bold">Inscrições encerradas</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Este giveaway já fechou as inscrições e o sorteio está a decorrer ou já terminou.
              </p>
            </div>
          ) : done ? (
            <div className="animate-pop-in py-8 text-center space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-hero text-primary-foreground shadow-pop">
                <PartyPopper className="size-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black">Inscrição confirmada!</h2>
                <p className="mt-1 text-muted-foreground">
                  A tua participação foi registada com sucesso. Fica atento ao sorteio! 🍀
                </p>
              </div>
              <div className="pt-4 flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="size-4" /> Dados guardados e elegíveis para sorteio
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight">Inscreve-te no Sorteio</h2>
              <p className="text-xs text-muted-foreground">
                Preenche os teus dados abaixo para garantires a tua vaga.
              </p>

              {FIELD_OPTIONS.filter((f) => fields.includes(f.key)).map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={`field-${f.key}`} className="text-xs font-semibold">
                    {f.label} *
                  </Label>
                  <Input
                    id={`field-${f.key}`}
                    type={f.key === "email" ? "email" : "text"}
                    placeholder={f.placeholder}
                    maxLength={f.key === "email" ? 255 : 120}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required
                    disabled={busy}
                    className="border-2 focus-visible:ring-primary"
                  />
                </div>
              ))}

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              <Button
                variant="hero"
                size="xl"
                className="w-full font-black text-base shadow-pop mt-2"
                disabled={busy}
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> A validar inscrição…
                  </span>
                ) : (
                  "Participar Agora"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      <footer className="mx-auto max-w-xl text-center py-6 text-xs text-muted-foreground">
        Powered by <span className="font-bold text-foreground">Easy Giveaway</span> — Plataforma de Giveaways Justos
      </footer>
    </div>
  );
}
