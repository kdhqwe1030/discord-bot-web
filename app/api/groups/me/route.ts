import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // 1) 현재 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 2) 내가 멤버로 속한 그룹들 + 역할까지 조회
  const { data, error } = await supabase
    .from("group_members")
    .select(
      `
      id,
      role,
      joined_at,
      group:groups (
        id,
        name,
        owner_id,
        linked_guild_id,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("fetch my groups error:", error);
    return NextResponse.json(
      { error: "그룹 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 3) 편하게 쓰라고 owned / member 나눠서 리턴해도 됨
  const groups = (data ?? []).map((row) => ({
    membershipId: row.id,
    role: row.role,
    joinedAt: row.joined_at,
    group: row.group,
  }));

  return NextResponse.json({ groups });
}
