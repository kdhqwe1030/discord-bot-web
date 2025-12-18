// src/app/api/matches/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: matchId } = await params;

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
    // 2) 참가자 스냅샷
    const { data: participantRows, error: participantsError } = await supabase
      .from("match_participants")
      .select("*")
      .eq("match_id", matchId)
      .order("participant_id", { ascending: true });

    if (participantsError) {
      console.error("❌ match_participants 조회 에러:", participantsError);
      return NextResponse.json(
        { error: "참가자 정보 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 3) 팀 스냅샷
    const { data: teamRows, error: teamsError } = await supabase
      .from("match_teams")
      .select("*")
      .eq("match_id", matchId);

    if (teamsError) {
      console.error("❌ match_teams 조회 에러:", teamsError);
      return NextResponse.json(
        { error: "팀 정보 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const participants = (participantRows ?? []).map((row: any) => {
      const totalCs = row.total_cs ?? 0;

      return {
        participantId: row.participant_id,
        teamId: row.team_id,
        puuid: row.puuid,
        riotIdGameName: row.riot_game_name,
        riotIdTagline: row.riot_tagline,

        championName: row.champion_name,
        champLevel: row.champ_level,

        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,

        challenges: {
          killParticipation: row.kill_participation,
        },

        totalDamageDealtToChampions: row.total_damage_dealt,
        totalDamageTaken: row.total_damage_taken,

        totalMinionsKilled: totalCs,
        neutralMinionsKilled: 0,

        goldEarned: row.gold_earned,

        visionScore: row.vision_score,
        wardsPlaced: row.wards_placed,
        detectorWardsPlaced: row.detector_wards_placed,

        item0: row.item0,
        item1: row.item1,
        item2: row.item2,
        item3: row.item3,
        item4: row.item4,
        item5: row.item5,
        item6: row.item6,

        summoner1Id: row.summoner1_id,
        summoner2Id: row.summoner2_id,

        perks: {
          styles: [
            {
              style: null,
              selections: [
                {
                  perk: row.primary_perk_id,
                },
              ],
            },
            {
              style: row.sub_style_id,
              selections: [],
            },
          ],
        },
      };
    });

    const teams = (teamRows ?? []).map((row: any) => ({
      teamId: row.team_id,
      win: row.win,
      objectives: row.objectives ?? {},
    }));

    const matchData = {
      info: {
        participants,
        teams,
      },
    };

    // 4) 성장 데이터(match_growth) 조회
    const { data: growthRow, error: growthError } = await supabase
      .from("match_growth")
      .select("graph, laning, max_turnover")
      .eq("match_id", matchId)
      .maybeSingle();

    if (growthError) {
      console.error("❌ match_growth 조회 에러:", growthError);
      // 여기서는 전적 상세는 보여주되 성장 탭만 비워둘 수 있으니, 에러로 끊지는 않음
    }

    const growth = growthRow
      ? {
          graph: growthRow.graph,
          laning: growthRow.laning,
          maxTurnover: growthRow.max_turnover,
        }
      : null;

    // 5) [NEW] 게임 흐름 데이터(match_game_flows) 조회
    const { data: flowRow, error: flowError } = await supabase
      .from("match_game_flows")
      .select("flow_events")
      .eq("match_id", matchId)
      .maybeSingle();

    if (flowError) {
      console.error("❌ match_game_flows 조회 에러:", flowError);
    }

    const gameFlow = flowRow ? flowRow.flow_events : null;
    return NextResponse.json(
      {
        matchData,
        matchId,
        growth,
        gameFlow,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ DB 기반 매치 조회 전체 에러:", error);
    return NextResponse.json(
      { error: "데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
