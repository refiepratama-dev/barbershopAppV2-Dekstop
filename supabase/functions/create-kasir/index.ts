import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // 1. Ambil token dari header Authorization (dikirim dari desktop app)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Tidak ada token" }), {
        status: 401,
      });
    }

    // 2. Client biasa (pakai anon key) buat verifikasi siapa yang manggil
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Token tidak valid" }), {
        status: 401,
      });
    }

    // 3. Cek role pemanggil — WAJIB owner
    const { data: pemanggil } = await supabaseClient
      .from("kasir")
      .select("role")
      .eq("id", user.id)
      .single();

    if (pemanggil?.role !== "owner") {
      return new Response(
        JSON.stringify({ error: "Hanya Owner yang boleh menambah kasir" }),
        { status: 403 }
      );
    }

    // 4. Ambil data kasir baru dari body request
    const { email, password, nama } = await req.json();
    if (!email || !password || !nama) {
      return new Response(
        JSON.stringify({ error: "Email, password, dan nama wajib diisi" }),
        { status: 400 }
      );
    }

    // 5. Client ADMIN (pakai service role key) — hanya jalan di server, aman
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 6. Bikin user Auth baru
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError || !newUser.user) {
      return new Response(
        JSON.stringify({ error: createError?.message ?? "Gagal membuat user" }),
        { status: 400 }
      );
    }

    // 7. Insert row ke tabel kasir
    const { error: insertError } = await supabaseAdmin.from("kasir").insert({
      id: newUser.user.id,
      nama,
      email,
      role: "kasir",
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, id: newUser.user.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});