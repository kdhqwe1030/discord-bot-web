// app/api/groups/[id]/matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";
import { syncGroupMatches } from "@/lib/lol/syncGroupMatches";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

// 최근 매치 조회
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

    // 2. 그룹 멤버인지 확인
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
        { error: "이 그룹의 멤버만 전적을 조회할 수 있습니다." },
        { status: 403 }
      );
    }

    // 3. 쿼리 파라미터로 페이지네이션 (기본: 최근 20개)
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");

    // 4. group_matches에서 이 그룹의 매치들 조회
    const { data: matchRows, error: matchesError } = await supabase
      .from("group_matches")
      .select(
        "id, match_id, queue_id, duration_seconds, started_at, winner_team_id"
      )
      .eq("group_id", groupId)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchesError) {
      console.error("❌ group_matches 조회 에러:", matchesError);
      return NextResponse.json(
        { error: "매치 목록 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const matches = matchRows ?? [];
    if (matches.length === 0) {
      return NextResponse.json({ matches: [] }, { status: 200 });
    }

    const matchIds = matches.map((m) => m.match_id);

    // 5. 각 매치의 그룹 멤버 전적(group_match_players) 조회
    const { data: playerRows, error: playersError } = await supabase
      .from("group_match_players")
      .select(
        `
        id,
        group_id,
        match_id,
        user_id,
        puuid,
        is_win,
        champion_name,
        position,
        kills,
        deaths,
        assists,
        total_cs,
        damage_to_champ,
        vision_score,
        item0,
        item1,
        item2,
        item3,
        item4,
        item5,
        item6
      `
      )
      .eq("group_id", groupId)
      .in("match_id", matchIds);

    if (playersError) {
      console.error("❌ group_match_players 조회 에러:", playersError);
      return NextResponse.json(
        { error: "매치 플레이어 정보 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const players = playerRows ?? [];

    // 6. 소환사 이름 붙이기 위해 lol_accounts 조회 (선택)
    const userIds = Array.from(new Set(players.map((p) => p.user_id)));
    let accountMap = new Map<
      string,
      { game_name: string; tag_line: string | null }
    >();

    if (userIds.length > 0) {
      const { data: accounts, error: accountsError } = await supabase
        .from("lol_accounts")
        .select("user_id, game_name, tag_line")
        .in("user_id", userIds);

      if (accountsError) {
        console.error("❌ lol_accounts 조회 에러:", accountsError);
        // 이름이 없어도 전적은 보여줄 수 있으니, 여기서는 에러로 끊지는 않음
      } else if (accounts) {
        accountMap = new Map(
          accounts.map((a) => [
            a.user_id,
            { game_name: a.game_name, tag_line: a.tag_line },
          ])
        );
      }
    }

    // 7. 매치별로 플레이어 묶어서 프론트 친화적 형태로 가공
    const matchList = matches.map((m) => {
      const matchPlayers = players
        .filter((p) => p.match_id === m.match_id)
        .map((p) => {
          const account = accountMap.get(p.user_id) || null;

          return {
            id: p.id,
            userId: p.user_id,
            puuid: p.puuid,
            isWin: p.is_win,
            championName: p.champion_name,
            position: p.position,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            totalCs: p.total_cs,
            damageToChamp: p.damage_to_champ,
            visionScore: p.vision_score,
            items: [
              p.item0,
              p.item1,
              p.item2,
              p.item3,
              p.item4,
              p.item5,
              p.item6,
            ],
            summonerName: account?.game_name ?? null,
            tagLine: account?.tag_line ?? null,
          };
        });

      // 이 매치에서 "그룹이 이겼는지" 간단 정의: 그룹 멤버 중 승리한 사람 있으면 true
      const groupWin = matchPlayers.some((p) => p.isWin === true);

      return {
        id: m.id,
        matchId: m.match_id,
        queueId: m.queue_id,
        durationSeconds: m.duration_seconds,
        startedAt: m.started_at,
        winnerTeamId: m.winner_team_id,
        groupWin,
        players: matchPlayers,
      };
    });
    const filteredMatchList = matchList.filter(
      (match) => match.players.length >= 2
    );
    return NextResponse.json(
      {
        matches: filteredMatchList,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("❌ 그룹 매치 조회 전체 에러:", e);
    return NextResponse.json(
      { error: "매치 조회 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
