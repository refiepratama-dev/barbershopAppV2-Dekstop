"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, UserCheck, ShieldCheck, KeyRound } from "lucide-react";

type Kasir = {
  id: string;
  nama: string;
  email: string;
  role: string;
};

export default function KasirPage() {
  const [loading, setLoading] = useState(true);
  const [kasirList, setKasirList] = useState<Kasir[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchKasir();
  }, []);

  async function fetchKasir() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kasir")
        .select("id, nama, email, role")
        .order("nama");

      if (error) {
        console.error("Error fetching kasir:", error.message);
        setKasirList([]);
      } else {
        setKasirList(data ?? []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setKasirList([]);
    } finally {
      setLoading(false);
    }
  }

  function openTambah() {
    setNama("");
    setEmail("");
    setPassword("");
    setErrorMsg("");
    setShowDialog(true);
  }

  async function handleSave() {
    if (!nama.trim() || !email.trim() || !password) {
      setErrorMsg("Semua field wajib diisi");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-kasir`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ nama, email, password }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error ?? "Gagal membuat kasir");
        setSaving(false);
        return;
      }

      setShowDialog(false);
      await fetchKasir();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setSaving(false);
    }
  }

  const totalPengguna = kasirList.length;
  const totalOwner = kasirList.filter((k) => k.role === "owner").length;
  const totalKasir = kasirList.filter((k) => k.role !== "owner").length;

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
            Manajemen Kasir
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Kelola daftar akun barber
          </p>
        </div>
        <Button
          onClick={openTambah}
          className="bg-[#3138E8] hover:bg-[#252bc0] text-white rounded-full px-5 py-2.5 font-bold text-xs transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Kasir
        </Button>
      </div>

      {/* Grid Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Total Pengguna
            </span>
            <span className="text-2xl font-black text-[#111111]">
              {totalPengguna}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Akun Owner
            </span>
            <span className="text-2xl font-black text-[#3138E8]">
              {totalOwner}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3138E8] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Akun Kasir
            </span>
            <span className="text-2xl font-black text-[#111111]">
              {totalKasir}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[30px] p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#111111]">
            Daftar Akun Kasir
          </h2>
          <span className="text-[10px] font-bold bg-[#BEF264] text-black px-3 py-1 rounded-full">
            {kasirList.length} Akun Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-gray-500 rounded-[14px]">
                <th className="py-3 px-4 rounded-l-[14px]">Nama Kasir</th>
                <th className="py-3 px-4">Email Hak Akses</th>
                <th className="py-3 px-4 text-right rounded-r-[14px]">
                  Role Akses
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {kasirList.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-10 text-gray-400 font-medium"
                  >
                    Belum ada akun kasir yang terdaftar.
                  </td>
                </tr>
              ) : (
                kasirList.map((k) => (
                  <tr
                    key={k.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {k.nama}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-600">
                      {k.email}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-medium px-3 py-1 rounded-full uppercase inline-block ${
                          k.role === "owner"
                            ? "bg-[#3138E8] text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {k.role}
                      </span>
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
              Tambah Kasir Baru
            </DialogTitle>
            <p className="text-xs text-gray-400 font-medium">
              Buat kredensial akun baru untuk kasir barbershop.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nama" className="text-xs font-bold text-gray-700">
                Nama
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
                htmlFor="email"
                className="text-xs font-bold text-gray-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-bold text-gray-700"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-[#3138E8] text-xs h-10 font-medium text-gray-900"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs font-medium text-red-600">{errorMsg}</p>
              </div>
            )}
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
