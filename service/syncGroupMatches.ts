// lib/lol/syncGroupMatches.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithRetry } from "@/service/fetchWithRetry";
import { analyzeGrowth } from "@/service/analysis/growthService";
import { analyzeGameFlow } from "./analysis/gameFlowService";

const RIOT_REGION = "asia";

type RiotMatchId = string;

export interface SyncResult {
  syncedMatches: number;
  syncedPlayers: number;
}

type GroupMemberRow = {
  user_id: string;
};

type LolAccountRow = {
  user_id: string;
  puuid: string;
  game_name: string;
  tag_line: string;
};

export async function syncGroupMatches(
  supabase: SupabaseClient,
  groupId: string
): Promise<SyncResult> {
  // 1. 이 그룹의 멤버 user_id 목록
  const { data: memberRows, error: membersError } = await supabase
    .from("group_members")
    .select<"user_id", GroupMemberRow>("user_id")
    .eq("group_id", groupId);

  if (membersError) {
    console.error("❌ group_members 조회 에러:", membersError);
    throw new Error("그룹 멤버 조회에 실패했습니다.");
  }

  const members = memberRows ?? [];
  if (members.length === 0) {
    return { syncedMatches: 0, syncedPlayers: 0 };
  }

  const userIds = members.map((m) => m.user_id);

  // 2. 멤버들의 롤 계정(lol_accounts) 조회
  const { data: lolRows, error: lolError } = await supabase
    .from("lol_accounts")
    .select<"user_id, puuid, game_name, tag_line", LolAccountRow>(
      "user_id, puuid, game_name, tag_line"
    )
    .in("user_id", userIds);

  if (lolError) {
    console.error("❌ lol_accounts 조회 에러:", lolError);
    throw new Error("롤 계정 조회에 실패했습니다.");
  }

  const lolAccounts = lolRows ?? [];
  if (lolAccounts.length === 0) {
    return { syncedMatches: 0, syncedPlayers: 0 };
  }

  // user_id → lol_account 매핑
  const userIdToLol = new Map<string, LolAccountRow>();
  for (const acc of lolAccounts) {
    userIdToLol.set(acc.user_id, acc);
  }

  // 롤 계정이 실제로 연결된 멤버만
  const membersWithLol: { userId: string; puuid: string }[] = members
    .map((m) => {
      const acc = userIdToLol.get(m.user_id);
      if (!acc) return null;
      return { userId: m.user_id, puuid: acc.puuid };
    })
    .filter((x): x is { userId: string; puuid: string } => x !== null);

  if (membersWithLol.length === 0) {
    return { syncedMatches: 0, syncedPlayers: 0 };
  }

  // puuid → user_id, groupPuuids 세트
  const puuidToUserId = new Map<string, string>();
  const groupPuuids: string[] = [];
  for (const m of membersWithLol) {
    puuidToUserId.set(m.puuid, m.userId);
    groupPuuids.push(m.puuid);
  }
  const groupPuuidSet = new Set(groupPuuids);

  // 3. sync_state 불러오기
  const { data: syncStates, error: syncStateError } = await supabase
    .from("group_match_sync_state")
    .select("user_id, last_synced_match_time")
    .eq("group_id", groupId)
    .in(
      "user_id",
      membersWithLol.map((m) => m.userId)
    );

  if (syncStateError) {
    console.error("❌ sync_state 조회 에러:", syncStateError);
    throw new Error("동기화 상태 조회 실패");
  }

  const userIdToLastSynced = new Map<string, number | null>();
  const userIdToLatestMatchStart = new Map<string, number>();

  for (const m of membersWithLol) {
    const state = syncStates?.find((s) => s.user_id === m.userId);
    const last = (state?.last_synced_match_time as number | null) ?? null;
    userIdToLastSynced.set(m.userId, last);
    if (last !== null) {
      userIdToLatestMatchStart.set(m.userId, last);
    }
  }

  // 4. 멤버별 새 matchId 수집
  const uniqueMatchIds = new Set<RiotMatchId>();

  for (const m of membersWithLol) {
    const lastSyncedTime = userIdToLastSynced.get(m.userId);
    const ids = await fetchRecentMatchIds(m.puuid, lastSyncedTime);

    for (const id of ids) {
      uniqueMatchIds.add(id);
    }
  }

  if (uniqueMatchIds.size === 0) {
    for (const m of membersWithLol) {
      const last = userIdToLastSynced.get(m.userId) ?? 0;
      await upsertSyncState(supabase, groupId, m.userId, m.puuid, last);
    }
    return { syncedMatches: 0, syncedPlayers: 0 };
  }

  // 5. 각 matchId에 대해 상세 조회 + 스냅샷 + growth 저장
  let totalSyncedMatches = 0;
  let totalSyncedPlayers = 0;

  for (const matchId of uniqueMatchIds) {
    let match: any;
    let timeline: any;

    try {
      // (1) match / timeline 동시에 가져오기
      [match, timeline] = await Promise.all([
        fetchMatchDetail(matchId),
        fetchMatchTimeline(matchId),
      ]);
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.includes("Max retries exceeded")
      ) {
        console.warn(
          "⚠️ Riot 레이트 리밋(또는 반복 실패)에 도달했습니다. 남은 매치는 스킵합니다."
        );
        break;
      }

      console.error("❌ 개별 매치 상세/타임라인 조회 에러, 이 매치만 스킵:", e);
      continue;
    }

    const info = match.info;
    const metadata = match.metadata;

    const startedAtMs = info.gameStartTimestamp as number;
    const queueId = info.queueId as number;
    const durationSeconds = info.gameDuration as number;

    const startedAtIso = new Date(startedAtMs).toISOString();
    const winnerTeamId = getWinnerTeamId(info);
    const matchIdStr = metadata.matchId as string;

    // 5-1. group_matches upsert
    const { error: upsertMatchError } = await supabase
      .from("group_matches")
      .upsert(
        {
          group_id: groupId,
          match_id: matchIdStr,
          queue_id: queueId,
          duration_seconds: durationSeconds,
          started_at: startedAtIso,
          winner_team_id: winnerTeamId,
        },
        {
          onConflict: "group_id, match_id",
        }
      );

    if (upsertMatchError) {
      console.error("❌ group_matches upsert 에러:", upsertMatchError);
      continue;
    }

    totalSyncedMatches += 1;

    const participants = info.participants as any[];
    const teams = info.teams as any[];

    // 5-2. match_teams 스냅샷
    if (Array.isArray(teams) && teams.length > 0) {
      const teamRows = teams.map((t) => ({
        match_id: matchIdStr,
        team_id: t.teamId as number,
        win: !!t.win,
        objectives: t.objectives ?? null,
      }));

      const { error: teamError } = await supabase
        .from("match_teams")
        .upsert(teamRows, { onConflict: "match_id, team_id" });

      if (teamError) {
        console.error("❌ match_teams upsert 에러:", teamError);
      }
    }

    // 5-3. match_participants 스냅샷
    if (Array.isArray(participants) && participants.length > 0) {
      const participantRows = participants.map((p: any) => {
        const totalCs =
          (p.totalMinionsKilled as number) + (p.neutralMinionsKilled as number);

        const primaryPerkId =
          p.perks?.styles?.[0]?.selections?.[0]?.perk ?? null;
        const subStyleId = p.perks?.styles?.[1]?.style ?? null;

        return {
          match_id: matchIdStr,
          participant_id: p.participantId as number,
          team_id: p.teamId as number,

          puuid: p.puuid as string,
          riot_game_name: p.riotIdGameName ?? null,
          riot_tagline: p.riotIdTagline ?? null,

          champion_name: p.championName as string,
          champ_level: p.champLevel as number,

          kills: p.kills as number,
          deaths: p.deaths as number,
          assists: p.assists as number,
          kill_participation: p.challenges?.killParticipation ?? null,

          total_damage_dealt: p.totalDamageDealtToChampions as number,
          total_damage_taken: p.totalDamageTaken as number,

          total_cs: totalCs,
          gold_earned: p.goldEarned as number,

          vision_score: p.visionScore as number,
          wards_placed: p.wardsPlaced as number,
          detector_wards_placed: p.detectorWardsPlaced as number,

          item0: p.item0 as number,
          item1: p.item1 as number,
          item2: p.item2 as number,
          item3: p.item3 as number,
          item4: p.item4 as number,
          item5: p.item5 as number,
          item6: p.item6 as number,

          summoner1_id: p.summoner1Id as number,
          summoner2_id: p.summoner2Id as number,

          primary_perk_id: primaryPerkId,
          sub_style_id: subStyleId,
        };
      });

      const { error: partError } = await supabase
        .from("match_participants")
        .upsert(participantRows, {
          onConflict: "match_id, participant_id",
        });

      if (partError) {
        console.error("❌ match_participants upsert 에러:", partError);
      }
    }

    // 5-4. 그룹 멤버 전적(group_match_players)
    for (const p of participants) {
      const pPuuid = p.puuid as string;
      const groupUserId = puuidToUserId.get(pPuuid);
      if (!groupUserId) continue;

      const totalCs =
        (p.totalMinionsKilled as number) + (p.neutralMinionsKilled as number);

      const { error: upsertPlayerError } = await supabase
        .from("group_match_players")
        .upsert(
          {
            group_id: groupId,
            match_id: matchIdStr,
            user_id: groupUserId,
            puuid: pPuuid,
            is_win: p.win as boolean,
            champion_name: p.championName as string,
            position: p.teamPosition as string,
            kills: p.kills as number,
            deaths: p.deaths as number,
            assists: p.assists as number,
            total_cs: totalCs,
            damage_to_champ: p.totalDamageDealtToChampions as number,
            vision_score: p.visionScore as number,
            item0: p.item0 as number,
            item1: p.item1 as number,
            item2: p.item2 as number,
            item3: p.item3 as number,
            item4: p.item4 as number,
            item5: p.item5 as number,
            item6: p.item6 as number,
          },
          {
            onConflict: "group_id, match_id, user_id",
          }
        );

      if (upsertPlayerError) {
        console.error("❌ group_match_players upsert 에러:", upsertPlayerError);
        continue;
      }

      totalSyncedPlayers += 1;

      const prevLatest =
        userIdToLatestMatchStart.get(groupUserId) ??
        userIdToLastSynced.get(groupUserId) ??
        0;

      if (startedAtMs > prevLatest) {
        userIdToLatestMatchStart.set(groupUserId, startedAtMs);
      }
    }

    // 5-5. 성장 분석 → match_growth 저장
    try {
      // 어떤 팀을 "우리 팀"으로 볼지 결정 (그룹 멤버의 팀)
      let myTeamId = 100;
      const anyGroupParticipant = participants.find((p: any) =>
        groupPuuidSet.has(p.puuid)
      );
      if (anyGroupParticipant) {
        myTeamId = anyGroupParticipant.teamId as number; // 100 or 200
      }
      // A. 성장 지표 분석
      const growth = analyzeGrowth(match, timeline);
      const { error: growthError } = await supabase.from("match_growth").upsert(
        {
          match_id: matchIdStr,
          graph: growth.graph,
          laning: growth.laning,
          max_turnover: growth.maxTurnover,
        },
        {
          onConflict: "match_id",
        }
      );

      if (growthError) {
        console.error("❌ match_growth upsert 에러:", growthError);
      }

      // B. 게임 흐름 분석
      const gameFlow = analyzeGameFlow(match, timeline);

      const { error: flowError } = await supabase
        .from("match_game_flows")
        .upsert(
          {
            match_id: matchIdStr,
            flow_events: gameFlow, // JSONB 배열 저장
          },
          { onConflict: "match_id" }
        );

      if (flowError) {
        console.error("❌ match_game_flows upsert 에러:", flowError);
      }
    } catch (e) {
      console.error("❌ 성장 분석/저장 에러 (match_growth):", e);
    }
  }

  // 6. sync_state 갱신
  for (const m of membersWithLol) {
    const prev = userIdToLastSynced.get(m.userId) ?? 0;
    const latest = userIdToLatestMatchStart.get(m.userId) ?? prev;
    await upsertSyncState(supabase, groupId, m.userId, m.puuid, latest);
  }

  return {
    syncedMatches: totalSyncedMatches,
    syncedPlayers: totalSyncedPlayers,
  };
}

