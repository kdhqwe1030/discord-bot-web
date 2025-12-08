// lib/lol/syncGroupMatches.ts
import { SupabaseClient } from "@supabase/supabase-js";

const RIOT_API_KEY = process.env.RIOT_API_KEY!;
const RIOT_REGION = "asia"; // 고정 사용

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
    // 그룹 멤버 중 롤 계정이 연결된 사람이 없음
    return { syncedMatches: 0, syncedPlayers: 0 };
  }

  // user_id → lol_account 매핑
  const userIdToLol = new Map<string, LolAccountRow>();
  for (const acc of lolAccounts) {
    userIdToLol.set(acc.user_id, acc);
  }

  // 롤 계정이 실제로 연결된 멤버만 필터링
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

  // puuid → user_id 매핑 (매치 파싱에서 사용)
  const puuidToUserId = new Map<string, string>();
  const groupPuuids: string[] = [];

  for (const m of membersWithLol) {
    puuidToUserId.set(m.puuid, m.userId);
    groupPuuids.push(m.puuid);
  }

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
    // 초기 latest는 lastSynced 기준
    if (last !== null) {
      userIdToLatestMatchStart.set(m.userId, last);
    }
  }

  // 4. 멤버별로 "새로 나온 matchIds"를 모아서 Set으로 dedupe
  const uniqueMatchIds = new Set<RiotMatchId>();

  for (const m of membersWithLol) {
    const lastSyncedTime = userIdToLastSynced.get(m.userId);
    const ids = await fetchRecentMatchIds(m.puuid, lastSyncedTime);

    for (const id of ids) {
      uniqueMatchIds.add(id);
    }
  }

  if (uniqueMatchIds.size === 0) {
    // 그래도 sync_state는 최소 한 번 찍어두고 싶다면 여기서 루프 돌면서 upsert 가능
    for (const m of membersWithLol) {
      const last = userIdToLastSynced.get(m.userId) ?? 0;
      await upsertSyncState(supabase, groupId, m.userId, m.puuid, last);
    }
    return { syncedMatches: 0, syncedPlayers: 0 };
  }

  // 5. 고유 matchId들에 대해서만 상세 조회 + DB upsert
  let totalSyncedMatches = 0;
  let totalSyncedPlayers = 0;
  for (const matchId of uniqueMatchIds) {
    let match: any;

    try {
      match = await fetchMatchDetail(matchId);
    } catch (e: any) {
      if (
        e?.message === "RIOT_RATE_LIMIT" ||
        (e as any).code === "RIOT_RATE_LIMIT"
      ) {
        console.warn(
          "⚠️ Riot 레이트 리밋에 도달했습니다. 남은 매치는 스킵합니다."
        );
        break;
      }

      console.error("❌ 개별 매치 상세 조회 에러, 이 매치만 스킵:", e);
      continue;
    }
    const info = match.info;
    const metadata = match.metadata;

    const startedAtMs = info.gameStartTimestamp as number;
    const queueId = info.queueId as number;
    const durationSeconds = info.gameDuration as number;

    const startedAtIso = new Date(startedAtMs).toISOString();
    const winnerTeamId = getWinnerTeamId(info);

    const { error: upsertMatchError } = await supabase
      .from("group_matches")
      .upsert(
        {
          group_id: groupId,
          match_id: metadata.matchId as string,
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
      continue; // 이 매치는 전체 스킵
    }

    totalSyncedMatches += 1;

    const participants = info.participants as any[];

    for (const p of participants) {
      const pPuuid = p.puuid as string;
      const groupUserId = puuidToUserId.get(pPuuid);
      if (!groupUserId) continue; // 그룹 멤버가 아니면 스킵

      const totalCs =
        (p.totalMinionsKilled as number) + (p.neutralMinionsKilled as number);

      const { error: upsertPlayerError } = await supabase
        .from("group_match_players")
        .upsert(
          {
            group_id: groupId,
            match_id: metadata.matchId as string,
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

      // 이 match의 시작 시간이 해당 유저에게 새로운 latest라면 갱신
      const prevLatest =
        userIdToLatestMatchStart.get(groupUserId) ??
        userIdToLastSynced.get(groupUserId) ??
        0;

      if (startedAtMs > prevLatest) {
        userIdToLatestMatchStart.set(groupUserId, startedAtMs);
      }
    }
  }

  // 6. 멤버별 sync_state 갱신 (한번에)
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
    count: "20", // 일단 최근 20판만
  });

  if (lastSyncedTime) {
    // ms → second
    params.set("startTime", Math.floor(lastSyncedTime / 1000).toString());
  }

  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });

  if (!res.ok) {
    console.error("❌ Riot match ids fetch 실패:", await res.text());
    throw new Error("라이엇 매치 ID 조회 실패");
  }

  const data = (await res.json()) as RiotMatchId[];
  return data;
}

async function fetchMatchDetail(matchId: string): Promise<any> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;

  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("❌ Riot match detail fetch 실패:", body);

    if (res.status === 429) {
      const err = new Error("RIOT_RATE_LIMIT");
      (err as any).code = "RIOT_RATE_LIMIT";
      throw err;
    }

    throw new Error("RIOT_MATCH_DETAIL_FAIL");
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

// 승리 팀 파악 (단순 버전)
function getWinnerTeamId(info: any): number | null {
  if (info.teams && Array.isArray(info.teams)) {
    const winnerTeam = info.teams.find((t: any) => t.win === true);
    return winnerTeam?.teamId ?? null;
  }
  return null;
}
