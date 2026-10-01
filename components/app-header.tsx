"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

// Pemetaan path ke Group dan Label halaman
const PAGE_CONFIG: Record<string, { group: string; label: string }> = {
  "/": { group: "Utama", label: "Dashboard" },
  "/katalog": { group: "Data Master", label: "Manajemen Katalog" },
  "/barber": { group: "Data Master", label: "Manajemen Barber" },
  "/kasir": { group: "Data Master", label: "Manajemen User" },
  "/laporan": { group: "Laporan", label: "Laporan" },
  "/pengeluaran-operasional": { group: "Keuangan", label: "Pengeluaran" },
  "/tabungan": { group: "Keuangan", label: "Tabungan" },
};

function getTodayDateWIB() {
  const now = new Date();
  // Menyesuaikan waktu lokal ke WIB (UTC+7)
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + wibOffsetMs);
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

  // Mengambil konfigurasi halaman berdasarkan pathname
  const currentPage = PAGE_CONFIG[pathname] ?? {
    group: "Halaman",
    label: "Detail",
  };

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
          <span className="text-muted-foreground">{currentPage.group}</span>
          <span className="text-muted-foreground mx-1.5">/</span>
          <span className="font-medium text-foreground">
            {currentPage.label}
          </span>
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
