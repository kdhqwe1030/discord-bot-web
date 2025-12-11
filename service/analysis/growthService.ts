// src/services/analysis/growthService.ts

import {
  GrowthAnalysisResponse,
  LaningPhaseStats,
  TimeLineGraphData,
} from "@/types/analysis";

// Riot API 타입 (필요한 부분만 정의)
interface TimelineFrame {
  timestamp: number;
  participantFrames: {
    [key: string]: {
      totalGold: number;
      xp: number;
      minionsKilled: number;
      jungleMinionsKilled: number;
      level: number;
    };
  };
  events: any[];
}

/**
 * 성장 탭 데이터 가공 메인 함수
 * @param matchData Match-V5 상세 데이터
 * @param timelineData Match-V5 타임라인 데이터
 * @param myTeamId 기준이 될 팀 ID (100 or 200)
 */
export const analyzeGrowth = (
  matchData: any,
  timelineData: any,
  myTeamId: number
): GrowthAnalysisResponse => {
  const frames: TimelineFrame[] = timelineData.info.frames;
  const participants = matchData.info.participants;

  // 1. 그래프 데이터 생성
  const graph = calculateGoldGraph(frames, myTeamId);

  // 2. 라인전 지표 생성 (14분 기준)
  const laning = calculateLaningPhase(frames, participants, myTeamId);

  // 3. 최대 변곡점(Turnover Point) 찾기
  const maxTurnover = findMaxTurnover(graph);

  return {
    graph,
    laning,
    maxTurnover,
  };
};

// ------------------------------------------------------------------
// 1. 시간대별 골드 그래프 계산
// ------------------------------------------------------------------
function calculateGoldGraph(
  frames: TimelineFrame[],
  myTeamId: number
): TimeLineGraphData[] {
  return frames.map((frame, index) => {
    let team100Gold = 0;
    let team200Gold = 0;
    const events: TimeLineGraphData["events"] = [];

    // 골드 합산
    Object.values(frame.participantFrames).forEach((p: any) => {
      // participantId 1~5: Team 100, 6~10: Team 200
      // 주의: participantId가 string으로 올 수 있으므로 parseInt
      // (participantId는 보통 1부터 시작)
      // 정확히 하려면 matchData의 participants 정보를 참조해야 하지만,
      // 라이엇 표준상 1~5는 블루(100), 6~10은 레드(200)입니다.
      // 여기서는 frame key(1~10)를 사용합니다.
    });

    // participantFrames는 "1", "2" 같은 키를 가짐.
    for (let i = 1; i <= 10; i++) {
      const pData = frame.participantFrames[i.toString()];
      if (!pData) continue;

      if (i <= 5) team100Gold += pData.totalGold;
      else team200Gold += pData.totalGold;
    }

    // 중요 이벤트 추출 (해당 프레임 내)
    frame.events.forEach((event: any) => {
      if (event.type === "ELITE_MONSTER_KILL") {
        // killerId로 팀 식별 (1~5: 100팀, 6~10: 200팀)
        const killerTeamId = event.killerId <= 5 ? 100 : 200;
        const isMyTeam = killerTeamId === myTeamId;

        events.push({
          type: "OBJECTIVE",
          description: `${event.monsterType} 처치`,
          timestamp: event.timestamp,
          isMyTeam: isMyTeam, // 우리 팀이 먹었는지
          monsterType: event.monsterType, // 아이콘 매핑용 타입 추가
        });
      } else if (
        event.type === "BUILDING_KILL" &&
        event.buildingType === "TOWER_BUILDING"
      ) {
        // 타워는 killerId가 0일 수 있음(미니언 처형 등). teamId로 구분하거나 killerId 확인
        // event.teamId는 '파괴된 타워의 팀'임. 즉, 내가 깼으면 상대 팀 ID가 들어옴.
        const destroyedTeamId = event.teamId;
        const breakerTeamId = destroyedTeamId === myTeamId ? 200 : myTeamId; // 깬 팀
        const isMyTeam = breakerTeamId === myTeamId;

        events.push({
          type: "TURRET",
          description: `${event.laneType} 타워 파괴`,
          timestamp: event.timestamp,
          isMyTeam: isMyTeam, //  우리 팀이 깼는지 여부
        });
      } else if (event.type === "CHAMPION_KILL") {
        const killerId = event.killerId;

        if (killerId > 0) {
          // 1~5: 100팀(블루), 6~10: 200팀(레드) /killerId가 0이면 타워/미니언 처형(Execution)이므로 제외하거나 별도 처리
          const killerTeamId = killerId <= 5 ? 100 : 200;
          const isMyTeam = killerTeamId === myTeamId;

          events.push({
            type: "KILL",
            description: "킬", // 툴팁에 "킬"이라고만 표시
            timestamp: event.timestamp,
            isMyTeam: isMyTeam, // 우리 팀이 죽였으면 true (파랑 아이콘)
          });
        }
      }
    });

    const myTeamGold = myTeamId === 100 ? team100Gold : team200Gold;
    const enemyTeamGold = myTeamId === 100 ? team200Gold : team100Gold;

    return {
      minute: index,
      myTeamGold,
      enemyTeamGold,
      goldDiff: myTeamGold - enemyTeamGold, // 양수면 우리팀 유리
      events,
    };
  });
}

