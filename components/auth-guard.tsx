"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && pathname !== "/login") {
          router.push("/login");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [pathname]);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session && pathname !== "/login") {
      router.push("/login");
      return;
    }

    if (session && pathname !== "/login") {
      const { data: kasirData } = await supabase
        .from("kasir")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (kasirData?.role !== "owner") {
        setErrorMsg("Akun ini tidak memiliki akses ke aplikasi desktop ini.");
        await supabase.auth.signOut();
        return;
      }
    }

    if (session && pathname === "/login") {
      router.push("/");
      return;
    }

    setChecking(false);
  }

  if (errorMsg) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-destructive font-medium">{errorMsg}</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  // Halaman Login: tampilkan polos, tanpa Sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Halaman lain: bungkus dengan Sidebar
return (
  <SidebarProvider>
    <AppSidebar />
    <main className="w-full">
      <AppHeader />
      {children}
    </main>
  </SidebarProvider>
);
}
