import { createClient } from "@/lib/supabase/supabaseServer";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  // Supabase 세션 제거
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("❌ 로그아웃 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      message: "로그아웃 성공",
    },
  });
}
