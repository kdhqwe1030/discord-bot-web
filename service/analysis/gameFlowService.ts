import { GameFlowEvent, PlayerPosition } from "@/types/analysis";

// --- 상수 정의 ---
const TEAMFIGHT_WINDOW = 20000; // 20초
const TEAMFIGHT_RADIUS = 4000;
const GROUPING_RADIUS = 3000;
const NEAR_DEATH_WINDOW = 15000; // 오브젝트 전후 15초
const VISION_CHECK_WINDOW = 60000; // 시야 체크 범위 (1분)

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

    // 클러스터링
    const cluster = killEvents.filter(
      (e, i) =>
        i >= index &&
        e.timestamp - event.timestamp <= TEAMFIGHT_WINDOW &&
        getDistance(event.position, e.position) <= TEAMFIGHT_RADIUS
    );

    if (cluster.length >= 3) {
      cluster.forEach((e) => processedKillIds.add(e.timestamp + e.killerId));

      let team100Kills = 0;
      let team200Kills = 0;
      const deadPositions: PlayerPosition[] = [];

      cluster.forEach((e) => {
        const killerTeam = getTeamId(e.killerId, participants);
        if (killerTeam === 100) team100Kills++;
        else team200Kills++;

        const victimInfo = getParticipantInfo(e.victimId, participants);
        if (victimInfo) {
          deadPositions.push({
            participantId: e.victimId,
            championName: victimInfo.championName,
            teamId: victimInfo.teamId,
            x: e.position.x,
            y: e.position.y,
          });
        }
      });

      const winningTeamId = team100Kills >= team200Kills ? 100 : 200;
      const playerPositions = getPlayerPositionsAt(
        event.timestamp,
        frames,
        participants
      );

      // 한타 발생 시점 기준 시야 데이터 계산
      const visionData = getVisionStats(event.timestamp, events, participants);

      results.push({
        id: `tf-${event.timestamp}`,
        timestamp: event.timestamp,
        type: "TEAMFIGHT",
        position: event.position,
        triggerTeamId: getTeamId(event.killerId, participants),
        winningTeamId: winningTeamId,
        teamfightData: { team100Kills, team200Kills },
        visionData,
        playerPositions,
        deadPositions,
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
    const killerTeam = getTeamId(event.killerId, participants);
    const objPos = event.position;

    // 시야 데이터 계산
    const visionStats = getVisionStats(event.timestamp, events, participants);

    const deadPositions: PlayerPosition[] = [];
    const nearKills = events.filter(
      (e) =>
        e.type === "CHAMPION_KILL" &&
        Math.abs(e.timestamp - event.timestamp) <= NEAR_DEATH_WINDOW
    );

    nearKills.forEach((kill) => {
      const victimInfo = getParticipantInfo(kill.victimId, participants);
      if (victimInfo) {
        deadPositions.push({
          participantId: kill.victimId,
          championName: victimInfo.championName,
          teamId: victimInfo.teamId,
          x: kill.position.x,
          y: kill.position.y,
        });
      }
    });

    results.push({
      id: `obj-${event.timestamp}`,
      timestamp: event.timestamp,
      type: "OBJECTIVE",
      position: objPos,
      triggerTeamId: killerTeam,
      winningTeamId: killerTeam,
      visionData: visionStats,
      monsterType: event.monsterType,
      playerPositions: getPlayerPositionsAt(
        event.timestamp,
        frames,
        participants
      ),
      deadPositions,
    });
  });

  return results;
}

// ==============================================================================
// 3. 운영 분석 모듈 (Macro)
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
    const destroyedTeam = event.teamId;
    const breakerTeam = destroyedTeam === 100 ? 200 : 100;

    const positions = getPlayerPositionsAt(
      event.timestamp,
      frames,
      participants
    );
    const turretPos = event.position;

    const breakersNearTurret = positions.filter(
      (p) =>
        p.teamId === breakerTeam &&
        getDistance({ x: p.x, y: p.y }, turretPos) <= GROUPING_RADIUS
    ).length;

    const formation = breakersNearTurret >= 4 ? "GROUP" : "SPLIT";
    const lane = translateLane(event.laneType);

    // 포탑 철거 시점 기준 시야 데이터 계산
    const visionData = getVisionStats(event.timestamp, events, participants);

    const deadPositions: PlayerPosition[] = [];
    const nearKills = events.filter(
      (e) =>
        e.type === "CHAMPION_KILL" &&
        Math.abs(e.timestamp - event.timestamp) <= NEAR_DEATH_WINDOW
    );

    nearKills.forEach((kill) => {
      const victimInfo = getParticipantInfo(kill.victimId, participants);
      if (victimInfo) {
        deadPositions.push({
          participantId: kill.victimId,
          championName: victimInfo.championName,
          teamId: victimInfo.teamId,
          x: kill.position.x,
          y: kill.position.y,
        });
      }
    });

    results.push({
      id: `st-${event.timestamp}`,
      timestamp: event.timestamp,
      type: "STRUCTURE",
      position: turretPos,
      triggerTeamId: breakerTeam,
      winningTeamId: breakerTeam,
      macroData: { formation, lane },
      visionData,
      playerPositions: positions,
      deadPositions,
    });
  });

  return results;
}

// ==============================================================================
// 4. 유틸리티 함수
// ==============================================================================

/**
 * 특정 시점 기준 1분간의 시야(와드 설치/제거) 통계 계산
 */
function getVisionStats(
  timestamp: number,
  allEvents: any[],
  participants: any[]
) {
  const visionStart = timestamp - VISION_CHECK_WINDOW;

  const visionEvents = allEvents.filter(
    (e) =>
      e.timestamp >= visionStart &&
      e.timestamp <= timestamp &&
      (e.type === "WARD_PLACED" || e.type === "WARD_KILL")
  );

  const stats = {
    team100: { placed: 0, killed: 0 },
    team200: { placed: 0, killed: 0 },
  };

  visionEvents.forEach((ve) => {
    const actorId = ve.creatorId || ve.killerId;
    const actorTeam = getTeamId(actorId, participants);

    if (actorTeam === 100) {
      if (ve.type === "WARD_PLACED") stats.team100.placed++;
      if (ve.type === "WARD_KILL") stats.team100.killed++;
    } else if (actorTeam === 200) {
      if (ve.type === "WARD_PLACED") stats.team200.placed++;
      if (ve.type === "WARD_KILL") stats.team200.killed++;
    }
  });

  return stats;
}

function getDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
) {
  if (!pos1 || !pos2) return 99999;
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

function getTeamId(participantId: number, participants: any[]): number {
  if (participantId === 0) return 0;
  const p = participants.find(
    (user: any) => user.participantId === participantId
  );
  return p ? p.teamId : participantId <= 5 ? 100 : 200;
}

function getParticipantInfo(participantId: number, participants: any[]) {
  return participants.find((p: any) => p.participantId === participantId);
}

function getPlayerPositionsAt(
  timestamp: number,
  frames: any[],
  participants: any[]
): PlayerPosition[] {
  const frameIndex = Math.min(Math.round(timestamp / 60000), frames.length - 1);
  const frame = frames[frameIndex];
  const playerPositions: PlayerPosition[] = [];

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
