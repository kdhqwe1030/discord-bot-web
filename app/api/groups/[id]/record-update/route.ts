import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";
import { syncGroupMatches } from "@/service/syncGroupMatches";
interface RouteParams {
  params: Promise<{ id: string }>;
}

//전적 갱신
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = id;

    const supabase = await createClient();

    // 1. 인증
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 이 유저가 이 그룹의 멤버인지 체크
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("❌ group_members 조회 에러:", memberError);
      return NextResponse.json(
        { error: "그룹 멤버십 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "이 그룹의 멤버만 전적 갱신이 가능합니다." },
        { status: 403 }
      );
    }

    // 3. 동기화 실행
    const result = await syncGroupMatches(supabase, groupId);

    return NextResponse.json(
      {
        message: "전적 갱신이 완료되었습니다.",
        syncedMatches: result.syncedMatches,
        syncedPlayers: result.syncedPlayers,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("❌ 그룹 매치 동기화 전체 에러:", e);
    return NextResponse.json(
      { error: "전적 갱신 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
