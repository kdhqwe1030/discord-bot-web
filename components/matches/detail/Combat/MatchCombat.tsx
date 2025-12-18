"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { FlowEventType, GameFlowEvent, PlayerPosition } from "@/types/analysis";
import { getObjectiveDisplayName } from "@/utils/lolParseString";
import WardCompare from "./WardCompare";
import WardComparePlaceholder from "./WardComparePlaceholder";
import { getObjectiveIconUrl } from "@/utils/lolImg";

// 미니맵 관련 상수
const MAP_IMAGE_URL =
  "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/map/map11.png";
const MAP_SIZE = 15000;

interface MatchCombatProps {
  gameFlow: GameFlowEvent[] | null;
  myTeamId: number;
}

// 텍스트 생성 헬퍼
const generateEventText = (event: GameFlowEvent, myTeamId: number) => {
  const isMyTeamWin = event.winningTeamId === myTeamId;
  const isMyTrigger = event.triggerTeamId === myTeamId;
  const teamLabel = isMyTrigger ? "우리 팀" : "상대 팀";

  if (event.type === "TEAMFIGHT") {
    const kills = event.teamfightData!;
    const isBlueMyTeam = myTeamId === 100;
    const allyKills = isBlueMyTeam ? kills.team100Kills : kills.team200Kills;
    const enemyKills = isBlueMyTeam ? kills.team200Kills : kills.team100Kills;

    return {
      title: isMyTeamWin ? "한타 대승" : "한타 패배",
      description: `킬 스코어 ${allyKills} : ${enemyKills}`,
    };
  }

  if (event.type === "OBJECTIVE") {
    const monsterName =
      getObjectiveDisplayName((event as any).monsterType) || "오브젝트";
    return {
      title: `${monsterName} ${isMyTrigger ? "획득" : "내줌"}`,
      description: isMyTrigger
        ? "우리팀이 오브젝트 획득"
        : "상대에게 오브젝트 허용",
    };
  }

  if (event.type === "STRUCTURE") {
    const macro = event.macroData!;
    const laneName = macro.lane || "라인";
    return {
      title: `${laneName} 포탑 파괴`,
      description: `${teamLabel} ${
        macro.formation === "GROUP" ? "본대 힘싸움" : "스플릿 푸시"
      }`,
    };
  }

  return { title: "이벤트", description: "-" };
};

