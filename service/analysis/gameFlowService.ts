import { GameFlowEvent, PlayerPosition } from "@/types/analysis";

// --- 상수 정의 ---
const TEAMFIGHT_WINDOW = 20000; // 한타 판정 시간 (20초)
const TEAMFIGHT_RADIUS = 4000; // 한타 판정 반경 (화면 1개 보다 조금 큰 크기)
const OBJECTIVE_VISION_RADIUS = 5000; // 오브젝트 시야 체크 반경
const GROUPING_RADIUS = 3000; // 포탑 철거 시 뭉침 판정 반경

/**
 * 게임 흐름 분석 메인 함수
 */
export const analyzeGameFlow = (
  matchData: any,
  timelineData: any
): GameFlowEvent[] => {
  const participants = matchData.info.participants;
  const frames = timelineData.info.frames;

  // 타임라인의 모든 이벤트를 시간순으로 평탄화
  const allEvents = frames.flatMap((f: any) => f.events);

  // 1. 대규모 한타 분석
  const teamfights = analyzeTeamfights(allEvents, frames, participants);

  // 2. 오브젝트 교전 및 시야 분석
  const objectives = analyzeObjectives(allEvents, frames, participants);

  // 3. 포탑 철거 및 운영 분석
  const structures = analyzeStructures(allEvents, frames, participants);

  // 시간순 정렬하여 반환
  return [...teamfights, ...objectives, ...structures].sort(
    (a, b) => a.timestamp - b.timestamp
  );
};

// ==============================================================================
// 1. 한타 분석 모듈 (Micro)
// ==============================================================================
function analyzeTeamfights(
  events: any[],
  frames: any[],
  participants: any[]
): GameFlowEvent[] {
  const results: GameFlowEvent[] = [];
  const killEvents = events.filter((e) => e.type === "CHAMPION_KILL");
  const processedKillIds = new Set<number>();

  killEvents.forEach((event, index) => {
    if (processedKillIds.has(event.timestamp + event.killerId)) return;

    // 클러스터링 (15초, 3000거리 내)
    const cluster = killEvents.filter(
      (e, i) =>
        i >= index &&
        e.timestamp - event.timestamp <= TEAMFIGHT_WINDOW &&
        getDistance(event.position, e.position) <= TEAMFIGHT_RADIUS
    );

    // 3킬 이상 발생 시 한타
    if (cluster.length >= 3) {
      cluster.forEach((e) => processedKillIds.add(e.timestamp + e.killerId));

      let team100Kills = 0;
      let team200Kills = 0;

      cluster.forEach((e) => {
        const killerTeam = getTeamId(e.killerId, participants);
        if (killerTeam === 100) team100Kills++;
        else team200Kills++;
      });

      // 더 많이 죽인 쪽이 승리
      const winningTeamId = team100Kills >= team200Kills ? 100 : 200;

      // 대표 위치 및 플레이어 위치
      const mainPos = event.position;
      const playerPositions = getPlayerPositionsAt(
        event.timestamp,
        frames,
        participants
      );

      results.push({
        id: `tf-${event.timestamp}`,
        timestamp: event.timestamp,
        type: "TEAMFIGHT",
        position: mainPos,
        // trigger: 보통 먼저 킬을 낸 쪽이 이니시 했다고 가정 (또는 winningTeam)
        triggerTeamId: getTeamId(event.killerId, participants),
        winningTeamId: winningTeamId,
        teamfightData: {
          team100Kills,
          team200Kills,
        },
        playerPositions,
      });
    }
  });

  return results;
}
// ==============================================================================
// 2. 오브젝트 분석 모듈 (Vision Control)
// ==============================================================================
function analyzeObjectives(
  events: any[],
  frames: any[],
  participants: any[]
): GameFlowEvent[] {
  const results: GameFlowEvent[] = [];
  const monsterKills = events.filter((e) => e.type === "ELITE_MONSTER_KILL");

  monsterKills.forEach((event) => {
    const killerTeam = getTeamId(event.killerId, participants); // 획득한 팀

    // 시야 분석 (처치 1분 전 ~ 처치 시점)
    const visionStart = event.timestamp - 60000;
    const visionEvents = events.filter(
      (e) =>
        e.timestamp >= visionStart &&
        e.timestamp <= event.timestamp &&
        (e.type === "WARD_PLACED" || e.type === "WARD_KILL")
    );

    const objPos = event.position || { x: 0, y: 0 };

    // 양 팀의 시야 작업 카운트
    const visionStats = {
      team100: { placed: 0, killed: 0 },
      team200: { placed: 0, killed: 0 },
    };

    visionEvents.forEach((ve) => {
      // 와드 위치가 오브젝트 근처인지 확인
      if (
        getDistance(objPos, { x: ve.position?.x, y: ve.position?.y }) <=
        OBJECTIVE_VISION_RADIUS
      ) {
        const actorTeam = getTeamId(ve.creatorId || ve.killerId, participants);

        if (actorTeam === 100) {
          if (ve.type === "WARD_PLACED") visionStats.team100.placed++;
          if (ve.type === "WARD_KILL") visionStats.team100.killed++;
        } else if (actorTeam === 200) {
          if (ve.type === "WARD_PLACED") visionStats.team200.placed++;
          if (ve.type === "WARD_KILL") visionStats.team200.killed++;
        }
      }
    });

    results.push({
      id: `obj-${event.timestamp}`,
      timestamp: event.timestamp,
      type: "OBJECTIVE",
      position: objPos,
      triggerTeamId: killerTeam, // 획득한 팀
      winningTeamId: killerTeam, // 획득한 팀이 승자
      visionData: visionStats,
      playerPositions: getPlayerPositionsAt(
        event.timestamp,
        frames,
        participants
      ),
    });
  });

  return results;
}
// ==============================================================================
// 3. 운영 분석 모듈 (Macro / Split Push)
// ==============================================================================
function analyzeStructures(
  events: any[],
  frames: any[],
  participants: any[]
): GameFlowEvent[] {
  const results: GameFlowEvent[] = [];
  const structureKills = events.filter(
    (e) => e.type === "BUILDING_KILL" && e.buildingType === "TOWER_BUILDING"
  );

  structureKills.forEach((event) => {
    const destroyedTeam = event.teamId; // 파괴된 팀
    const breakerTeam = destroyedTeam === 100 ? 200 : 100; // 깬 팀

    const positions = getPlayerPositionsAt(
      event.timestamp,
      frames,
      participants
    );
    const turretPos = event.position;

    // 깬 팀(Breaker Team)의 인원이 타워 근처에 몇 명 있었나?
    const breakersNearTurret = positions.filter(
      (p) =>
        p.teamId === breakerTeam &&
        !p.isDead &&
        getDistance({ x: p.x, y: p.y }, turretPos) <= GROUPING_RADIUS
    ).length;

    // 4명 이상이면 'GROUP', 아니면 'SPLIT'
    const formation = breakersNearTurret >= 4 ? "GROUP" : "SPLIT";
    const lane = translateLane(event.laneType);

    results.push({
      id: `st-${event.timestamp}`,
      timestamp: event.timestamp,
      type: "STRUCTURE",
      position: turretPos,
      triggerTeamId: breakerTeam, // 깬 팀
      winningTeamId: breakerTeam, // 이득 본 팀
      macroData: {
        formation,
        lane,
      },
      playerPositions: positions,
    });
  });

  return results;
}

