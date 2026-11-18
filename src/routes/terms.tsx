import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, ArrowLeft, Scale, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Easy Giveaway" },
      {
        name: "description",
        content:
          "Termos e Condições de Utilização do Easy Giveaway. Regras de conduta para organizadores e participantes de sorteios.",
      },
      { property: "og:title", content: "Termos de Uso — Easy Giveaway" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8 animate-pop-in">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Voltar ao início
          </Link>
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid size-8 place-items-center rounded-xl bg-hero text-primary-foreground shadow-pop">
              <Gift className="size-4" />
            </span>
            Easy Giveaway
          </div>
        </div>

        {/* Título Principal */}
        <div className="border-b-2 border-foreground pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <Scale className="size-3.5" />
            Termos e Condições Legais
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Termos de Utilização
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground text-sm">
              Ao aceder e utilizar o <strong>Easy Giveaway</strong> (doravante designada por "Plataforma"), quer na qualidade de organizador de eventos, quer na qualidade de participante, concorda integralmente em cumprir e vincular-se aos presentes Termos de Utilização e à nossa Política de Privacidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground text-sm">
              O Easy Giveaway fornece uma ferramenta de software baseada na web para a criação de páginas de inscrição em sorteios, contagem de participantes em tempo real e seleção aleatória criptográfica de vencedores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. Responsabilidades dos Organizadores</h2>
            <p className="text-muted-foreground text-sm">
              Ao criar um giveaway ou sorteio na nossa Plataforma, o Organizador declara e compromete-se a:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li>Cumprir todas as leis locais e regulamentos aplicáveis à promoção de concursos, sorteios e ofertas de brindes na sua jurisdição;</li>
              <li>Entregar de boa-fé o prémio prometido ao participante vencedor legalmente apurado;</li>
              <li>Não utilizar a plataforma para atividades ilícitas, esquemas em pirâmide, jogos de azar não autorizados, apostas ilegais ou conteúdos enganosos;</li>
              <li>Respeitar a privacidade dos participantes e não partilhar os seus dados pessoais com terceiros não autorizados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Regras para Participantes</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li>Cada participante apenas pode submeter uma inscrição por sorteio (sendo expressamente proibido o recurso a bots, scripts automatizados ou emails descartáveis falsos);</li>
              <li>Qualquer participante que viole as regras estabelecidas pelo organizador do giveaway poderá ser desqualificado pelo mesmo antes ou após o sorteio;</li>
              <li>O Easy Giveaway não é responsável pela validação da elegibilidade dos prémios, sendo essa responsabilidade exclusiva do organizador do evento.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Isenção e Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground text-sm">
              O Easy Giveaway atua meramente como fornecedor tecnológico do software de sorteio. A Plataforma não patrocina, administra, avalia nem garante a veracidade ou o envio dos prémios prometidos por organizadores independentes. Em caso de litígio entre participante e organizador, o participante deverá resolver a questão diretamente com o respetivo promotor do sorteio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Propriedade Intelectual e Publicidade</h2>
            <p className="text-muted-foreground text-sm">
              Todos os elementos da interface, marcas, design e algoritmos pertencem ao Easy Giveaway. A Plataforma reserva-se o direito de exibir anúncios publicitários de parceiros aprovados em páginas do serviço, de forma a manter o fornecimento gratuito da infraestrutura.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Alterações aos Termos</h2>
            <p className="text-muted-foreground text-sm">
              Reservamo-nos o direito de atualizar ou modificar os presentes Termos de Utilização a qualquer momento. A continuação da utilização da Plataforma após a publicação de alterações constitui a aceitação tácita dos novos termos.
            </p>
          </section>
        </div>

        {/* Rodapé da Página */}
        <div className="pt-8 border-t-2 border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Easy Giveaway. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground underline">
              Política de Privacidade
            </Link>
            <Link to="/" className="hover:text-foreground underline">
              Página Principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
