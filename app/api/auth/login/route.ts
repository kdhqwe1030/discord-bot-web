import { createClient } from "@/lib/supabase/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "supabase에서 온 이메일을 인증 후 로그인이 가능합니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      message: "로그인 성공",
      user: data.user,
    },
  });
}
