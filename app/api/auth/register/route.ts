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

  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_URL,
      data: { username }, // metadata에도 저장
    },
  });

  if (signUpError || !signUp.user) {
    console.error("❌ 회원가입 오류 발생", signUpError);
    return NextResponse.json(
      { error: signUpError?.message || "가입 실패" },
      { status: 400 }
    );
  }

  // 2️. user_profiles에 바로 Insert
  const { error: profileError } = await supabase.from("user_profiles").insert({
    user_id: signUp.user.id,
    username,
  });

  if (profileError) {
    console.error("❌ 프로필 생성 오류", profileError);
    return NextResponse.json({ error: "프로필 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({
    message: "회원가입 완료",
    user: signUp.user,
  });
}
