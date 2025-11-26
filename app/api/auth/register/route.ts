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
    console.error("❌ 회원가입 오류 발생", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      message: "회원가입 성공",
      user: data.user,
    },
  });
}
