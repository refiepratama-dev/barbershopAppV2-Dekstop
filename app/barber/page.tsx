"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Users, UserCheck, UserX, Edit3 } from "lucide-react";

type Barber = {
  id: string;
  nama: string;
  status_aktif: boolean;
};

const emptyForm = {
  nama: "",
  status_aktif: true,
};

export default function BarberPage() {
  const [loading, setLoading] = useState(true);
  const [barberList, setBarberList] = useState<Barber[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBarber();
  }, []);

  async function fetchBarber() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .order("nama");

      if (error) {
        console.error("Error fetching barbers:", error.message);
        setBarberList([]);
      } else {
        setBarberList(data ?? []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setBarberList([]);
    } finally {
      setLoading(false);
    }
  }

  function openTambah() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(barber: Barber) {
    setEditingId(barber.id);
    setForm({ nama: barber.nama, status_aktif: barber.status_aktif });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.nama.trim()) {
      alert("Nama wajib diisi");
      return;
    }

    setSaving(true);

    const payload = {
      nama: form.nama.trim(),
      status_aktif: form.status_aktif,
    };

    let error;
    try {
      if (editingId) {
        const res = await supabase
          .from("barbers")
          .update(payload)
          .eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("barbers").insert(payload);
        error = res.error;
      }
    } catch (err: any) {
      error = err;
    }

    setSaving(false);

    if (error) {
      alert("Gagal menyimpan: " + (error?.message || "Terjadi kesalahan"));
      return;
    }

    setShowDialog(false);
    await fetchBarber();
  }

  const totalBarber = barberList.length;
  const barberAktif = barberList.filter((b) => b.status_aktif).length;
  const barberNonaktif = barberList.filter((b) => !b.status_aktif).length;

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
            Manajemen Barber
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Kelola daftar akun dan status barber
          </p>
        </div>
        <Button
          onClick={openTambah}
          className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full px-5 py-2.5 font-bold text-xs transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Barber
        </Button>
      </div>

      {/* Grid Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Total Barber
            </span>
            <span className="text-2xl font-black text-[#111111]">
              {totalBarber}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Barber Aktif
            </span>
            <span className="text-2xl font-black text-[#3138E8]">
              {barberAktif}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3138E8] flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Barber Nonaktif
            </span>
            <span className="text-2xl font-black text-gray-400">
              {barberNonaktif}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-gray-400 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[30px] p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#111111]">Daftar Akun Barber</h2>
          <span className="text-[10px] font-bold bg-[#BEF264] text-black px-3 py-1 rounded-full">
            {barberAktif} Siap Bertugas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-gray-500 rounded-[14px]">
                <th className="py-3 px-4 rounded-l-[14px]">Nama Barber</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-r-[14px]">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {barberList.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-10 text-gray-400 font-medium"
                  >
                    Belum ada data barber yang terdaftar.
                  </td>
                </tr>
              ) : (
                barberList.map((barber) => (
                  <tr
                    key={barber.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {barber.nama}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-medium px-3 py-1 rounded-full inline-block ${
                          barber.status_aktif
                            ? "bg-[#BEF264] text-slate-900"
                            : "bg-slate-100 text-gray-400"
                        }`}
                      >
                        {barber.status_aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(barber)}
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
        <DialogContent className="rounded-[28px] border-none sm:max-w-[400px] p-6 bg-white">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-black text-[#111111]">
              {editingId ? "Edit Data Barber" : "Tambah Barber Baru"}
            </DialogTitle>
            <p className="text-xs text-gray-400 font-medium">
              Isi informasi nama barber di bawah ini.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nama" className="text-xs font-bold text-gray-700">
                Nama Barber
              </Label>
              <Input
                id="nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>

            <div className="flex items-center justify-between rounded-[20px] bg-slate-50 border border-slate-100 p-3.5 mt-1">
              <div>
                <Label
                  htmlFor="status_aktif"
                  className="text-xs font-bold text-gray-800 block cursor-pointer"
                >
                  Status Barber Aktif
                </Label>
                <span className="text-[10px] text-gray-400 font-medium">
                  Barber aktif akan muncul di opsi transaksi
                </span>
              </div>
              <Switch
                id="status_aktif"
                checked={form.status_aktif}
                onCheckedChange={(checked) =>
                  setForm({ ...form, status_aktif: checked })
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
