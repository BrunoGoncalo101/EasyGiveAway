import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Gift, QrCode, Users, Shuffle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sorteio — Gestão de giveaways e sorteio de vencedores" },
    { name: "description", content: "Cria giveaways, partilha o link e QR code, acompanha inscrições em tempo real e sorteia o vencedor." },
    { property: "og:title", content: "Sorteio — Gestão de giveaways" },
    { property: "og:description", content: "Cria giveaways, partilha o link e sorteia o vencedor com uma roleta." },
  ] }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen px-4">
      <header className="mx-auto flex max-w-6xl items-center justify-between py-5">
        <div className="flex items-center gap-2 font-display text-xl font-bold"><span className="grid size-9 place-items-center rounded-xl bg-hero text-primary-foreground"><Gift className="size-5" /></span>Sorteio</div>
        <Button asChild variant="outline"><Link to="/auth">Entrar</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl py-20 text-center">
        <h1 className="text-5xl font-bold leading-[1.05] sm:text-7xl">Giveaways justos, <span className="bg-hero bg-clip-text text-transparent">sorteios épicos.</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">Cria o evento, partilha o link ou QR code, vê as inscrições a chegar e roda a roleta para escolher o vencedor.</p>
        <Button asChild variant="hero" size="xl" className="mt-10"><Link to="/dashboard">Criar o meu giveaway</Link></Button>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 pb-20 sm:grid-cols-3">
        {[[QrCode, "Link e QR code", "Gerados automaticamente para cada evento."], [Users, "Tempo real", "Acompanha cada inscrição no momento."], [Shuffle, "Roleta de sorteio", "Valida ou re-sorteia com um clique."]].map(([I, t, d]) => {
          const Icon = I as typeof Gift;
          return <div key={t as string} className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-pop"><Icon className="size-8 text-primary" /><h3 className="mt-4 text-xl font-bold">{t as string}</h3><p className="mt-1 text-sm text-muted-foreground">{d as string}</p></div>;
        })}
      </section>
    </div>
  );
}
