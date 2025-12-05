import ChmpionImg from "./ChmpionImg";
import { getGameModeName } from "@/utils/gameMode";
import LineImg from "./LineImg";
import { Match, MatchPlayer } from "@/types/match";
import { getTimeAgo } from "@/utils/timeAgo";

const MatchRow = ({ match }: { match: Match }) => {
  const isWin = match.groupWin;
  const railColor = isWin
    ? "bg-win/20 text-win border-l-win"
    : "bg-lose/20 text-lose border-l-lose";

  const resultText = isWin ? "승리" : "패배";

  // 시간 포맷
  const minutes = Math.floor(match.durationSeconds / 60);
  const seconds = match.durationSeconds % 60;
  const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const gameModeName = getGameModeName({ queueId: match.queueId });
  const linesort = (position: string) => {
    switch (position) {
      case "TOP":
        return 1;
      case "JUNGLE":
        return 2;
      case "MIDDLE":
        return 3;
      case "BOTTOM":
        return 4;
      case "UTILITY":
        return 5;
    }
    return 1;
  };
  const filterList = [
    ...match.players.sort(
      (a: MatchPlayer, b: MatchPlayer) =>
        linesort(a.position) - linesort(b.position)
    ),
  ];

  return (
    <div
      className={`w-full mb-3 rounded-xl overflow-hidden shadow-sm flex ${railColor}`}
    >
      {/* 왼쪽 정보 레일 */}
      <div
        className={`flex flex-col justify-center gap-1 px-4 py-3 w-32 border-r border-divider ${railColor}`}
      >
        <span className="text-md font-semibold tracking-wide">
          {resultText}
        </span>
        <span className="text-sm text-text-2">{gameModeName}</span>
        <div>
          <span className="text-xs text-text-3">
            {getTimeAgo(match.startedAt)}
          </span>
          {" | "}
          <span className="text-xs text-text-3">{duration}</span>
        </div>
      </div>

      {/* 플레이어들 */}
      <div className="flex-1 flex items-center gap-6 px-6 py-3 overflow-x-auto">
        {filterList.map((player: MatchPlayer, index: number) => {
          const rawKda = player.deaths
            ? (player.kills + player.assists) / player.deaths
            : "Perfect";
          const kda = typeof rawKda === "number" ? rawKda.toFixed(2) : rawKda;

          return (
            <div key={index} className="flex flex-col items-center gap-1 w-32">
              <ChmpionImg championName={player.championName} />

              {/* 소환사 이름 */}
              <div className="flex items-center gap-1 mt-1">
                <LineImg line={player.position} />
                <span className="text-sm text-text-2 truncate max-x-32">
                  {player.summonerName}
                </span>
              </div>

              {/* KDA */}
              <div className="text-sm text-text-3">
                {player.kills}/{player.deaths}/{player.assists}{" "}
                <span className="ml-1 text-xs text-text-4">
                  {kda === "Perfect" ? "PERFECT" : `${kda}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchRow;
