"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/katalog": "Manajemen Katalog",
  "/barber": "Manajemen Barber",
  "/kasir": "Manajemen Kasir",
  "/laporan": "Laporan Harian",
  "/tabungan": "Tabungan",
};

function getTodayDateWIB() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const wib = new Date(now.getTime() - offsetMs);
  return wib.toISOString().split("T")[0];
}

export function AppHeader() {
  const pathname = usePathname();
  const [tokoBuka, setTokoBuka] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    const today = getTodayDateWIB();
    const { data } = await supabase
      .from("shift")
      .select("status")
      .eq("tanggal", today)
      .maybeSingle();
    setTokoBuka(data?.status === "buka");
    setLoading(false);
  }

  const pageLabel = PAGE_LABELS[pathname] ?? "Halaman";
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
      {/* Collapse button + Breadcrumb — kiri */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <span className="text-sm">
          <span className="text-muted-foreground">Utama</span>
          <span className="text-muted-foreground mx-1.5">/</span>
          <span className="font-medium text-foreground">{pageLabel}</span>
        </span>
      </div>

      {/* Status toko + Tanggal — kanan */}
      <div className="flex items-center gap-3">
        {!loading && (
          <Badge className="rounded-full px-4 py-1.5 bg-black text-white hover:bg-black">
            {tokoBuka ? "Toko Buka" : "Toko Tutup"}
          </Badge>
        )}
        <Badge variant="outline" className="rounded-full px-4 py-1.5">
          {todayFormatted}
        </Badge>
      </div>
    </div>
  );
}
