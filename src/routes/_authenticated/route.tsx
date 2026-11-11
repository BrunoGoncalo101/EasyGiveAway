import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Gift, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Tentar ler sessão atual (restaurada de localStorage ou hash OAuth)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return { user: sessionData.session.user };
    }

    // 2. Confirmação com getUser caso a sessão esteja em revalidação
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Organizador";
  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "";
  const initials = fullName
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão terminada.");
      nav({ to: "/auth" });
    } catch {
      toast.error("Erro ao terminar sessão.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight transition-transform hover:scale-105"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-hero text-primary-foreground shadow-pop">
              <Gift className="size-5" />
            </span>
            Sorteio
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <LayoutDashboard className="size-4" />
              Giveaways
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 pl-2 pr-3 py-1">
              <Avatar className="size-7 border border-foreground/20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold leading-none max-w-[140px] truncate">
                  {fullName}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight max-w-[140px] truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
