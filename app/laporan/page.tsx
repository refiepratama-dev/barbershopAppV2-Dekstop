"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  TrendingUp,
  CreditCard,
  Banknote,
  Scissors,
  ArrowDownRight,
  PieChart,
  ChevronRight,
  Wallet,
  Receipt,
} from "lucide-react";

type ShiftTutup = {
  id: string;
  tanggal: string;
  ditutup_at: string | null;
  omzet: number;
};

type KomisiBarber = { nama: string; omzet: number; komisi: number };

type ItemPengeluaran = {
  id: string;
  keterangan: string;
  nominal: number;
  created_at: string;
};

type DetailLaporan = {
  omzetLayanan: number;
  omzetProduk: number;
  totalCash: number;
  totalQris: number;
  totalKomisi: number;
  kasKeluar: number;
  labaBersih: number;
  komisiPerBarber: KomisiBarber[];
  daftarPengeluaran: ItemPengeluaran[];
};

function getRangeUTC(tanggal: string) {
  return {
    start: new Date(`${tanggal}T00:00:00+07:00`).toISOString(),
    end: new Date(`${tanggal}T23:59:59+07:00`).toISOString(),
  };
}

export default function LaporanPage() {
  const [loading, setLoading] = useState(true);
  const [shiftList, setShiftList] = useState<ShiftTutup[]>([]);
  const [selectedShift, setSelectedShift] = useState<ShiftTutup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DetailLaporan | null>(null);

  useEffect(() => {
    fetchLaporanHarian();
  }, []);

  async function fetchLaporanHarian() {
    setLoading(true);
    try {
      const { data: shifts, error } = await supabase
        .from("shift")
        .select("id, tanggal, ditutup_at")
        .eq("status", "tutup")
        .order("tanggal", { ascending: false });

      if (error || !shifts || shifts.length === 0) {
        setShiftList([]);
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        shifts.map(async (shift) => {
          const { start, end } = getRangeUTC(shift.tanggal);
          const { data: transaksi } = await supabase
            .from("transaksi")
            .select("total")
            .gte("created_at", start)
            .lte("created_at", end);
          const omzet = transaksi?.reduce((sum, t) => sum + t.total, 0) ?? 0;
          return {
            id: shift.id,
            tanggal: shift.tanggal,
            ditutup_at: shift.ditutup_at,
            omzet,
          };
        })
      );

      setShiftList(results);
      if (results.length > 0) {
        openDetail(results[0]);
      }
    } catch (err) {
      console.error("Error fetching shift laporan:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(shift: ShiftTutup) {
    setSelectedShift(shift);
    setDetailLoading(true);
    try {
      const { start, end } = getRangeUTC(shift.tanggal);

      const [{ data: transaksi }, { data: pengeluaran }] = await Promise.all([
        supabase
          .from("transaksi")
          .select(
            "total, metode_bayar, barbers(nama), transaksi_item(subtotal, nominal_komisi_snapshot, qty, katalog(kategori))"
          )
          .gte("created_at", start)
          .lte("created_at", end),
        supabase
          .from("pengeluaran")
          .select("id, keterangan, nominal, created_at")
          .gte("created_at", start)
          .lte("created_at", end)
          .order("created_at", { ascending: false }),
      ]);

      let omzetLayanan = 0;
      let omzetProduk = 0;
      let totalCash = 0;
      let totalQris = 0;
      let totalKomisi = 0;
      const komisiMap: Record<string, KomisiBarber> = {};

      transaksi?.forEach((trx: any) => {
        if (trx.metode_bayar === "cash") totalCash += trx.total;
        if (trx.metode_bayar === "qris") totalQris += trx.total;

        const namaBarber = trx.barbers?.nama ?? "Tanpa Barber";
        if (!komisiMap[namaBarber]) {
          komisiMap[namaBarber] = { nama: namaBarber, omzet: 0, komisi: 0 };
        }

        trx.transaksi_item?.forEach((item: any) => {
          const komisiItem =
            (item.nominal_komisi_snapshot ?? 0) * (item.qty ?? 1);

          if (item.katalog?.kategori === "produk") {
            omzetProduk += item.subtotal;
          } else {
            omzetLayanan += item.subtotal;
          }

          komisiMap[namaBarber].omzet += item.subtotal;
          komisiMap[namaBarber].komisi += komisiItem;
          totalKomisi += komisiItem;
        });
      });

      const daftarPengeluaran: ItemPengeluaran[] = pengeluaran ?? [];
      const kasKeluar = daftarPengeluaran.reduce(
        (sum, p) => sum + p.nominal,
        0
      );
      const totalOmzet = omzetLayanan + omzetProduk;

      setDetail({
        omzetLayanan,
        omzetProduk,
        totalCash,
        totalQris,
        totalKomisi,
        kasKeluar,
        labaBersih: totalOmzet - totalKomisi - kasKeluar,
        komisiPerBarber: Object.values(komisiMap),
        daftarPengeluaran,
      });
    } catch (err) {
      console.error("Error fetching detail laporan:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  function formatTanggal(tanggal: string) {
    return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatWaktu(isoString: string) {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-[1400px] mx-auto bg-slate-50 min-h-screen">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4 h-96 bg-slate-200 rounded-[30px]" />
          <div className="col-span-12 md:col-span-8 h-96 bg-slate-200 rounded-[30px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-sans bg-slate-50 min-h-screen text-[#111111] max-w-[1400px] mx-auto space-y-6 pb-20">
      {/* Header Top */}
      <div>
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">
          Laporan Kasir & Omzet
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Rekap harian keuangan, rincian per metode bayar, pengeluaran, dan
          pembagian komisi barber
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri - List Shift */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[30px] p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3138E8]" />
              Riwayat Shift Tutup
            </h2>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {shiftList.length} Hari
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {shiftList.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-12 font-medium">
                Belum ada laporan shift yang ditutup.
              </p>
            ) : (
              shiftList.map((shift) => {
                const isSelected = selectedShift?.id === shift.id;
                return (
                  <button
                    key={shift.id}
                    onClick={() => openDetail(shift)}
                    className={`w-full text-left p-3.5 rounded-[20px] transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#3138E8] text-white border-[#3138E8] shadow-md shadow-blue-500/10"
                        : "bg-slate-50/50 hover:bg-slate-100/80 border-slate-100 text-[#111111]"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          isSelected ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {formatTanggal(shift.tanggal)}
                      </p>
                      <p
                        className={`text-[11px] font-semibold mt-1 ${
                          isSelected ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        Omzet: Rp {shift.omzet.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isSelected ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan - Detail Laporan */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[30px] p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-[#3138E8] uppercase tracking-wider block">
                Rincian Shift Terpilih
              </span>
              <h2 className="text-base font-black text-[#111111]">
                {selectedShift
                  ? formatTanggal(selectedShift.tanggal)
                  : "Pilih Tanggal Laporan"}
              </h2>
            </div>
            {selectedShift && (
              <span className="text-xs font-bold bg-[#BEF264] text-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Shift Selesai
              </span>
            )}
          </div>

          {detailLoading ? (
            <div className="py-20 text-center">
              <p className="text-xs font-semibold text-gray-400 animate-pulse">
                Memproses kalkulasi detail keuangan...
              </p>
            </div>
          ) : !detail ? (
            <div className="py-20 text-center text-xs text-gray-400 font-medium">
              Silakan pilih salah satu laporan di sebelah kiri untuk melihat
              rinciannya.
            </div>
          ) : (
            <>
              {/* Highlight Cards Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-[24px] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 block mb-0.5">
                      Laba Bersih
                    </span>
                    <span className="text-xl font-black text-emerald-600">
                      Rp {detail.labaBersih.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-red-50/60 border border-red-100 rounded-[24px] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-800 block mb-0.5">
                      Total Pengeluaran (Kas Keluar)
                    </span>
                    <span className="text-xl font-black text-red-600">
                      Rp {detail.kasKeluar.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Rincian Pemasukan & Metode Bayar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Breakout Sumber Omzet */}
                <div className="bg-slate-50/60 rounded-[24px] p-4 border border-slate-100 space-y-3">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-[#3138E8]" />
                    Sumber Omzet
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Omzet Layanan
                      </span>
                      <span className="font-bold text-gray-900">
                        Rp {detail.omzetLayanan.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Omzet Produk
                      </span>
                      <span className="font-bold text-gray-900">
                        Rp {detail.omzetProduk.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakout Metode Bayar */}
                <div className="bg-slate-50/60 rounded-[24px] p-4 border border-slate-100 space-y-3">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#3138E8]" />
                    Metode Pembayaran
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-gray-400" />
                        Tunai (Cash)
                      </span>
                      <span className="font-bold text-gray-900">
                        Rp {detail.totalCash.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        Nontunai (QRIS)
                      </span>
                      <span className="font-bold text-gray-900">
                        Rp {detail.totalQris.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Rincian Pengeluaran Harian */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-red-500" />
                    Rincian Pengeluaran Hari Ini
                  </h3>
                  <span className="text-xs font-black text-red-500">
                    Total: Rp {detail.kasKeluar.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {detail.daftarPengeluaran.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium italic py-3 text-center bg-slate-50/50 rounded-[20px] border border-slate-100">
                      Tidak ada catatan pengeluaran pada shift ini.
                    </p>
                  ) : (
                    detail.daftarPengeluaran.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center bg-red-50/30 p-3 rounded-[20px] border border-red-100/60 text-xs"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-900 capitalize">
                            {p.keterangan || "Pengeluaran Kas"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatWaktu(p.created_at)} WIB
                          </span>
                        </div>
                        <span className="font-black text-red-600 text-sm">
                          - Rp {p.nominal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rincian Komisi Barber */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-[#3138E8]" />
                    Rincian Komisi Barber
                  </h3>
                  <span className="text-xs font-black text-[#3138E8]">
                    Total Komisi: Rp{" "}
                    {detail.totalKomisi.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-2">
                  {detail.komisiPerBarber.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium italic py-2">
                      Tidak ada data pangkas/komisi pada shift ini.
                    </p>
                  ) : (
                    detail.komisiPerBarber.map((b) => (
                      <div
                        key={b.nama}
                        className="flex justify-between items-center bg-slate-50/80 p-3.5 rounded-[20px] border border-slate-100 text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-900 block">
                            {b.nama}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            Omzet Dihasilkan: Rp{" "}
                            {b.omzet.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                            Hak Komisi
                          </span>
                          <span className="font-black text-[#3138E8] text-sm">
                            Rp {b.komisi.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
