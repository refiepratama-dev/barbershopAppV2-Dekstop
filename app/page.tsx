"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  QrCode,
  Users,
  TrendingDown,
  TrendingUp,
  Clock,
  Plus,
  BarChart3,
  Lightbulb,
  PieChart,
} from "lucide-react";

type BarberStat = {
  nama: string;
  status_aktif: boolean;
  D: number;
  A: number;
  B: number;
  C: number;
  S: number;
  total: number;
};

type PengeluaranItem = {
  id: string;
  created_at: string;
  keterangan: string;
  nominal: number;
  dicatat_oleh?: string;
};

// Data Statis untuk Jam Ramai Pelanggan
const JAM_RAMAI_DATA = [
  { jam: "10:00", count: 2, isPeak: false },
  { jam: "12:00", count: 4, isPeak: false },
  { jam: "14:00", count: 5, isPeak: false },
  { jam: "16:00", count: 7, isPeak: false },
  { jam: "18:00", count: 9, isPeak: true },
  { jam: "19:00", count: 11, isPeak: true },
  { jam: "20:00", count: 6, isPeak: false },
  { jam: "21:00", count: 3, isPeak: false },
];

// Data Statis untuk Donut Chart (Kategori Layanan Terlaris)
const CATEGORY_DONUT_DATA = [
  { label: "Dewasa (D)", percent: 55, color: "#3138E8" },
  { label: "Anak-Anak (A)", percent: 20, color: "#BEF264" },
  { label: "Bayi (B)", percent: 15, color: "#111111" },
  { label: "Semir (S)", percent: 10, color: "#94A3B8" },
];

