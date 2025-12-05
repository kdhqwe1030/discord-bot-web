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

    // 2. 이 그룹 멤버인지 확인
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
        { error: "그룹 멤버만 전적을 조회할 수 있습니다." },
        { status: 403 }
      );
    }

    // 3. 그룹의 전체 멤버 목록
    const { data: groupMembers, error: groupMembersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (groupMembersError) {
      console.error("❌ group_members 목록 조회 에러:", groupMembersError);
      return NextResponse.json(
        { error: "그룹 멤버 목록 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 4. 이 그룹에서 기록된 모든 플레이 데이터
    const { data: playerRows, error: playerError } = await supabase
      .from("group_match_players")
      .select("user_id, match_id, is_win")
      .eq("group_id", groupId);

    if (playerError) {
      console.error("❌ group_match_players 조회 에러:", playerError);
      return NextResponse.json(
        { error: "그룹 매치 데이터 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 5. match_id 기준으로 먼저 그룹핑 (누가 몇 명 들어왔는지 보기 위해)
    type MatchPlayer = { userId: string; isWin: boolean | null };
    type MatchAgg = {
      userIds: Set<string>;
      players: MatchPlayer[];
    };

    const matchMap = new Map<string, MatchAgg>();

    for (const row of playerRows ?? []) {
      const matchId = row.match_id as string;
      const userId = row.user_id as string;
      const isWin = row.is_win as boolean | null;

      if (!matchMap.has(matchId)) {
        matchMap.set(matchId, {
          userIds: new Set<string>(),
          players: [],
        });
      }

      const agg = matchMap.get(matchId)!;
      agg.userIds.add(userId);
      agg.players.push({ userId, isWin });
    }

    // 6. user_id 기준으로 (2인 이상 매치만) 집계
    type StatAgg = {
      matchIds: Set<string>;
      winMatchIds: Set<string>;
    };

    const statsMap = new Map<string, StatAgg>();

    // 2인 이상 참여한 match에 대해서만 사용자별 카운트
    for (const [matchId, agg] of matchMap) {
      if (agg.userIds.size < 2) continue; // 2인 미만이면 스킵

      for (const p of agg.players) {
        const userId = p.userId;
        const isWin = p.isWin;

        if (!statsMap.has(userId)) {
          statsMap.set(userId, {
            matchIds: new Set<string>(),
            winMatchIds: new Set<string>(),
          });
        }

        const stat = statsMap.get(userId)!;
        stat.matchIds.add(matchId);
        if (isWin) {
          stat.winMatchIds.add(matchId);
        }
      }
    }

    // 7. 모든 그룹 멤버에 대해 결과 생성
    const membersStats = (groupMembers ?? []).map((m) => {
      const userId = m.user_id as string;
      const agg = statsMap.get(userId);

      const matchCount = agg ? agg.matchIds.size : 0;
      const winCount = agg ? agg.winMatchIds.size : 0;
      const winRate = matchCount > 0 ? winCount / matchCount : 0;
      const winRatePercent =
        matchCount > 0 ? Math.round((winCount / matchCount) * 1000) / 10 : 0;

      return {
        userId,
        matchCount,
        winCount,
        winRate,
        winRatePercent,
      };
    });

    return NextResponse.json(
      {
        members: membersStats,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ 그룹 멤버별 매치/승률 조회 오류:", err);
    return NextResponse.json(
      { error: "그룹 멤버별 매치/승률 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
