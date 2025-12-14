export interface Participant {
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championName: string;
  champLevel: number;
  summoner1Id: number;
  summoner2Id: number;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  detectorWardsPlaced: number;
  wardsPlaced: number;
  wardsKilled: number;
  visionScore: number;

  totalDamageDealtToChampions: number;
  totalDamageTaken: number;

  challenges: {
    killParticipation?: number;
  };
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;

  //  아이템 슬롯
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number; // 장신구

  //  룬 정보
  perks: {
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    styles: {
      description: string;
      selections: {
        perk: number; // 핵심 룬 ID
        var1: number;
        var2: number;
        var3: number;
      }[];
      style: number; // 주 룬 스타일 ID (ex. 정밀)
    }[];
  };
}

export interface MatchDetailProps {
  matchData: any;
  winnerTeamId: number;
  groupWin: boolean;
  matchDuration: number;
  growthData?: any;
}

export interface TeamStatsProps {
  matchData: any;
  groupTeamId: number;
}

export interface TimelineFrame {
  timestamp: number;
  participantFrames: {
    [key: string]: {
      totalGold: number;
      xp: number;
      minionsKilled: number;
      jungleMinionsKilled: number;
      level: number;
      position?: { x: number; y: number };
    };
  };
  events: any[];
}
export interface TimeLineGraphData {
  minute: number;
  goldDiff: number; // 양수: 우리팀 우세, 음수: 상대팀 우세
  team100Gold: number;
  team200Gold: number;
  events: {
    type: "KILL" | "OBJECTIVE" | "TURRET";
    description: string;
    timestamp: number;
    triggerTeamId: number;
    monsterType?: string;
  }[];
}

export interface LaneStat {
  championName: string;
  playerName: string;
  playerTag: string;
  gold: number;
  cs: number;
  xp: number;
  level: number;
}

export interface LaningPhaseStats {
  [role: string]: {
    // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
    team100: LaneStat;
    team200: LaneStat;
    diff: {
      gold: number; // (100 - 200)
      cs: number;
      xp: number;
    };
  };
}

export interface GrowthAnalysisResponse {
  graph: TimeLineGraphData[];
  laning: LaningPhaseStats;
  maxTurnover: {
    minute: number;
    changeAmount: number;
    winningTeamId: number;
  } | null;
}
// ========
// 흐름 분석
// ========
export type FlowEventType = "TEAMFIGHT" | "OBJECTIVE" | "STRUCTURE";

export interface PlayerPosition {
  participantId: number;
  championName: string;
  teamId: number;
  x: number;
  y: number;
  isDead: boolean; // 해당 시점에 죽어있는지 여부
}

export interface GameFlowEvent {
  id: string;
  timestamp: number;
  type: FlowEventType;

  // 지도에 표시할 중심 좌표
  position: { x: number; y: number };

  // 상세 정보 (중립적)
  triggerTeamId: number; // 이벤트를 발생시킨 주체 (킬/오브젝트/포탑막타)
  winningTeamId: number; // 이득을 본 팀

  // 데이터 (타입별 상세)
  teamfightData?: {
    team100Kills: number;
    team200Kills: number;
  };
  visionData?: {
    // 오브젝트 획득 시점의 양팀 시야 점수 (설치/제거)
    team100: { placed: number; killed: number };
    team200: { placed: number; killed: number };
  };
  macroData?: {
    formation: "GROUP" | "SPLIT"; // 포탑을 깬 팀의 진형
    lane: string;
  };

  // 시점 데이터 (지도 렌더링용)
  playerPositions: PlayerPosition[];
}
