import { createClient } from "@/lib/supabase/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = id;

    const supabase = await createClient();
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

    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id")
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
        { error: "그룹 멤버만 조회할 수 있습니다." },
        { status: 403 }
      );
    }

    // 1. 전체 매치 수 (match_id 기준 중복 제거)
    const { data: groupMatches, error: groupMatchesError } = await supabase
      .from("group_matches")
      .select("match_id")
      .eq("group_id", groupId);

    if (groupMatchesError) {
      console.error("❌ group_matches 조회 에러:", groupMatchesError);
      return NextResponse.json(
        { error: "그룹 매치 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const totalMatchSet = new Set(groupMatches?.map((m) => m.match_id));
    const totalMatches = totalMatchSet.size;

    // 2. 승리한 매치 수 (group_match_players에서 is_win = true, match_id 중복 제거)
    const { data: winRows, error: winError } = await supabase
      .from("group_match_players")
      .select("match_id")
      .eq("group_id", groupId)
      .eq("is_win", true);

    if (winError) {
      console.error("❌ group_match_players 조회 에러:", winError);
      return NextResponse.json(
        { error: "그룹 승리 매치 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const winMatchSet = new Set(winRows?.map((r) => r.match_id));
    const winCount = winMatchSet.size;

    // 3. 승률 계산 (소수 첫째 자리까지)
    const winRate = totalMatches > 0 ? winCount / totalMatches : 0;
    const winRatePercent =
      totalMatches > 0
        ? Math.round((winCount / totalMatches) * 1000) / 10 // ex) 54.3
        : 0;

    return NextResponse.json(
      {
        totalMatches,
        winCount,
        winRatePercent, // 54.3
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ 그룹 매치 수, 승률 조회 오류:", err);
    return NextResponse.json(
      { error: "그룹 매치 수, 승률 조회 오류" },
      { status: 500 }
    );
  }
}
