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
  gameFlow?: any;
}

export interface TeamStatsProps {
  matchData: any;
  groupTeamId: number;
}