function getTodayRangeUTC() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const todayLocal = new Date(now.getTime() - offsetMs);
  const today = todayLocal.toISOString().split("T")[0];
  return {
    today,
    start: new Date(`${today}T00:00:00+07:00`).toISOString(),
    end: new Date(`${today}T23:59:59+07:00`).toISOString(),
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tokoBuka, setTokoBuka] = useState(true);
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [totalKomisi, setTotalKomisi] = useState(0); // <-- Perbaikan Poin 3: State ditambah
  const [totalCash, setTotalCash] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [countCash, setCountCash] = useState(0);
  const [countQris, setCountQris] = useState(0);
  const [barberStats, setBarberStats] = useState<BarberStat[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranItem[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    const { today, start, end } = getTodayRangeUTC();

    const [shiftRes, transaksiRes, pengeluaranRes] = await Promise.all([
      supabase
        .from("shift")
        .select("status")
        .eq("tanggal", today)
        .maybeSingle(),
      supabase
        .from("transaksi")
        .select(
          "id, total, metode_bayar, barbers(nama, status_aktif), transaksi_item(qty, nominal_komisi_snapshot, katalog(kode))"
        )
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("pengeluaran")
        .select("id, created_at, keterangan, nominal, kasir(nama)")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false }),
    ]);

    let pendapatan = 0,
      cash = 0,
      qris = 0,
      cCash = 0,
      cQris = 0,
      totalKomisiVal = 0; // Menggunakan variabel sementara agar tidak bentrok dengan nama state
    const statPerBarber: Record<string, BarberStat> = {};

    transaksiRes.data?.forEach((trx: any) => {
      pendapatan += trx.total;
      if (trx.metode_bayar === "cash") {
        cash += trx.total;
        cCash += 1;
      }
      if (trx.metode_bayar === "qris") {
        qris += trx.total;
        cQris += 1;
      }

      const namaBarber = trx.barbers?.nama ?? "Tanpa Barber";
      if (!statPerBarber[namaBarber]) {
        statPerBarber[namaBarber] = {
          nama: namaBarber,
          status_aktif: trx.barbers?.status_aktif ?? true,
          D: 0,
          A: 0,
          B: 0,
          C: 0,
          S: 0,
          total: 0,
        };
      }
      trx.transaksi_item?.forEach((item: any) => {
        const kode = item.katalog?.kode as
          | "D"
          | "A"
          | "B"
          | "C"
          | "S"
          | undefined;
        if (kode && statPerBarber[namaBarber][kode] !== undefined) {
          statPerBarber[namaBarber][kode] += item.qty;
          if (kode !== "C") {
            statPerBarber[namaBarber].total += item.qty;
          }
        }
        totalKomisiVal += (item.nominal_komisi_snapshot ?? 0) * (item.qty ?? 1);
      });
    });

    const listKeluar: PengeluaranItem[] =
      pengeluaranRes.data?.map((p: any) => ({
        id: p.id,
        created_at: p.created_at,
        keterangan: p.keterangan || "Pengeluaran Kasir",
        nominal: p.nominal,
        dicatat_oleh: p.kasir?.nama || "Kasir",
      })) || [];

    const totalKeluar = listKeluar.reduce((sum, p) => sum + p.nominal, 0);

    setTokoBuka(shiftRes.data?.status !== "tutup");
    setTotalPendapatan(pendapatan);
    setTotalKomisi(totalKomisiVal); // <-- Perbaikan Poin 3: Simpan nilai komisi ke state
    setTotalCash(cash);
    setTotalQris(qris);
    setCountCash(cCash);
    setCountQris(cQris);
    setBarberStats(Object.values(statPerBarber));
    setPengeluaranList(listKeluar);
    setTotalPengeluaran(totalKeluar);
    setLoading(false);
  }

  // Perbaikan Poin 4: Laba bersih sekarang memotong totalKomisi dari state
  const labaBersih = totalPendapatan - totalKomisi - totalPengeluaran;
  const totalTrx = countCash + countQris;
  const cashPercent =
    totalTrx > 0 ? Math.round((countCash / totalTrx) * 100) : 0;
  const qrisPercent = totalTrx > 0 ? 100 - cashPercent : 0;

  // Akumulasi Barber
  const totalBarberAktif = barberStats.filter((b) => b.status_aktif).length;
  const totalPelangganAllBarber = barberStats.reduce((a, b) => a + b.total, 0);
  const totalD = barberStats.reduce((a, b) => a + b.D, 0);
  const totalA = barberStats.reduce((a, b) => a + b.A, 0);
  const totalB = barberStats.reduce((a, b) => a + b.B, 0);
  const totalC = barberStats.reduce((a, b) => a + b.C, 0);
  const totalS = barberStats.reduce((a, b) => a + b.S, 0);

  // Nilai maksimum untuk kalkulasi tinggi bar chart statis
  const maxCount = Math.max(...JAM_RAMAI_DATA.map((d) => d.count));

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-[1400px] mx-auto">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-4 gap-5">
          <div className="h-36 bg-slate-200 rounded-[24px] col-span-2" />
          <div className="h-36 bg-slate-200 rounded-[24px]" />
          <div className="h-36 bg-slate-200 rounded-[24px]" />
        </div>
        <div className="h-64 bg-slate-200 rounded-[30px]" />
      </div>
    );
  }

  return (
    <div className="p-8 font-sans bg-slate-50 min-h-screen text-[#111111] max-w-[1400px] mx-auto space-y-6 pb-20">
      {/* Grid Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Main Card: Pendapatan & Saldo (Blue Gradient) */}
        <div
          className="md:col-span-6 rounded-[24px] p-6 text-white flex flex-col justify-between"
          style={{
            background: "linear-gradient(180deg, #3138E8 0%, #5E68FF 100%)",
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold tracking-wide text-white/80">
              Saldo Hari Ini
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-white backdrop-blur-sm">
              Terkini
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 divide-x divide-white/20">
            <div>
              <span className="text-xs text-white/70 font-medium block mb-1">
                Total Pendapatan
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold opacity-90">Rp</span>
                <span className="text-3xl font-black tracking-tight">
                  {totalPendapatan.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="pl-4">
              <span className="text-xs text-white/70 font-medium block mb-1">
                Laba Bersih
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold opacity-90">Rp</span>
                <span className="text-3xl font-black tracking-tight">
                  {labaBersih.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Small Card 1: Total Pelanggan */}
        <div className="md:col-span-2 bg-white rounded-[24px] p-5 border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold text-[#111111]">Pelanggan</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#111111]">
              {totalPelangganAllBarber}
            </div>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">
              total pelanggan
            </span>
          </div>
        </div>

        {/* Small Card 2: Pengeluaran */}
        <div className="md:col-span-2 bg-white rounded-[24px] p-5 border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-semibold text-[#111111]">
              Pengeluaran
            </span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#DC2626]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-0.5 text-[#DC2626]">
              <span className="text-xs font-bold">Rp</span>
              <span className="text-2xl font-black">
                {totalPengeluaran.toLocaleString("id-ID")}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">
              total pengeluaran
            </span>
          </div>
        </div>

        {/* Small Card 3: Barber Aktif */}
        <div className="md:col-span-2 bg-white rounded-[24px] p-5 border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-semibold text-[#111111]">
              Barber Aktif
            </span>
            <div className="w-8 h-8 rounded-full bg-[#BEF264]/30 flex items-center justify-center text-slate-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#111111]">
              {totalBarberAktif}
            </div>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">
              personel bertugas
            </span>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Metode Pembayaran, Donut Chart Kategori & Jam Ramai */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Metode Pembayaran Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-[30px] p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#111111] mb-0.5">
              Metode Pembayaran
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">
              Rasio transaksi kasir hari ini
            </p>

            {/* Bar Visual Ratio */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-6">
              <div
                className="h-full bg-[#3138E8] transition-all duration-500"
                style={{ width: `${cashPercent}%` }}
              />
              <div
                className="h-full bg-[#BEF264] transition-all duration-500"
                style={{ width: `${qrisPercent}%` }}
              />
            </div>

            <div className="space-y-3">
              {/* Cash */}
              <div className="flex items-center justify-between p-3.5 rounded-[20px] bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-[#3138E8] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-gray-800">
                      Tunai (Cash)
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">
                      {countCash} Transaksi ({cashPercent}%)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400">
                    Rp{" "}
                  </span>
                  <span className="text-sm font-black text-[#111111]">
                    {totalCash.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* QRIS */}
              <div className="flex items-center justify-between p-3.5 rounded-[20px] bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-slate-800 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-gray-800">
                      QRIS / Digital
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">
                      {countQris} Transaksi ({qrisPercent}%)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400">
                    Rp{" "}
                  </span>
                  <span className="text-sm font-black text-[#111111]">
                    {totalQris.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
            <span>●</span> Kas tercatat sinkron
          </p>
        </div>

        {/* Donut Chart: Kategori Layanan Statis */}
        <div className="lg:col-span-4 bg-white rounded-[30px] p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <h2 className="text-sm font-bold text-[#111111]">
                Kategori Layanan
              </h2>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              Komposisi jenis pangkas hari ini
            </p>

            {/* Static Conic Gradient Donut */}
            <div className="flex justify-center my-2">
              <div
                className="relative w-36 h-36 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(
                    #3138E8 0% 55%, 
                    #BEF264 55% 75%, 
                    #111111 75% 90%, 
                    #94A3B8 90% 100%
                  )`,
                }}
              >
                {/* Center Hole for Donut Effect */}
                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-lg font-black text-[#111111] leading-none mt-0.5">
                    {totalPelangganAllBarber}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">
                    layanan
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              {CATEGORY_DONUT_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="truncate">
                    <span className="text-[11px] font-semibold text-gray-700 block truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {item.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-slate-100">
            Layanan Dewasa mendominasi proporsi hari ini.
          </p>
        </div>

        {/* Jam Ramai Pelanggan (Statis Bar Chart) */}
        <div className="lg:col-span-4 bg-white rounded-[30px] p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <h2 className="text-sm font-bold text-[#111111]">Jam Ramai</h2>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              Distribus kedatangan jam operasional
            </p>

            {/* Static Bar Chart */}
            <div className="h-32 flex items-end justify-between gap-1.5 px-1 pt-4 pb-1 border-b border-slate-100">
              {JAM_RAMAI_DATA.map((item, idx) => {
                const heightPercent = Math.round((item.count / maxCount) * 100);
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <span
                      className={`text-[9px] font-bold ${
                        item.isPeak ? "text-[#3138E8]" : "text-gray-400"
                      }`}
                    >
                      {item.count}
                    </span>

                    <div className="w-full bg-slate-100 h-full rounded-t-md flex items-end overflow-hidden">
                      <div
                        className={`w-full transition-all duration-500 rounded-t-md ${
                          item.isPeak
                            ? "bg-[#3138E8]"
                            : "bg-slate-200 group-hover:bg-slate-300"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <span className="text-[9px] font-medium text-gray-400">
                      {item.jam}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Note / Insight */}
          <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50/80 border border-amber-100 px-3 py-2 rounded-[14px]">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              Jam ramai puncak pukul <strong>18:00 - 20:00 WIB</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Grid Row 3: Statistik Barber Table */}
      <div className="bg-white rounded-[30px] p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-[#111111]">
              Statistik Barber Hari Ini
            </h2>
            <span className="text-[10px] font-bold bg-[#BEF264] text-black px-2.5 py-0.5 rounded-full">
              {totalBarberAktif} Barber Aktif
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-gray-500 rounded-[14px]">
                <th className="py-3 px-4 rounded-l-[14px]">Nama Pegawai</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">D</th>
                <th className="py-3 px-4 text-center">A</th>
                <th className="py-3 px-4 text-center">B</th>
                <th className="py-3 px-4 text-center">C</th>
                <th className="py-3 px-4 text-center">S</th>
                <th className="py-3 px-4 text-center rounded-r-[14px]">
                  Akumulasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {barberStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-gray-400 font-medium"
                  >
                    Belum ada transaksi layanan hari ini
                  </td>
                </tr>
              ) : (
                barberStats.map((b) => (
                  <tr
                    key={b.nama}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {b.nama
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <span>{b.nama}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-block ${
                          b.status_aktif
                            ? "bg-[#BEF264]/50 text-slate-900"
                            : "bg-slate-100 text-gray-400"
                        }`}
                      >
                        {b.status_aktif ? "● Aktif" : "Off"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                      {b.D || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                      {b.A || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                      {b.B || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                      {b.C || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                      {b.S || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-[#3138E8]">
                      {b.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {barberStats.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 text-xs font-bold text-gray-800 bg-slate-50/50">
                  <td className="py-3 px-4" colSpan={2}>
                    Total Akumulasi Hari Ini
                  </td>
                  <td className="py-3 px-4 text-center">{totalD}</td>
                  <td className="py-3 px-4 text-center">{totalA}</td>
                  <td className="py-3 px-4 text-center">{totalB}</td>
                  <td className="py-3 px-4 text-center">{totalC}</td>
                  <td className="py-3 px-4 text-center">{totalS}</td>
                  <td className="py-3 px-4 text-center text-[#3138E8]">
                    {totalPelangganAllBarber}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Grid Row 4: Pengeluaran Table */}
      <div className="bg-white rounded-[30px] p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-[#111111]">
              Kas Keluar Kasir Hari Ini
            </h2>
            <span className="text-[10px] font-bold bg-red-100 text-[#DC2626] px-2.5 py-0.5 rounded-full">
              {pengeluaranList.length} Catatan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-gray-500 rounded-[14px]">
                <th className="py-3 px-4 rounded-l-[14px]">Waktu</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                <th className="py-3 px-4 text-right rounded-r-[14px]">
                  Nominal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {pengeluaranList.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-gray-400 font-medium"
                  >
                    Belum ada pengeluaran dicatat hari ini
                  </td>
                </tr>
              ) : (
                pengeluaranList.map((p) => {
                  const jam = new Date(p.created_at).toLocaleTimeString(
                    "id-ID",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-gray-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        {jam} WIB
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {p.keterangan}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium">
                        {p.dicatat_oleh}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#DC2626]">
                        Rp {p.nominal.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {pengeluaranList.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 text-xs font-bold text-gray-800 bg-slate-50/50">
                  <td className="py-3 px-4" colSpan={3}>
                    Total Kas Keluar
                  </td>
                  <td className="py-3 px-4 text-right text-[#DC2626]">
                    Rp {totalPengeluaran.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
