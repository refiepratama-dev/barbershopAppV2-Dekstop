"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectGroup,
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
import {
  Plus,
  Trash2,
  Pencil,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChevronRight,
} from "lucide-react";

type Tabungan = {
  id: string;
  nama: string;
  keterangan: string | null;
};

type TabunganTx = {
  id: string;
  tipe: string;
  nominal: number;
  keterangan: string | null;
  created_at: string;
};

// Helper Format Angka Ribuan
const formatRupiah = (val: string) => {
  const numberString = val.replace(/[^0-9]/g, "");
  if (!numberString) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numberString));
};

export default function TabunganPage() {
  const [loading, setLoading] = useState(true);
  const [tabunganList, setTabunganList] = useState<Tabungan[]>([]);
  const [selected, setSelected] = useState<Tabungan | null>(null);
  const [txList, setTxList] = useState<TabunganTx[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Dialog Tambah/Edit Tabungan
  const [showTabunganDialog, setShowTabunganDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  // Dialog Tambah Transaksi
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [txTipe, setTxTipe] = useState<string>("");
  const [txNominal, setTxNominal] = useState("");
  const [txKeterangan, setTxKeterangan] = useState("");

  useEffect(() => {
    fetchTabungan();
  }, []);

  async function fetchTabungan() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tabungan")
        .select("*")
        .order("nama");

      if (error) {
        console.error("Error fetching tabungan:", error.message);
        setTabunganList([]);
      } else {
        setTabunganList(data ?? []);
        if (data && data.length > 0 && !selected) {
          openDetail(data[0]);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(t: Tabungan) {
    setSelected(t);
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from("tabungan_transaksi")
        .select("*")
        .eq("tabungan_id", t.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error.message);
        setTxList([]);
      } else {
        setTxList(data ?? []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setTxLoading(false);
    }
  }

  function openTambahTabungan() {
    setEditingId(null);
    setNama("");
    setKeterangan("");
    setShowTabunganDialog(true);
  }

  function openEditTabungan(t: Tabungan) {
    setEditingId(t.id);
    setNama(t.nama);
    setKeterangan(t.keterangan ?? "");
    setShowTabunganDialog(true);
  }

  async function handleSaveTabungan() {
    if (!nama.trim()) {
      alert("Nama tabungan wajib diisi");
      return;
    }
    setSaving(true);

    const payload = {
      nama: nama.trim(),
      keterangan: keterangan.trim() || null,
    };

    let error;
    if (editingId) {
      const res = await supabase
        .from("tabungan")
        .update(payload)
        .eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("tabungan").insert(payload);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      alert("Gagal menyimpan: " + error.message);
      return;
    }
    setShowTabunganDialog(false);
    await fetchTabungan();
  }

  async function handleDeleteTabungan(t: Tabungan) {
    if (!confirm(`Hapus tabungan "${t.nama}" beserta seluruh riwayatnya?`))
      return;
    const { error } = await supabase.from("tabungan").delete().eq("id", t.id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    if (selected?.id === t.id) setSelected(null);
    await fetchTabungan();
  }

  function openTambahTx() {
    setTxTipe("");
    setTxNominal("");
    setTxKeterangan("");
    setShowTxDialog(true);
  }

  async function handleSaveTx() {
    if (!selected) return;

    if (!txTipe) {
      alert("Silakan pilih jenis transaksi terlebih dahulu");
      return;
    }

    const rawNominal = txNominal.replace(/[^0-9]/g, "");
    const nominalNumber = Number(rawNominal);

    if (!nominalNumber || nominalNumber <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tabungan_transaksi").insert({
      tabungan_id: selected.id,
      tipe: txTipe,
      nominal: nominalNumber,
      keterangan: txKeterangan.trim() || null,
    });
    setSaving(false);
    if (error) {
      alert("Gagal menyimpan: " + error.message);
      return;
    }
    setShowTxDialog(false);
    await openDetail(selected);
  }

  async function handleDeleteTx(tx: TabunganTx) {
    if (!confirm("Hapus catatan ini?")) return;
    const { error } = await supabase
      .from("tabungan_transaksi")
      .delete()
      .eq("id", tx.id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    if (selected) await openDetail(selected);
  }

  const saldo = txList.reduce(
    (sum, tx) => sum + (tx.tipe === "setor" ? tx.nominal : -tx.nominal),
    0
  );

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-[1400px] mx-auto bg-slate-50 min-h-screen">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 h-96 bg-slate-200 rounded-[30px]" />
          <div className="col-span-12 lg:col-span-8 h-96 bg-slate-200 rounded-[30px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-sans bg-slate-50 min-h-screen text-[#111111] max-w-[1400px] mx-auto space-y-6 pb-20">
      {/* Header Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Tabungan Usaha
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Kelola dana tabungan & alokasi kas usaha barbershop
          </p>
        </div>
        <Button
          onClick={openTambahTabungan}
          className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full px-5 py-2.5 font-bold text-xs shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Tabungan
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Sidebar Kiri - Daftar Tabungan */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[30px] p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-[#3138E8]" />
              Daftar Tabungan
            </h2>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {tabunganList.length} Pos
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {tabunganList.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-12 font-medium">
                Belum ada pos tabungan terdaftar.
              </p>
            ) : (
              tabunganList.map((t) => {
                const isSelected = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => openDetail(t)}
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
                        {t.nama}
                      </p>
                      {t.keterangan && (
                        <p
                          className={`text-[11px] font-medium mt-0.5 line-clamp-1 ${
                            isSelected ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {t.keterangan}
                        </p>
                      )}
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

        {/* Panel Kanan - Detail Tabungan */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[30px] p-6 border border-slate-100 shadow-sm space-y-6">
          {!selected ? (
            <div className="py-24 text-center text-xs text-gray-400 font-medium">
              Pilih salah satu pos tabungan di sebelah kiri untuk melihat detail
              transaksi.
            </div>
          ) : (
            <>
              {/* Top Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-[#3138E8] uppercase tracking-wider block">
                    Pos Tabungan
                  </span>
                  <h2 className="text-lg font-black text-[#111111]">
                    {selected.nama}
                  </h2>
                  {selected.keterangan && (
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {selected.keterangan}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openEditTabungan(selected)}
                    className="rounded-full border-slate-200 text-xs font-bold text-gray-700 h-9 px-3"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteTabungan(selected)}
                    className="rounded-full border-red-100 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-600 h-9 px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Hapus
                  </Button>
                </div>
              </div>

              {/* Saldo Hero Banner */}
              <div className="bg-slate-900 rounded-[24px] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#BEF264]" />
                    Total Saldo Terkumpul
                  </span>
                  <p className="text-2xl font-black text-[#BEF264] mt-1">
                    Rp {saldo.toLocaleString("id-ID")}
                  </p>
                </div>
                <Button
                  onClick={openTambahTx}
                  className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full px-5 py-2.5 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Plus className="w-4 h-4" />
                  Setor / Tarik Dana
                </Button>
              </div>

              {/* Riwayat Transaksi */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Riwayat Mutasi Tabungan
                </h3>

                {txLoading ? (
                  <p className="text-center text-xs text-gray-400 font-medium py-10 animate-pulse">
                    Memuat riwayat transaksi...
                  </p>
                ) : txList.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 font-medium py-10 bg-slate-50/50 rounded-[20px] border border-slate-100">
                    Belum ada riwayat setor atau tarik untuk pos tabungan ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {txList.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center bg-slate-50/80 p-3.5 rounded-[20px] border border-slate-100 text-xs hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              tx.tipe === "setor"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {tx.tipe === "setor" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block capitalize">
                              {tx.tipe}{" "}
                              {tx.keterangan ? `— ${tx.keterangan}` : ""}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">
                              {new Date(tx.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-black text-sm ${
                              tx.tipe === "setor"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {tx.tipe === "setor" ? "+" : "-"}Rp{" "}
                            {tx.nominal.toLocaleString("id-ID")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTx(tx)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Dialog Tambah/Edit Tabungan */}
      <Dialog open={showTabunganDialog} onOpenChange={setShowTabunganDialog}>
        <DialogContent className="rounded-[28px] border-none sm:max-w-[425px] p-6 shadow-2xl bg-white">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-black text-[#111111]">
              {editingId ? "Edit Pos Tabungan" : "Tambah Pos Tabungan"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nama" className="text-xs font-bold text-gray-700">
                Nama Tabungan
              </Label>
              <Input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="keterangan"
                className="text-xs font-bold text-gray-700"
              >
                Keterangan (opsional)
              </Label>
              <Input
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowTabunganDialog(false)}
              className="rounded-full text-xs font-bold hover:bg-slate-100 h-10"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveTabungan}
              disabled={saving}
              className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full text-xs font-bold h-10 px-6"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Tambah Transaksi */}
      <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
        <DialogContent className="rounded-[28px] border-none sm:max-w-[425px] p-6 shadow-2xl bg-white">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-black text-[#111111]">
              Catat Mutasi Dana
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5 w-full">
              {/* 1. Label Teks di Bagian Atas */}
              <Label htmlFor="tipe" className="text-xs font-bold text-gray-700">
                Jenis Transaksi
              </Label>

              <Select value={txTipe} onValueChange={(v) => setTxTipe(v ?? "")}>
                {/* 2. Warna Placeholder dibuat Muted (data-[placeholder]:text-gray-400) */}
                <SelectTrigger
                  id="tipe"
                  className="w-full rounded-xl border-slate-200 text-xs h-10 font-medium text-gray-900 capitalize data-[placeholder]:text-gray-400 data-[placeholder]:normal-case"
                >
                  <SelectValue placeholder="Pilih Transaksi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectGroup>
                    {/* 3. Teks di dalam SelectItem diawali Huruf Kapital */}
                    <SelectItem value="setor">Setor</SelectItem>
                    <SelectItem value="tarik">Tarik</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="nominal"
                className="text-xs font-bold text-gray-700"
              >
                Nominal
              </Label>
              <div className="relative flex items-center">
                {/* Ubah className pada span di bawah ini */}
                <span
                  className={`absolute left-3 text-xs font-medium z-10 transition-colors ${
                    txNominal ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  Rp.
                </span>
                <Input
                  id="nominal"
                  type="text"
                  inputMode="numeric"
                  value={txNominal}
                  onChange={(e) => setTxNominal(formatRupiah(e.target.value))}
                  placeholder="0"
                  className="pl-9 rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="txketerangan"
                className="text-xs font-bold text-gray-700"
              >
                Keterangan (opsional)
              </Label>
              <Input
                id="txketerangan"
                value={txKeterangan}
                onChange={(e) => setTxKeterangan(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowTxDialog(false)}
              className="rounded-full text-xs font-bold hover:bg-slate-100 h-10"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveTx}
              disabled={saving}
              className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full text-xs font-bold h-10 px-6"
            >
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
