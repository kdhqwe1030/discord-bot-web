"use client";
import ChmpionImg from "./ChmpionImg";
import { getGameModeName } from "@/utils/gameMode";
import LineImg from "./LineImg";
import { Match, MatchPlayer } from "@/types/match";
import { getTimeAgo } from "@/utils/timeAgo";
import MatchDetail from "./detail/MatchDetail";
import { useQuery } from "@tanstack/react-query";
import { groupAPI } from "@/lib/api/group";
import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

const MatchRow = ({ match }: { match: Match }) => {
  const isWin = match.groupWin;
  const railColor = isWin
    ? "bg-win/20 text-win border-l-win"
    : "bg-lose/20 text-lose border-l-lose";

  const resultText = isWin ? "승리" : "패배";
  const [isClick, setIsClick] = useState(false);
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

  const { data, isLoading } = useQuery({
    queryKey: ["matches", match.matchId],
    queryFn: () => groupAPI.fetchMatchDetail(match.matchId),
  });

  console.log(data);
  return (
    <>
      <div
        className={`mb-3 rounded-xl overflow-hidden shadow-sm flex ${railColor} justify-between`}
        onClick={() => setIsClick(!isClick)}
      >
        {/* 왼쪽 정보 레일 */}
        <div
          className={`flex flex-col justify-center gap-1 px-4 py-3 w-28 ${railColor}`}
        >
          <span className="text-md font-semibold tracking-wide">
            {resultText}
          </span>
          <span className="text-sm text-text-2">{gameModeName}</span>
          <div>
            <span className="text-xs text-text-3">
              {getTimeAgo(match.startedAt)}
            </span>
            <span className="text-xs text-text-3">{" | "}</span>
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
              <div
                key={index}
                className="flex flex-col items-center gap-1 lg:w-24"
              >
                <ChmpionImg championName={player.championName} />

                {/* 소환사 이름 */}
                <div className="flex items-center gap-1 mt-1">
                  <LineImg line={player.position} />
                  <span className="text-sm text-text-2 truncate max-x-24">
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
        <div
          className={`flex items-center px-4 ${
            isClick ? "rotate-180" : "rotate-0"
          } transition-all duration-300`}
        >
          <IoIosArrowDown className="text-2xl text-text-1" />
        </div>
      </div>
      {isClick && !isLoading && data?.matchData && (
        <MatchDetail
          matchData={data.matchData}
          winnerTeamId={match.winnerTeamId}
          groupWin={match.groupWin}
          matchDuration={match.durationSeconds}
        />
      )}
    </>
  );
};

export default MatchRow;