const MatchCombat = ({ gameFlow, myTeamId }: MatchCombatProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FlowEventType | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"START" | "RESULT">("START");

  if (!gameFlow || gameFlow.length === 0) {
    return <div className="text-center p-10 text-text-3">데이터 없음</div>;
  }

  if (!selectedEventId && gameFlow.length > 0) {
    setSelectedEventId(gameFlow[0].id);
  }

  useEffect(() => {
    setViewMode("START");
  }, [selectedEventId]);

  const filteredEvents = useMemo(() => {
    if (filter === "ALL") return gameFlow;
    return gameFlow.filter((e) => e.type === filter);
  }, [gameFlow, filter]);

  const currentEvent = useMemo(
    () => gameFlow.find((e) => e.id === selectedEventId) || gameFlow[0],
    [gameFlow, selectedEventId]
  );

  const positionsToShow =
    viewMode === "START"
      ? currentEvent.playerPositions
      : currentEvent.deadPositions || [];

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4">
      {/* [좌측] 이벤트 리스트 */}
      <div className="flex-1 flex flex-col bg-slate-800 rounded-lg shadow-md overflow-hidden h-[685px]">
        <div className="flex p-3 gap-2 border-b border-slate-700 shrink-0">
          {(["ALL", "TEAMFIGHT", "OBJECTIVE", "STRUCTURE"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === type
                    ? "bg-primary text-white"
                    : "bg-slate-700 text-text-3"
                }`}
              >
                {type === "ALL"
                  ? "전체"
                  : type === "TEAMFIGHT"
                  ? "교전"
                  : type === "OBJECTIVE"
                  ? "오브젝트"
                  : "운영"}
              </button>
            )
          )}
        </div>

        {/* 리스트 아이템 렌더링 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scroll">
          {filteredEvents.map((event) => {
            const isSelected = selectedEventId === event.id;
            const minutes = Math.floor(event.timestamp / 60000);
            const seconds = Math.floor((event.timestamp % 60000) / 1000)
              .toString()
              .padStart(2, "0");
            const isMyWin = event.winningTeamId === myTeamId;
            const { title, description } = generateEventText(event, myTeamId);

            const borderClass = isSelected
              ? "border-primary bg-slate-700/80"
              : "border-transparent hover:bg-slate-700/30";

            // 한타 vs 오브젝트/타워 구분
            const isTeamfight = event.type === "TEAMFIGHT";

            // 1) 오브젝트/타워일 때 사용할 아이콘 타입 결정
            let iconType: "baron" | "dragon" | "tower" | "herald" | "vilemaw" =
              "baron";
            if (event.type === "STRUCTURE") {
              iconType = "tower";
            } else if (event.type === "OBJECTIVE") {
              const mType = (event as any).monsterType || "";
              if (mType.includes("DRAGON")) iconType = "dragon";
              else if (mType.includes("HERALD") || mType.includes("GRUB"))
                iconType = "herald";
              else if (mType.includes("BARON")) iconType = "baron";
              else iconType = "vilemaw";
            }
            const iconUrl = getObjectiveIconUrl(
              iconType,
              event.winningTeamId === 100
            );

            return (
              <div
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-all ${borderClass}`}
              >
                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                  <span className="text-xs font-mono text-text-3">
                    {minutes}:{seconds}
                  </span>

                  {/* [분기 처리] 한타면 이모지, 아니면 이미지 */}
                  <div className="w-8 h-8 relative flex items-center justify-center">
                    {isTeamfight ? (
                      // 한타: 기존 칼 이모지 (배경색 있음)
                      <div className="w-full h-full rounded-full flex items-center justify-center text-lg bg-red-500/20 text-red-400">
                        ⚔️
                      </div>
                    ) : (
                      // 오브젝트/타워: 이미지 (배경 투명)
                      <Image
                        src={iconUrl}
                        alt={iconType}
                        width={32}
                        height={32}
                        className={`object-contain ${
                          iconType === "tower" ? "scale-105" : "scale-90" //타워 이미지가 작은 이슈
                        }`}
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-text-1 truncate">
                      {title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isMyWin
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {isMyWin ? "이득" : "손해"}
                    </span>
                  </div>
                  <p className="text-xs text-text-3 truncate">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* [우측] 미니맵 + 시야 비교 통합 영역 */}
      <div className="w-full lg:w-[500px] shrink-0 flex flex-col h-[685px] gap-3">
        {/* 미니맵 카드 */}
        <div className="bg-slate-800 rounded-lg p-4 shadow-md">
          {/* 뷰 모드 토글 */}
          <div className="flex justify-end mb-3">
            <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("START")}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === "START"
                    ? "bg-blue-600 text-white"
                    : "text-text-3 hover:bg-slate-700"
                }`}
              >
                전투 배치
              </button>
              <button
                onClick={() => setViewMode("RESULT")}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === "RESULT"
                    ? "bg-red-600 text-white"
                    : "text-text-3 hover:bg-slate-700"
                }`}
              >
                전투 결과 (☠️)
              </button>
            </div>
          </div>

          {/* 미니맵 */}
          <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-black rounded-lg overflow-hidden border-2 border-slate-600 shadow-inner">
            <Image
              src={MAP_IMAGE_URL}
              alt="Minimap"
              fill
              className="object-cover opacity-80"
            />

            {/* 이벤트 마커 */}
            {currentEvent && (
              <div
                className="absolute z-20 flex items-center justify-center w-8 h-8 -translate-x-1/2 translate-y-1/2 pointer-events-none"
                style={{
                  left: `${(currentEvent.position.x / MAP_SIZE) * 100}%`,
                  bottom: `${(currentEvent.position.y / MAP_SIZE) * 100}%`,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-30 animate-ping"></div>
                <div className="relative text-2xl drop-shadow-md animate-bounce">
                  {currentEvent.type === "TEAMFIGHT"
                    ? "⚔️"
                    : currentEvent.type === "OBJECTIVE"
                    ? "🎯"
                    : "💥"}
                </div>
              </div>
            )}

            {/* 챔피언 위치 */}
            {positionsToShow.map((player: PlayerPosition) => {
              const isAlly = player.teamId === myTeamId;
              const championImgUrl = `https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/${player.championName}.png`;
              const isDeadView = viewMode === "RESULT";

              return (
                <div
                  key={player.participantId}
                  className="absolute w-6 h-6 -translate-x-1/2 translate-y-1/2 z-10 group cursor-help transition-all duration-500 ease-in-out"
                  style={{
                    left: `${(player.x / MAP_SIZE) * 100}%`,
                    bottom: `${(player.y / MAP_SIZE) * 100}%`,
                  }}
                >
                  <div
                    className={`w-full h-full rounded-full overflow-hidden border-2 box-border relative 
                    ${
                      isAlly
                        ? "border-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.8)]"
                        : "border-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]"
                    } 
                    bg-black
                  `}
                  >
                    <Image
                      src={championImgUrl}
                      alt={player.championName}
                      width={24}
                      height={24}
                      className={`object-cover ${
                        isDeadView ? "grayscale opacity-60" : ""
                      }`}
                    />
                  </div>

                  {/* 툴팁 */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 border border-slate-600 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                    <span className={isAlly ? "text-blue-300" : "text-red-300"}>
                      {isAlly ? "아군" : "적군"}
                    </span>{" "}
                    {player.championName} {isDeadView ? "(사망)" : ""}
                  </div>
                </div>
              );
            })}

            {/* 사망자 없음 메시지 */}
            {viewMode === "RESULT" && positionsToShow.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-text-3 text-sm font-bold">
                죽은 플레이어 없음
              </div>
            )}
          </div>

          {/* 범례 */}
          <div className="flex justify-center mt-3">
            <div className="flex gap-6 text-xs text-text-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-blue-400 bg-black"></div>
                <span>아군</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-black"></div>
                <span>적군</span>
              </div>
            </div>
          </div>
        </div>

        {/* 시야 비교 카드 */}
        <div className="flex-1 min-h-[150px]">
          {currentEvent?.visionData ? (
            <WardCompare
              visionData={currentEvent.visionData}
              myTeamId={myTeamId}
            />
          ) : (
            <WardComparePlaceholder />
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCombat;
