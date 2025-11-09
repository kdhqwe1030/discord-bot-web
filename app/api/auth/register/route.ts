// app/api/auth/register/route.ts
import { createClient } from "@/lib/supabase/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, username } = await req.json();
  const supabase = await createClient();
  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Email, password, and username are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: "http://localhost:3000/",
    },
  });

  if (error) {
    console.error("❌ Supabase signup error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "✅ User registered successfully",
    user: data.user,
  });
}