// ---- Riot API 호출 유틸 ----

async function fetchRecentMatchIds(
  puuid: string,
  lastSyncedTime?: number | null
): Promise<RiotMatchId[]> {
  const params = new URLSearchParams({
    start: "0",
    count: "20",
  });

  if (lastSyncedTime) {
    params.set("startTime", Math.floor(lastSyncedTime / 1000).toString());
  }

  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`;

  const res = await fetchWithRetry(url);

  if (!res.ok) {
    console.error("❌ Riot match ids fetch 실패:", await res.text());
    throw new Error("라이엇 매치 ID 조회 실패");
  }

  const data = (await res.json()) as RiotMatchId[];
  return data;
}

async function fetchMatchDetail(matchId: string): Promise<any> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;

  const res = await fetchWithRetry(url);

  if (!res.ok) {
    const body = await res.text();
    console.error("❌ Riot match detail fetch 실패:", body);
    throw new Error("RIOT_MATCH_DETAIL_FAIL");
  }

  return res.json();
}

async function fetchMatchTimeline(matchId: string): Promise<any> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;

  const res = await fetchWithRetry(url);

  if (!res.ok) {
    const body = await res.text();
    console.error("❌ Riot match timeline fetch 실패:", body);
    throw new Error("RIOT_MATCH_TIMELINE_FAIL");
  }

  return res.json();
}

async function upsertSyncState(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  puuid: string,
  lastMatchTime: number
) {
  const { error } = await supabase.from("group_match_sync_state").upsert(
    {
      group_id: groupId,
      user_id: userId,
      puuid,
      last_synced_match_time: lastMatchTime,
      last_synced_at: new Date().toISOString(),
    },
    {
      onConflict: "group_id, user_id",
    }
  );

  if (error) {
    console.error("❌ sync_state upsert 에러:", error);
  }
}

function getWinnerTeamId(info: any): number | null {
  if (info.teams && Array.isArray(info.teams)) {
    const winnerTeam = info.teams.find((t: any) => t.win === true);
    return winnerTeam?.teamId ?? null;
  }
  return null;
}
