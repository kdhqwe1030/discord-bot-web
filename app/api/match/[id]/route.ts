// src/app/api/matches/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";
import { analyzeGrowth } from "@/service/analysis/growthService";

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params; // matchId (ex: KR_12345)

  // 1) 로그인 확인
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

  try {
    // 2) 라이엇 API 호출 (병렬 처리로 속도 최적화)
    const matchUrl = `https://asia.api.riotgames.com/lol/match/v5/matches/${id}`;
    const timelineUrl = `https://asia.api.riotgames.com/lol/match/v5/matches/${id}/timeline`;

    const [matchRes, timelineRes] = await Promise.all([
      fetch(matchUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } }),
      fetch(timelineUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } }),
    ]);

    if (!matchRes.ok || !timelineRes.ok) {
      throw new Error(
        `Riot API Error: ${matchRes.status} / ${timelineRes.status}`
      );
    }

    const matchData = await matchRes.json();
    const timelineData = await timelineRes.json();
    const info = matchData.info;
    const participants = (info?.participants ?? []) as any[];

    const groupId = "c9d27b57-0810-430f-a8bb-0b9c7c2d4816";
    let groupTeamId: number = 100;

    if (groupId) {
      // 1) 그룹 멤버 user_id 목록
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (memberRows && memberRows.length > 0) {
        const userIds = memberRows.map((m) => m.user_id);

        // 2) 멤버들의 puuid 목록
        const { data: lolRows } = await supabase
          .from("lol_accounts")
          .select("user_id, puuid")
          .in("user_id", userIds);

        if (lolRows && lolRows.length > 0) {
          const groupPuuids = new Set(lolRows.map((l) => l.puuid));

          // 3) 이 매치에서 그룹 puuid를 가진 참가자 한 명 찾기
          const anyGroupParticipant = participants.find((p) =>
            groupPuuids.has(p.puuid)
          );

          if (anyGroupParticipant) {
            groupTeamId = anyGroupParticipant.teamId as number; // 100 or 200
          }
        }
      }
    }
    // 4) 성장 데이터 분석 (Growth Service)
    const growthData = analyzeGrowth(matchData, timelineData, groupTeamId);

    // 5) 응답
    return NextResponse.json(
      {
        matchData: matchData,
        matchId: id,
        growth: growthData,
        // 필요하다면 원본 데이터도 함께 줄 수 있음 (디버깅용)
        // raw: { matchData, timelineData }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching match data:", error);
    return NextResponse.json(
      { error: "데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
