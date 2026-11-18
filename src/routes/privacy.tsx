import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, ArrowLeft, ShieldCheck, Lock, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Easy Giveaway" },
      {
        name: "description",
        content:
          "Política de Privacidade do Easy Giveaway. Saiba como recolhemos, utilizamos e protegemos os seus dados e informações de sorteios.",
      },
      { property: "og:title", content: "Política de Privacidade — Easy Giveaway" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <ShieldCheck className="size-3.5" />
            Em conformidade com o RGPD / GDPR
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="size-5 text-primary" /> 1. Informações que Recolhemos
            </h2>
            <p>
              O <strong>Easy Giveaway</strong> recolhe apenas os dados estritamente necessários para permitir a criação, gestão e realização justa de sorteios online:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li>
                <strong>Organizadores:</strong> Nome, endereço de email e informações de autenticação (via email/palavra-passe ou Google OAuth) necessários para aceder ao painel de controlo.
              </li>
              <li>
                <strong>Participantes:</strong> Dados solicitados pelo organizador de cada giveaway na página pública de inscrição (por exemplo: nome, email, identificador de Instagram ou TikTok).
              </li>
              <li>
                <strong>Dados Técnicos:</strong> Endereço IP (para prevenção de spam e inscrições duplicadas ilegítimas), tipo de navegador e registos técnicos de funcionamento.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="size-5 text-primary" /> 2. Como Utilizamos os Dados
            </h2>
            <p>
              Os dados recolhidos são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li>Permitir a inscrição do participante no respetivo sorteio;</li>
              <li>Garantir a unicidade e integridade das inscrições (evitando participações repetidas pela mesma pessoa);</li>
              <li>Possibilitar que o organizador realize o sorteio aleatório criptográfico e contacte o vencedor;</li>
              <li>Garantir a segurança e proteção da plataforma contra fraudes e abusos.</li>
            </ul>
            <p className="font-semibold text-foreground">
              Não vendemos, alugamos nem cedemos os dados pessoais dos participantes a empresas terceiras para efeitos de marketing direto.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="size-5 text-primary" /> 3. Cookies e Publicidade de Terceiros
            </h2>
            <p>
              O nosso website pode apresentar anúncios geridos por redes publicitárias externas (tais como o <strong>Google AdSense</strong> ou redes parceiras):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li>
                Fornecedores terceiros, incluindo a Google, utilizam cookies para veicular anúncios com base nas visitas anteriores do utilizador ao nosso ou a outros websites.
              </li>
              <li>
                Com o uso de cookies de publicidade, a Google e os seus parceiros podem veicular anúncios para os utilizadores com base nas suas visitas aos nossos sites e/ou outros sites na Internet.
              </li>
              <li>
                Os utilizadores podem desativar a publicidade personalizada acedendo às{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:opacity-80"
                >
                  Definições de Anúncios da Google
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Armazenamento e Segurança dos Dados</h2>
            <p className="text-muted-foreground text-sm">
              Todos os dados são transmitidos de forma segura através de encriptação SSL/TLS e armazenados em infraestruturas de base de dados em conformidade com as normas internacionais de segurança (PostgreSQL / Supabase com Row Level Security). Apenas o organizador de cada evento tem acesso aos dados dos seus respetivos inscritos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Os Seus Direitos (RGPD)</h2>
            <p className="text-muted-foreground text-sm">
              Nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD), qualquer utilizador ou participante tem o direito de solicitar o acesso, retificação ou eliminação definitiva dos seus dados pessoais dos nossos registos. Para exercer este direito, basta contactar o suporte ou o organizador do sorteio em que participou.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Contacto</h2>
            <p className="text-muted-foreground text-sm">
              Se tiver alguma dúvida relativamente a esta Política de Privacidade ou ao tratamento dos seus dados, entre em contacto connosco através da plataforma oficial <strong>Easy Giveaway</strong>.
            </p>
          </section>
        </div>

        {/* Rodapé da Página */}
        <div className="pt-8 border-t-2 border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Easy Giveaway. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground underline">
              Termos de Uso
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
