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

    // 1. 이 그룹의 모든 플레이 데이터 조회
    const { data: playerRows, error: playerError } = await supabase
      .from("group_match_players")
      .select("match_id, user_id, is_win")
      .eq("group_id", groupId);

    if (playerError) {
      console.error("❌ group_match_players 조회 에러:", playerError);
      return NextResponse.json(
        { error: "그룹 매치 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    type MatchAgg = {
      userIds: Set<string>;
      hasWin: boolean; // 그룹원 중 한 명이라도 is_win=true ?
    };

    const matchMap = new Map<string, MatchAgg>();

    for (const row of playerRows ?? []) {
      const matchId = row.match_id as string;
      const userId = row.user_id as string;
      const isWin = row.is_win as boolean | null;

      if (!matchMap.has(matchId)) {
        matchMap.set(matchId, {
          userIds: new Set<string>(),
          hasWin: false,
        });
      }

      const agg = matchMap.get(matchId)!;
      agg.userIds.add(userId);
      if (isWin) agg.hasWin = true;
    }

    // 2. "그룹원 2명 이상 참여한 매치"만 집계
    let totalMatches = 0;
    let winCount = 0;

    for (const [_matchId, agg] of matchMap) {
      if (agg.userIds.size >= 2) {
        totalMatches++;
        if (agg.hasWin) {
          winCount++;
        }
      }
    }

    const winRate = totalMatches > 0 ? winCount / totalMatches : 0;
    const winRatePercent =
      totalMatches > 0 ? Math.round((winCount / totalMatches) * 1000) / 10 : 0;

    return NextResponse.json(
      {
        totalMatches,
        winCount,
        winRatePercent,
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