// ==============================================================================
// 4. 유틸리티 함수 (Utils)
// ==============================================================================

/**
 * 두 좌표 사이의 거리 계산 (Euclidean Distance)
 */
function getDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
) {
  if (!pos1 || !pos2) return 99999;
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

/**
 * ParticipantId(1~10)를 TeamId(100/200)로 변환
 */
function getTeamId(participantId: number, participants: any[]): number {
  if (participantId === 0) return 0; // killerId가 0(미니언/타워)인 경우 처리

  // participants 배열에서 id로 찾거나, 단순 계산 (1~5: 100, 6~10: 200)
  // 안전하게 participants 데이터 참조
  const p = participants.find(
    (user: any) => user.participantId === participantId
  );
  return p ? p.teamId : participantId <= 5 ? 100 : 200;
}

/**
 * 특정 시간(timestamp)에 가장 가까운 프레임의 플레이어 위치 정보를 가져옴
 */
function getPlayerPositionsAt(
  timestamp: number,
  frames: any[],
  participants: any[]
): PlayerPosition[] {
  // 타임스탬프를 분 단위 인덱스로 변환 (Timeline은 1분 단위)
  // 예: 15분 30초(930000ms) -> index 15 or 16
  // 가장 가까운 프레임을 찾기 위해 반올림 사용 가능하나, 보통 직전 프레임이나 해당 분 프레임 사용
  const frameIndex = Math.min(Math.round(timestamp / 60000), frames.length - 1);

  const frame = frames[frameIndex];
  const playerPositions: PlayerPosition[] = [];

  // 1~10번 참가자 루프
  for (let i = 1; i <= 10; i++) {
    const pFrame = frame.participantFrames[i.toString()];
    const pInfo = participants.find((p: any) => p.participantId === i);

    if (pFrame && pInfo) {
      playerPositions.push({
        participantId: i,
        championName: pInfo.championName,
        teamId: pInfo.teamId,
        x: pFrame.position.x,
        y: pFrame.position.y,
        isDead: false, // Timeline 스냅샷에는 생존 여부가 명시적이지 않음 (추가 로직 필요 시 kill event 참조해야 함)
      });
    }
  }

  return playerPositions;
}

function translateLane(laneType: string) {
  switch (laneType) {
    case "TOP_LANE":
      return "탑";
    case "MID_LANE":
      return "미드";
    case "BOT_LANE":
      return "바텀";
    default:
      return "기지";
  }
}
