import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Gift, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-foreground bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-hero text-primary-foreground"><Gift className="size-5" /></span>
            Sorteio
          </Link>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> Sair</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
