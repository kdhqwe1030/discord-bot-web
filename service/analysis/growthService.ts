import {
  GrowthAnalysisResponse,
  LaningPhaseStats,
  TimelineFrame,
  TimeLineGraphData,
} from "@/types/analysis";

/**
 * 성장 탭 데이터 가공 메인 함수
 */
export const analyzeGrowth = (
  matchData: any,
  timelineData: any
): GrowthAnalysisResponse => {
  const frames: TimelineFrame[] = timelineData.info.frames;
  const participants = matchData.info.participants;

  // 1. 그래프 데이터 생성 (Team 100 vs Team 200)
  const graph = calculateGoldGraph(frames);

  // 2. 라인전 지표 생성 (14분 기준, 절대적 비교)
  const laning = calculateLaningPhase(frames, participants);

  // 3. 최대 변곡점 찾기
  const maxTurnover = findMaxTurnover(graph);

  return {
    graph,
    laning,
    maxTurnover,
  };
};

// ------------------------------------------------------------------
// 1. 시간대별 골드 그래프 계산 (절대적 기준 + 킬 필터링)
// ------------------------------------------------------------------
function calculateGoldGraph(frames: TimelineFrame[]): TimeLineGraphData[] {
  // [로직 추가] 전체 게임에서 "오브젝트가 죽은 시간"들만 미리 수집
  // 목적: 킬 이벤트가 발생했을 때, 이 시간들 중 하나라도 +- 60초 내에 있는지 확인하기 위함
  const objectiveTimestamps: number[] = [];

  frames.forEach((frame) => {
    frame.events.forEach((event: any) => {
      if (event.type === "ELITE_MONSTER_KILL") {
        objectiveTimestamps.push(event.timestamp);
      }
    });
  });

  return frames.map((frame, index) => {
    let team100Gold = 0;
    let team200Gold = 0;
    const events: TimeLineGraphData["events"] = [];

    // 골드 합산 (1~5: 블루, 6~10: 레드)
    for (let i = 1; i <= 10; i++) {
      const pData = frame.participantFrames[i.toString()];
      if (!pData) continue;

      if (i <= 5) team100Gold += pData.totalGold;
      else team200Gold += pData.totalGold;
    }

    // 중요 이벤트 추출
    frame.events.forEach((event: any) => {
      // 1) 오브젝트 (드래곤, 바론, 전령)
      if (event.type === "ELITE_MONSTER_KILL") {
        const killerTeamId = event.killerId <= 5 ? 100 : 200;
        events.push({
          type: "OBJECTIVE",
          timestamp: event.timestamp,
          monsterType: event.monsterType,
          triggerTeamId: killerTeamId,
          description: `${event.monsterType} 처치`,
        });
      }
      // 2) 포탑 파괴
      else if (
        event.type === "BUILDING_KILL" &&
        event.buildingType === "TOWER_BUILDING"
      ) {
        // event.teamId는 파괴된 쪽이므로, 깬 쪽은 반대
        const destroyedTeamId = event.teamId;
        const breakerTeamId = destroyedTeamId === 100 ? 200 : 100;

        events.push({
          type: "TURRET",
          timestamp: event.timestamp,
          triggerTeamId: breakerTeamId,
          description: `${translateLane(event.laneType)} 타워 파괴`,
        });
      }
      // 3) 킬 (조건부 추가: 오브젝트 전후 1분)
      else if (event.type === "CHAMPION_KILL") {
        const killTime = event.timestamp;

        // 해당 킬이 어떤 오브젝트라도 +- 60초(60000ms) 내에 있는지 확인
        const isNearObjective = objectiveTimestamps.some(
          (objTime) => Math.abs(killTime - objTime) <= 60000
        );

        if (isNearObjective) {
          const killerId = event.killerId;
          // killerId가 0(미니언/타워 처형)이 아닌 경우만
          if (killerId > 0) {
            const killerTeamId = killerId <= 5 ? 100 : 200;
            events.push({
              type: "KILL",
              timestamp: killTime,
              triggerTeamId: killerTeamId,
              description: "교전 킬 발생", // 혹은 "킬"
            });
          }
        }
      }
    });

    return {
      minute: index,
      team100Gold, // 중립적 키 이름 사용
      team200Gold,
      goldDiff: team100Gold - team200Gold,
      events,
    };
  });
}

// ------------------------------------------------------------------
// 2. 라인전 스냅샷 (14분) 계산 (절대적 기준)
// ------------------------------------------------------------------
function calculateLaningPhase(
  frames: TimelineFrame[],
  participants: any[]
): LaningPhaseStats {
  const targetIndex = Math.min(14, frames.length - 1);
  const targetFrame = frames[targetIndex];
  const roles = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

  const laningStats: LaningPhaseStats = {};

  roles.forEach((role) => {
    // 100팀 선수와 200팀 선수 찾기
    const p100 = participants.find(
      (p: any) => p.teamId === 100 && p.teamPosition === role
    );
    const p200 = participants.find(
      (p: any) => p.teamId === 200 && p.teamPosition === role
    );

    if (!p100 || !p200) return;

    const frame100 =
      targetFrame.participantFrames[p100.participantId.toString()];
    const frame200 =
      targetFrame.participantFrames[p200.participantId.toString()];

    // CS 계산
    const cs100 = frame100.minionsKilled + frame100.jungleMinionsKilled;
    const cs200 = frame200.minionsKilled + frame200.jungleMinionsKilled;

    laningStats[role] = {
      team100: {
        championName: p100.championName,
        playerName: p100.riotIdGameName,
        playerTag: p100.riotIdTagline,
        gold: frame100.totalGold,
        cs: cs100,
        xp: frame100.xp,
        level: frame100.level,
      },
      team200: {
        championName: p200.championName,
        playerName: p200.riotIdGameName,
        playerTag: p200.riotIdTagline,
        gold: frame200.totalGold,
        cs: cs200,
        xp: frame200.xp,
        level: frame200.level,
      },
      diff: {
        gold: frame100.totalGold - frame200.totalGold,
        cs: cs100 - cs200,
        xp: frame100.xp - frame200.xp,
      },
    };
  });

  return laningStats;
}

// ------------------------------------------------------------------
// 3. 최대 변곡점 (Turnover) 찾기 (중립적 데이터 반환)
// ------------------------------------------------------------------
function findMaxTurnover(graph: TimeLineGraphData[]) {
  if (graph.length < 2) return null;

  let maxChange = 0;
  let turnoverMinute = 0;

  for (let i = 1; i < graph.length; i++) {
    const change = graph[i].goldDiff - graph[i - 1].goldDiff;

    if (Math.abs(change) > Math.abs(maxChange)) {
      maxChange = change;
      turnoverMinute = i;
    }
  }

  // 변화량이 너무 작으면(1000골드 미만) 무시
  if (Math.abs(maxChange) < 1000) return null;

  return {
    minute: turnoverMinute,
    changeAmount: Math.abs(maxChange),
    winningTeamId: maxChange > 0 ? 100 : 200, // 양수면 100팀이 이득
  };
}

// ------------------------------------------------------------------
// 유틸리티
// ------------------------------------------------------------------
function translateLane(laneType: string) {
  switch (laneType) {
    case "TOP_LANE":
      return "탑";
    case "MID_LANE":
      return "미드";
    case "BOT_LANE":
      return "바텀";
    default:
      return "타워";
  }
}
