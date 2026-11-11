import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Gift,
  QrCode,
  Users,
  Shuffle,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sorteio — Gestão de Giveaways e Sorteios em Tempo Real" },
      {
        name: "description",
        content:
          "Cria giveaways, partilha o link e QR code, acompanha inscrições em tempo real e sorteia o vencedor com transparência total.",
      },
      { property: "og:title", content: "Sorteio — Gestão de Giveaways" },
      {
        property: "og:description",
        content:
          "Cria giveaways, partilha o link e sorteia o vencedor com roleta ao vivo.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setHasSession(true);
    });
  }, []);

  return (
    <div className="min-h-screen px-4 bg-background">
      {/* Navbar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between py-6">
        <div className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight">
          <span className="grid size-10 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-pop">
            <Gift className="size-5" />
          </span>
          Sorteio
        </div>
        <div className="flex items-center gap-3">
          {hasSession ? (
            <Button asChild variant="hero" size="sm" className="font-bold shadow-pop">
              <Link to="/dashboard">Painel Principal</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="font-semibold border-2">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex font-bold shadow-pop">
                <Link to="/auth">Criar Conta</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl py-16 sm:py-24 text-center animate-pop-in">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-hero/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground mb-6 shadow-sm">
          <Zap className="size-3.5 text-primary" />
          Plataforma de Sorteios Justos e Transparentes
        </div>

        <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          Giveaways justos,{" "}
          <span className="bg-hero bg-clip-text text-transparent">sorteios épicos.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Cria o teu giveaway em segundos, partilha o link público ou QR Code, acompanha as inscrições em direto e sorteia o vencedor com uma roleta interativa.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild variant="hero" size="xl" className="font-extrabold text-lg shadow-pop">
            <Link to={hasSession ? "/dashboard" : "/auth"}>
              {hasSession ? "Aceder ao Painel" : "Começar Gratuitamente"}
              <ArrowRight className="size-5 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" /> Sem cartões de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" /> Inscrições em tempo real
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" /> Algoritmo criptográfico
          </span>
        </div>
      </section>

      {/* 3 Passos Principais */}
      <section className="mx-auto grid max-w-5xl gap-6 pb-20 sm:grid-cols-3">
        {[
          [
            QrCode,
            "Link & QR Code Imediatos",
            "Gera automaticamente um link de partilha e QR Code pronto a projetar ou partilhar em stories e streams.",
          ],
          [
            Users,
            "Contador em Tempo Real",
            "Vê os participantes a entrarem instantaneamente através de WebSockets sem precisares de recarregar a página.",
          ],
          [
            Shuffle,
            "Roleta Criptográfica",
            "Sorteio aleatório transparente com validação ou desqualificação imediata com um único clique.",
          ],
        ].map(([IconComponent, title, desc]) => {
          const Icon = IconComponent as typeof Gift;
          return (
            <div
              key={title as string}
              className="rounded-3xl border-2 border-foreground bg-card p-7 shadow-pop transition-all hover:-translate-y-1"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-hero/15 text-primary">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{title as string}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc as string}</p>
            </div>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl border-t-2 border-foreground py-8 text-center text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display font-bold text-foreground">
          <Gift className="size-4 text-primary" />
          Sorteio
        </div>
        <p className="text-xs">
          Giveaways e sorteios justos para criadores, marcas e comunidades.
        </p>
      </footer>
    </div>
  );
}
