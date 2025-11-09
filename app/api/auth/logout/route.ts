// app/api/auth/logout/route.ts
import { createClient } from "@/lib/supabase/supabaseServer";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  // Supabase 세션 제거
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log("✅ User logged out successfully");

  // ✅ 브라우저 세션이 middleware에서 자동 정리되므로 쿠키 직접 조작 불필요
  return NextResponse.json({ message: "✅ Logged out successfully" });
}