// ------------------------------------------------------------------
// 2. 라인전 스냅샷 (14분) 계산
// ------------------------------------------------------------------
function calculateLaningPhase(
  frames: TimelineFrame[],
  participants: any[],
  myTeamId: number
): LaningPhaseStats {
  // 14분 프레임 가져오기 (게임이 14분보다 짧으면 마지막 프레임)
  const targetIndex = Math.min(14, frames.length - 1);
  const targetFrame = frames[targetIndex];

  // 포지션별로 참가자 매핑
  const roles = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
  const laningStats: LaningPhaseStats = {};

  roles.forEach((role) => {
    // 해당 라인의 우리팀 선수와 상대팀 선수 찾기
    const ourPlayerInfo = participants.find(
      (p: any) => p.teamId === myTeamId && p.teamPosition === role
    );
    const enemyPlayerInfo = participants.find(
      (p: any) => p.teamId !== myTeamId && p.teamPosition === role
    );

    if (!ourPlayerInfo || !enemyPlayerInfo) return; // ARAM 등 예외 처리

    const ourFrame =
      targetFrame.participantFrames[ourPlayerInfo.participantId.toString()];
    const enemyFrame =
      targetFrame.participantFrames[enemyPlayerInfo.participantId.toString()];

    const ourCS = ourFrame.minionsKilled + ourFrame.jungleMinionsKilled;
    const enemyCS = enemyFrame.minionsKilled + enemyFrame.jungleMinionsKilled;

    const stats = {
      ourPlayer: {
        championName: ourPlayerInfo.championName,
        playerName: ourPlayerInfo.riotIdGameName,
        playerTag: ourPlayerInfo.riotIdTagline,
        gold: ourFrame.totalGold,
        cs: ourCS,
        xp: ourFrame.xp,
        level: ourFrame.level,
      },
      opponentPlayer: {
        championName: enemyPlayerInfo.championName,
        playerName: enemyPlayerInfo.riotIdGameName,
        playerTag: enemyPlayerInfo.riotIdTagline,
        gold: enemyFrame.totalGold,
        cs: enemyCS,
        xp: enemyFrame.xp,
        level: enemyFrame.level,
      },
      diff: {
        gold: ourFrame.totalGold - enemyFrame.totalGold,
        cs: ourCS - enemyCS,
        xp: ourFrame.xp - enemyFrame.xp,
      },
      isWin: ourFrame.totalGold - enemyFrame.totalGold > 0, // 골드 앞서면 승리 판정
    };

    laningStats[role] = stats;
  });

  return laningStats;
}

// ------------------------------------------------------------------
// 3. 최대 변곡점 (Turnover) 찾기
// ------------------------------------------------------------------
function findMaxTurnover(graph: TimeLineGraphData[]) {
  if (graph.length < 2) return null;

  let maxChange = 0;
  let turnoverMinute = 0;

  for (let i = 1; i < graph.length; i++) {
    // 1분 전과 현재의 골드 차이 변화량 계산
    const change = graph[i].goldDiff - graph[i - 1].goldDiff;

    if (Math.abs(change) > Math.abs(maxChange)) {
      maxChange = change;
      turnoverMinute = i;
    }
  }

  // 변화량이 미미하면(예: 1000골드 미만) 변곡점 없음 처리 가능
  if (Math.abs(maxChange) < 1000) return null;

  const isPositive = maxChange > 0;
  return {
    minute: turnoverMinute,
    changeAmount: maxChange,
    description: isPositive
      ? `🔥 ${turnoverMinute}분: 우리 팀이 승기를 잡았습니다! (+${maxChange.toLocaleString()}G)`
      : `🚨 ${turnoverMinute}분: 상대에게 흐름이 넘어갔습니다. (${maxChange.toLocaleString()}G)`,
  };
}
