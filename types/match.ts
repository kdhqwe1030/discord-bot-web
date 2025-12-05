export interface MatchPlayer {
  id: string;
  userId: string;
  puuid: string;
  isWin: boolean;
  championName: string;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  totalCs: number;
  damageToChamp: number;
  visionScore: number;
  items: number[];
  summonerName: string;
  tagLine: string;
}

export interface Match {
  id: string;
  matchId: string;
  queueId: number;
  durationSeconds: number;
  startedAt: string;
  winnerTeamId: number;
  groupWin: boolean;
  players: MatchPlayer[];
}
