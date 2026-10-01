"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Wallet, TrendingDown, Receipt, Edit3, Trash2 } from "lucide-react";

type PengeluaranOps = {
  id: string;
  keterangan: string;
  kategori: string | null;
  nominal: number;
  created_at: string;
};

const KATEGORI_OPTIONS = [
  "Sewa Tempat",
  "Listrik & Air",
  "Gaji Karyawan",
  "Internet & Komunikasi",
  "Perawatan & Perbaikan",
  "Pemasaran & Iklan",
  "Lain-lain",
];

const emptyForm = {
  keterangan: "",
  kategori: "Sewa Tempat",
  customKategori: "",
  nominal: "",
};

// Helper untuk format angka ke Rupiah saat mengetik (e.g. 20000 -> Rp 20.000)
function formatRupiahInput(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const numberString = String(value).replace(/[^0-9]/g, "");
  if (!numberString) return "";
  const formatted = Number(numberString).toLocaleString("id-ID");
  return `Rp ${formatted}`;
}

// Helper untuk mengambil angka murni dari string berkulit Rp
function parseRupiahNumber(value: string): number {
  const numberOnly = value.replace(/[^0-9]/g, "");
  return numberOnly ? Number(numberOnly) : 0;
}

export default function PengeluaranOperasionalPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<PengeluaranOps[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pengeluaran_operasional")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching data:", error.message);
        setList([]);
      } else {
        setList(data ?? []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function openTambah() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(item: PengeluaranOps) {
    setEditingId(item.id);
    const isStandardCat = item.kategori && KATEGORI_OPTIONS.includes(item.kategori);

    setForm({
      keterangan: item.keterangan,
      kategori: isStandardCat ? item.kategori! : item.kategori ? "Lainnya" : "Sewa Tempat",
      customKategori: !isStandardCat && item.kategori ? item.kategori : "",
      nominal: formatRupiahInput(item.nominal),
    });
    setShowDialog(true);
  }

  async function handleSave() {
    const rawNominal = parseRupiahNumber(form.nominal);

    if (!form.keterangan.trim() || !rawNominal) {
      alert("Keterangan dan nominal wajib diisi");
      return;
    }

    const finalKategori =
      form.kategori === "Lainnya"
        ? form.customKategori.trim() || null
        : form.kategori;

    setSaving(true);

    const payload = {
      keterangan: form.keterangan.trim(),
      kategori: finalKategori,
      nominal: rawNominal,
    };

    let error;
    try {
      if (editingId) {
        const res = await supabase
          .from("pengeluaran_operasional")
          .update(payload)
          .eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("pengeluaran_operasional").insert(payload);
        error = res.error;
      }
    } catch (err: any) {
      error = err;
    }

    setSaving(false);

    if (error) {
      alert("Gagal menyimpan: " + (error.message || "Terjadi kesalahan"));
      return;
    }

    setShowDialog(false);
    await fetchData();
  }

  async function handleDelete(item: PengeluaranOps) {
    if (!confirm(`Hapus catatan "${item.keterangan}"?`)) return;

    const { error } = await supabase
      .from("pengeluaran_operasional")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }

    await fetchData();
  }

  // Statistik Ringkasan
  const totalTransaksi = list.length;
  const totalNominal = list.reduce((sum, item) => sum + item.nominal, 0);
  const rataRataPengeluaran = totalTransaksi > 0 ? Math.round(totalNominal / totalTransaksi) : 0;

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-[1400px] mx-auto bg-slate-50 min-h-screen">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-3 gap-5">
          <div className="h-28 bg-slate-200 rounded-[24px]" />
          <div className="h-28 bg-slate-200 rounded-[24px]" />
          <div className="h-28 bg-slate-200 rounded-[24px]" />
        </div>
        <div className="h-96 bg-slate-200 rounded-[30px]" />
      </div>
    );
  }

  return (
    <div className="p-8 font-sans bg-slate-50 min-h-screen text-[#111111] max-w-[1400px] mx-auto space-y-6 pb-20">
      {/* Header Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Pengeluaran Operasional
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Kelola dan pantau seluruh beban operasional usaha harian
          </p>
        </div>
        <Button
          onClick={openTambah}
          className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full px-5 py-2.5 font-bold text-xs transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Grid Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Total Pengeluaran
            </span>
            <span className="text-2xl font-black text-[#111111]">
              Rp {totalNominal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Jumlah Transaksi
            </span>
            <span className="text-2xl font-black text-[#3138E8]">
              {totalTransaksi}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3138E8] flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Rata-rata / Catatan
            </span>
            <span className="text-2xl font-black text-[#111111]">
              Rp {rataRataPengeluaran.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[30px] p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#111111]">
            Riwayat Catatan Operasional
          </h2>
          <span className="text-[10px] font-bold bg-[#BEF264] text-black px-3 py-1 rounded-full">
            {totalTransaksi} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-gray-500 rounded-[14px]">
                <th className="py-3 px-4 rounded-l-[14px]">Tanggal</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4 text-right rounded-r-[14px]">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-gray-400 font-medium"
                  >
                    Belum ada pengeluaran operasional yang dicatat.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-[#3138E8]">
                      <span className="bg-blue-50 px-2.5 py-1 rounded-md">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {item.keterangan}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-500">
                      {item.kategori || "-"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">
                      Rp {item.nominal.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                        className="rounded-full hover:bg-slate-100 text-gray-600 font-medium h-8 px-3"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="rounded-full hover:bg-rose-50 text-rose-600 font-medium h-8 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-[28px] border-none sm:max-w-[425px] p-6 bg-white">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-black text-[#111111]">
              {editingId ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
            </DialogTitle>
            <p className="text-xs text-gray-400 font-medium">
              Isi detail rincian transaksi pengeluaran di bawah ini.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="keterangan"
                className="text-xs font-bold text-gray-700"
              >
                Keterangan
              </Label>
              <Input
                id="keterangan"
                placeholder="Contoh: Pembayaran Listrik Toko"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="kategori"
                className="text-xs font-bold text-gray-700"
              >
                Kategori
              </Label>
              <Select
                value={form.kategori}
                onValueChange={(v) =>
                  setForm({ ...form, kategori: v ?? "Sewa Tempat" })
                }
              >
                <SelectTrigger
                  id="kategori"
                  className="rounded-xl border-slate-200 text-xs h-10 font-medium text-gray-900"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {KATEGORI_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="Lainnya">Lainnya (Ketik Sendiri)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.kategori === "Lainnya" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="customKategori"
                  className="text-xs font-bold text-gray-700"
                >
                  Nama Kategori Baru
                </Label>
                <Input
                  id="customKategori"
                  placeholder="Kategori kustom..."
                  value={form.customKategori}
                  onChange={(e) =>
                    setForm({ ...form, customKategori: e.target.value })
                  }
                  className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="nominal"
                className="text-xs font-bold text-gray-700"
              >
                Nominal (Rp)
              </Label>
              <Input
                id="nominal"
                type="text"
                placeholder="Rp 0"
                value={form.nominal}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nominal: formatRupiahInput(e.target.value),
                  })
                }
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="rounded-full text-xs font-bold hover:bg-slate-100 h-10"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full text-xs font-bold h-10 px-6"
            >
              {saving ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}