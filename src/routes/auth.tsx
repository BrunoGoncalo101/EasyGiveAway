import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Gift, ArrowLeft, Loader2, AlertCircle, KeyRound, ShieldAlert, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Easy Giveaway" },
      { name: "description", content: "Acede ao painel do organizador de giveaways." },
      { property: "og:title", content: "Entrar — Easy Giveaway" },
      { property: "og:description", content: "Acede ao painel do organizador de giveaways." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [oauthErrorDetails, setOauthErrorDetails] = useState<string | null>(null);

  // Estado para validação do código de convite no login com Google
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleInviteInput, setGoogleInviteInput] = useState("");
  const [googleInviteError, setGoogleInviteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // 1. Verificar se a URL contém erro de callback OAuth
    if (typeof window !== "undefined") {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const search = window.location.search.startsWith("?") ? window.location.search.slice(1) : "";
      const queryParams = new URLSearchParams(hash || search);

      const err = queryParams.get("error_description") || queryParams.get("error");
      if (err) {
        const decoded = decodeURIComponent(err);
        console.warn("[Auth OAuth Callback Error]:", decoded);
        setOauthErrorDetails(decoded);

        if (decoded.includes("missing OAuth secret") || decoded.includes("Unsupported provider")) {
          toast.error("O Google OAuth ainda não está configurado no painel do Supabase.");
        } else {
          toast.error(decoded);
        }

        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // 2. Verificar se já existe uma sessão ativa
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        if (data?.session) {
          nav({ to: "/dashboard" });
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });

    // 3. Ouvir alterações de autenticação
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        toast.success("Sessão iniciada com sucesso!");
        nav({ to: "/dashboard" });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);

    if (!email.trim()) return void toast.error("Por favor insere o teu email");

    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/dashboard`,
        });
        if (error) {
          toast.error(error.message || "Não foi possível enviar o email de recuperação.");
        } else {
          toast.success("Enviámos um link de recuperação para o teu email.");
          setMode("in");
        }
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          toast.error("Email ou palavra-passe incorretos.");
        }
      } else {
        // Modo "up" (Criar conta): validação do Código de Convite
        const configuredInviteCode = import.meta.env.VITE_INVITE_CODE;
        if (configuredInviteCode && inviteCode.trim() !== configuredInviteCode.trim()) {
          const errMsg = "Código de convite inválido. Contacta o administrador para pedir acesso.";
          setInviteError(errMsg);
          toast.error(errMsg);
          setBusy(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: name.trim() || undefined,
            },
          },
        });

        if (error) {
          toast.error(error.message);
        } else if (!data.session) {
          toast.success("Conta criada! Verifica o teu email para confirmar a conta.");
        } else {
          toast.success("Conta criada com sucesso! Bem-vindo.");
          nav({ to: "/dashboard" });
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Ocorreu um erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogleButtonClick() {
    const configuredInviteCode = import.meta.env.VITE_INVITE_CODE;
    const isAlreadyVerified =
      typeof window !== "undefined" &&
      sessionStorage.getItem("easygiveaway_invite_verified") === "true";

    // Se o código estiver configurado e ainda não tiver sido validado nesta sessão:
    if (configuredInviteCode && !isAlreadyVerified) {
      setGoogleInviteError(null);
      setGoogleInviteInput("");
      setGoogleModalOpen(true);
      return;
    }

    // Se já estiver validado ou se não houver código exigido:
    executeGoogleSignIn();
  }

  function confirmGoogleInviteCode(e: React.FormEvent) {
    e.preventDefault();
    const configuredInviteCode = import.meta.env.VITE_INVITE_CODE;

    if (configuredInviteCode && googleInviteInput.trim() !== configuredInviteCode.trim()) {
      setGoogleInviteError("Código de convite inválido. Pede acesso ao administrador.");
      return;
    }

    // Código correto: guardar validação na sessão e avançar para o Google
    if (typeof window !== "undefined") {
      sessionStorage.setItem("easygiveaway_invite_verified", "true");
    }
    setGoogleModalOpen(false);
    executeGoogleSignIn();
  }

  async function executeGoogleSignIn() {
    setGoogleBusy(true);
    setOauthErrorDetails(null);

    const redirectUrl = `${window.location.origin}/auth`;

    try {
      const isLovableHost =
        typeof window !== "undefined" &&
        (window.location.hostname.includes("lovable") || window.location.hostname.includes("gpt-eng"));

      if (isLovableHost) {
        try {
          const r = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: redirectUrl,
          });

          if (!r.error) {
            if (!r.redirected) {
              nav({ to: "/dashboard" });
            }
            return;
          }
        } catch (err) {
          console.warn("[Auth] Lovable broker falhou:", err);
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        if (error.message.includes("missing OAuth secret") || error.message.includes("Unsupported provider")) {
          setOauthErrorDetails("O Google OAuth requer que configures o Client ID e Client Secret no painel do Supabase.");
          toast.error("Google OAuth ainda não configurado no Supabase.");
        } else {
          toast.error(error.message);
        }
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err?.message || "Ocorreu um erro ao iniciar sessão com o Google.");
    } finally {
      setGoogleBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center px-4 bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <span className="grid size-12 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-pop">
            <Gift className="size-6 animate-bounce" />
          </span>
          <p className="text-sm font-medium">A verificar sessão…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8 bg-background">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao início
        </Link>

        <div className="rounded-3xl border-2 border-foreground bg-card p-8 shadow-pop">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-sm">
              <Gift className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {mode === "in" && "Entrar"}
                {mode === "up" && "Criar conta"}
                {mode === "reset" && "Recuperar conta"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === "in" && "Acede ao teu painel de organizador"}
                {mode === "up" && "Registo exclusivo para organizadores"}
                {mode === "reset" && "Vamos enviar-te um email de recuperação"}
              </p>
            </div>
          </div>

          {oauthErrorDetails && (
            <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="size-4 shrink-0 text-amber-500" />
                <span>Configuração Google pendente</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                O fornecedor Google precisa de ter o <strong>Client ID</strong> e <strong>Secret</strong> preenchidos nas definições do teu projeto Supabase. Podes entrar entretanto com email e password abaixo.
              </p>
            </div>
          )}

          {mode !== "reset" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full font-semibold border-2 border-foreground hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                onClick={handleGoogleButtonClick}
                disabled={googleBusy || busy}
              >
                {googleBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.170 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.110-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                )}
                <span>{googleBusy ? "A conectar com o Google…" : "Continuar com Google"}</span>
              </Button>

              <div className="relative my-5 text-center text-xs text-muted-foreground">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <span className="relative bg-card px-2 uppercase tracking-wider text-[11px]">
                  ou com email
                </span>
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Campo Nome (apenas no registo) */}
            {mode === "up" && (
              <div>
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nome do Organizador
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Ex: Bruno Gonçalves ou Nome da Marca"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  disabled={busy || googleBusy}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                disabled={busy || googleBusy}
              />
            </div>

            {mode !== "reset" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Palavra-passe
                  </Label>
                  {mode === "in" && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Esqueceste-te?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="No mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  disabled={busy || googleBusy}
                />
              </div>
            )}

            {/* Campo Código de Convite (apenas no registo por email) */}
            {mode === "up" && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="inviteCode" className="text-xs font-semibold flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-primary" />
                    Código de Convite *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Exclusivo</span>
                </div>
                <Input
                  id="inviteCode"
                  type="text"
                  required
                  placeholder="Insere o teu código de acesso"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    if (inviteError) setInviteError(null);
                  }}
                  className={`border-2 ${inviteError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  disabled={busy || googleBusy}
                />
                {inviteError ? (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-destructive">
                    <ShieldAlert className="size-3.5 shrink-0" />
                    {inviteError}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Apenas organizadores com código válido podem criar conta.
                  </p>
                )}
              </div>
            )}

            <Button
              variant="hero"
              size="lg"
              className="w-full font-bold mt-2 shadow-pop"
              disabled={busy || googleBusy}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> A processar…
                </span>
              ) : mode === "in" ? (
                "Entrar"
              ) : mode === "up" ? (
                "Criar conta de Organizador"
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
            {mode === "reset" ? (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground underline"
                onClick={() => setMode("in")}
              >
                Voltar ao início de sessão
              </button>
            ) : (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground underline"
                onClick={() => {
                  setMode(mode === "in" ? "up" : "in");
                  setInviteError(null);
                }}
              >
                {mode === "in" ? "Ainda não tens conta? Cria uma" : "Já tens conta? Entra"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para pedir código de convite no login com Google */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent className="sm:max-w-md border-2 border-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-hero text-primary-foreground text-sm">
                <KeyRound className="size-4" />
              </span>
              Acesso com Google
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              O acesso como organizador é exclusivo. Insere o código de convite para autorizar a ligação com a tua conta Google.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={confirmGoogleInviteCode} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="googleInvite" className="text-xs font-semibold">
                Código de Convite
              </Label>
              <Input
                id="googleInvite"
                type="text"
                autoFocus
                required
                placeholder="Insere o código de acesso"
                value={googleInviteInput}
                onChange={(e) => {
                  setGoogleInviteInput(e.target.value);
                  if (googleInviteError) setGoogleInviteError(null);
                }}
                className={`mt-1 border-2 ${googleInviteError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {googleInviteError ? (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-destructive">
                  <ShieldAlert className="size-3.5 shrink-0" />
                  {googleInviteError}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Pede o código ao administrador caso ainda não o tenhas.
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGoogleModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="hero" size="sm" className="font-bold shadow-pop">
                Validar e Continuar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
