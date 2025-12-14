"use client";
import ChmpionImg from "@/components/matches/ChmpionImg";
import { useState } from "react";
import { LaningPhaseStats } from "@/types/analysis";

interface LineStatisticsProps {
  playerData: LaningPhaseStats;
  myTeamId: number; // ⭐️ 추가: 기준이 될 팀 ID
}
const LineStatistics = ({ playerData, myTeamId }: LineStatisticsProps) => {
  const [section, setSection] = useState<"gold" | "xp" | "cs">("gold");

  const tabs = [
    { key: "gold", label: "골드" },
    { key: "xp", label: "경험치" },
    { key: "cs", label: "CS" },
  ] as const;

  const order = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

  // section -> 실제 필드명
  const getStatField = (s: typeof section) => {
    if (s === "gold") return "gold";
    if (s === "xp") return "xp";
    return "cs";
  };

  return (
    <div className="w-full space-y-4 bg-slate-800 rounded-lg p-4 shadow-md">
      {/* 탭 */}
      <div className="flex gap-2 mb-2 justify-between">
        <div className="flex items-center gap-2">
          <h1>라인전 결과</h1>
          <span className="text-text-3 text-xs">
            (포탑 방패가 소멸하는 14분 시점의 성장 격차입니다)
          </span>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSection(tab.key)}
              className={
                section === tab.key
                  ? "bg-primary/20 px-2 py-1 text-xs border-2 border-primary rounded-xl"
                  : "px-2 py-1 text-xs border-2 border-border rounded-xl "
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 라인별 렌더링 */}
      {order.map((lane) => {
        const laneData = playerData[lane];
        // 데이터가 없으면 스킵 (혹은 에러처리)
        if (!laneData) return null;

        // 1. 내 팀인지 판별 (100팀이 블루)
        const isBlue = myTeamId === 100;

        // 2. 왼쪽(우리팀) / 오른쪽(상대팀) 데이터 매핑
        const myPlayer = isBlue ? laneData.team100 : laneData.team200;
        const enemyPlayer = isBlue ? laneData.team200 : laneData.team100;

        // 3. 선택된 스탯 값 추출
        const field = getStatField(section);
        const myValue = myPlayer[field];
        const enemyValue = enemyPlayer[field];

        // 4. 차이 계산 (DB의 diff는 100 - 200 기준)
        // 내가 100팀이면 diff 그대로, 200팀이면 부호 반대로(-diff)
        const rawDiff = laneData.diff[section];
        const displayDiff = isBlue ? rawDiff : -rawDiff;

        // 5. UI용 변수 계산
        const isPositive = displayDiff >= 0; // 양수면 우리팀(왼쪽) 우세
        const absDiff = Math.abs(displayDiff);

        // 막대 그래프 비율 계산 (이전 로직 유지: 최소값 기준 스케일링)
        // 분모가 0이 되는 것 방지
        const base = Math.min(myValue, enemyValue) || 1;
        const total = base / 3;

        // 너무 그래프가 꽉 차지 않게 50% 제한 등 조정
        // (값이 크면 바가 길어짐)
        const percent = total > 0 ? Math.min((absDiff / total) * 50, 50) : 0;

        return (
          <div
            key={lane}
            className="py-2 border-b border-slate-700/50 last:border-0"
          >
            <div className="flex items-center gap-3">
              {/* [LEFT] 우리 팀 플레이어 */}
              <div className="flex-1 flex gap-2 items-center">
                <ChmpionImg
                  championName={myPlayer.championName}
                  size={8}
                  level={myPlayer.level}
                />
                <div className="flex flex-col shrink-0 min-w-0">
                  <span className="text-xs font-bold text-text-2 truncate">
                    {myPlayer.playerName || "Unknown"}
                    <span className="text-[10px] text-text-4 font-normal ml-1">
                      #{myPlayer.playerTag}
                    </span>
                  </span>
                  <div className="flex gap-2 text-xs text-text-4">
                    <span>{myPlayer.championName}</span>
                    {/* 수치 표시 (선택사항) */}
                    <span className="text-win">{myValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 가운데 바 (고정 너비) */}
              <div className="w-84 shrink-0 flex flex-col gap-1">
                <h3 className="text-xs font-semibold text-text-3 mb-1 text-center">
                  {lane}
                </h3>

                <div className="relative h-2 rounded-full bg-surface-3 overflow-hidden">
                  {/* 중앙 기준선 */}
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600 z-10" />

                  {/* 데이터 바 */}
                  <div
                    className={`absolute inset-y-0 transition-all duration-500 ${
                      isPositive ? "bg-blue-500" : "bg-red-500"
                    }`}
                    style={{
                      // isPositive(우리 우세) -> 중앙에서 왼쪽으로 뻗음
                      // !isPositive(상대 우세) -> 중앙에서 오른쪽으로 뻗음
                      left: isPositive ? `${50 - percent}%` : "50%",
                      width: `${percent}%`,
                    }}
                  />
                </div>

                <div className="text-[10px] text-center font-mono h-4 flex items-center justify-center">
                  {displayDiff === 0 ? (
                    <span className="text-text-3">Equal</span>
                  ) : (
                    <span className={isPositive ? "text-win" : "text-lose"}>
                      {isPositive ? "+" : ""}
                      {displayDiff.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* [RIGHT] 상대 팀 플레이어 */}
              <div className="flex-1 flex gap-2 items-center justify-end text-right">
                <div className="flex flex-col shrink-0 items-end min-w-0">
                  <span className="text-xs font-bold text-text-2">
                    {enemyPlayer.playerName || "Unknown"}
                    <span className="text-[10px] text-text-4 font-normal ml-1">
                      #{enemyPlayer.playerTag}
                    </span>
                  </span>
                  <div className="flex gap-2 text-xs text-text-4 justify-end">
                    <span className="text-lose">
                      {enemyValue.toLocaleString()}
                    </span>
                    <span>{enemyPlayer.championName}</span>
                  </div>
                </div>
                <ChmpionImg
                  championName={enemyPlayer.championName}
                  size={8}
                  level={enemyPlayer.level}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LineStatistics;
