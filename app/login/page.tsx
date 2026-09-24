"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Login gagal: email atau password salah");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans text-[#111111]">
      <div className="w-full max-w-md bg-white rounded-[30px] border border-slate-200 p-8 space-y-8">
        {/* Header / Brand Identity */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#3138E8] flex items-center justify-center text-white">
            <Scissors className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Rafel Pangkas Rambut
            </h1>
            <span className="inline-block px-3 py-1 rounded-full bg-[#BEF264]/40 text-[#111111] text-[10px] font-black tracking-widest uppercase">
              POS SYSTEM
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Masukkan kredensial akun untuk mengakses sistem
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-bold text-slate-700 ml-1"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-slate-200 bg-slate-50/50 text-xs font-medium focus-visible:ring-[#3138E8] focus-visible:bg-white transition-all shadow-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-bold text-slate-700 ml-1"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-slate-200 bg-slate-50/50 text-xs font-medium focus-visible:ring-[#3138E8] focus-visible:bg-white transition-all shadow-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#3138E8] hover:bg-[#252ab8] text-white font-bold text-xs transition-all duration-200 mt-2 shadow-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : (
              "Masuk ke Dashboard"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400">
            © {new Date().getFullYear()} Rafel Pangkas Rambut POS. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
