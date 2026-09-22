"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Tag, Edit3, Scissors, Package } from "lucide-react";

type Katalog = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  harga: number;
  nominal_komisi: number;
  is_active: boolean;
};

const emptyForm = {
  kode: "",
  nama: "",
  kategori: "layanan",
  harga: "",
  nominal_komisi: "",
  is_active: true,
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

export default function KatalogPage() {
  const [loading, setLoading] = useState(true);
  const [katalogList, setKatalogList] = useState<Katalog[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKatalog();
  }, []);

  async function fetchKatalog() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("katalog")
        .select("*")
        .order("kode");

      if (error) {
        console.error("Error fetching katalog:", error.message);
        setKatalogList([]);
      } else {
        setKatalogList(data ?? []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setKatalogList([]);
    } finally {
      setLoading(false);
    }
  }

  function openTambah() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(katalog: Katalog) {
    setEditingId(katalog.id);
    setForm({
      kode: katalog.kode,
      nama: katalog.nama,
      kategori: katalog.kategori,
      harga: formatRupiahInput(katalog.harga),
      nominal_komisi: formatRupiahInput(katalog.nominal_komisi),
      is_active: katalog.is_active,
    });
    setShowDialog(true);
  }

  async function handleSave() {
    const rawHarga = parseRupiahNumber(form.harga);
    const rawKomisi = parseRupiahNumber(form.nominal_komisi);

    if (!form.kode.trim() || !form.nama.trim() || !rawHarga) {
      alert("Kode, nama, dan harga wajib diisi");
      return;
    }

    setSaving(true);

    const payload = {
      kode: form.kode.trim().toUpperCase(),
      nama: form.nama.trim(),
      kategori: form.kategori,
      harga: rawHarga,
      nominal_komisi: rawKomisi,
      is_active: form.is_active,
    };

    let error;
    try {
      if (editingId) {
        const res = await supabase
          .from("katalog")
          .update(payload)
          .eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("katalog").insert(payload);
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
    await fetchKatalog();
  }

  const totalItem = katalogList.length;
  const totalLayanan = katalogList.filter(
    (item) => item.kategori === "layanan"
  ).length;
  const totalProduk = katalogList.filter(
    (item) => item.kategori === "produk"
  ).length;

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
            Manajemen Katalog
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Kelola daftar layanan, produk, harga, dan komisi barber
          </p>
        </div>
        <Button
          onClick={openTambah}
          className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full px-5 py-2.5 font-bold text-xs transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Item Baru
        </Button>
      </div>

      {/* Grid Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Total Item
            </span>
            <span className="text-2xl font-black text-[#111111]">
              {totalItem}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Jumlah Layanan
            </span>
            <span className="text-2xl font-black text-[#3138E8]">
              {totalLayanan}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3138E8] flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Jumlah Produk
            </span>
            <span className="text-2xl font-black text-[#111111]">
              {totalProduk}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[30px] p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#111111]">
            Daftar Layanan & Produk
          </h2>
          <span className="text-[10px] font-bold bg-[#BEF264] text-black px-3 py-1 rounded-full">
            {katalogList.filter((k) => k.is_active).length} Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-gray-500 rounded-[14px]">
                <th className="py-3 px-4 rounded-l-[14px]">Kode</th>
                <th className="py-3 px-4">Nama Item</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Komisi Barber</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-r-[14px]">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {katalogList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-400 font-medium"
                  >
                    Belum ada item katalog yang terdaftar.
                  </td>
                </tr>
              ) : (
                katalogList.map((katalog) => (
                  <tr
                    key={katalog.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-[#3138E8]">
                      <span className="bg-blue-50 px-2.5 py-1 rounded-md">
                        {katalog.kode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {katalog.nama}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-gray-500">
                      {katalog.kategori}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111111]">
                      Rp {katalog.harga.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      Rp {katalog.nominal_komisi.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-medium px-3 py-1 rounded-full inline-block ${
                          katalog.is_active
                            ? "bg-[#BEF264] text-slate-900"
                            : "bg-slate-100 text-gray-400"
                        }`}
                      >
                        {katalog.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(katalog)}
                        className="rounded-full hover:bg-slate-100 text-gray-600 font-medium h-8 px-3"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
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
              {editingId ? "Edit Item Katalog" : "Tambah Item Baru"}
            </DialogTitle>
            <p className="text-xs text-gray-400 font-medium">
              Isi detail katalog item di bawah ini.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="kode"
                  className="text-xs font-bold text-gray-700"
                >
                  Kode Item
                </Label>
                <Input
                  id="kode"
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  maxLength={2}
                  className="rounded-xl border-slate-200 focus:border-[#3138E8] uppercase text-xs h-10 font-medium text-gray-900"
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
                    setForm({ ...form, kategori: v ?? "layanan" })
                  }
                >
                  <SelectTrigger
                    id="kategori"
                    className="rounded-xl border-slate-200 text-xs h-10 font-medium text-gray-900"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="layanan">Layanan</SelectItem>
                    <SelectItem value="produk">Produk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nama" className="text-xs font-bold text-gray-700">
                Nama Layanan / Produk
              </Label>
              <Input
                id="nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="harga"
                  className="text-xs font-bold text-gray-700"
                >
                  Harga Jual
                </Label>
                <Input
                  id="harga"
                  type="text"
                  value={form.harga}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      harga: formatRupiahInput(e.target.value),
                    })
                  }
                  className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="komisi"
                  className="text-xs font-bold text-gray-700"
                >
                  Komisi Barber
                </Label>
                <Input
                  id="komisi"
                  type="text"
                  value={form.nominal_komisi}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nominal_komisi: formatRupiahInput(e.target.value),
                    })
                  }
                  className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[20px] bg-slate-50 border border-slate-100 p-3.5 mt-1">
              <div>
                <Label
                  htmlFor="is_active"
                  className="text-xs font-bold text-gray-800 block cursor-pointer"
                >
                  Status Item Aktif
                </Label>
                <span className="text-[10px] text-gray-400 font-medium">
                  Tampilkan pada pilihan transaksi kasir
                </span>
              </div>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_active: checked })
                }
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
