"use client";
import ChmpionImg from "@/components/matches/ChmpionImg";
import { useState } from "react";

const LineStatistics = ({ playerData }: { playerData: any }) => {
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

      {/* 라인별 */}
      {order.map((lane) => {
        const laneData = playerData[lane];
        if (!laneData) return null;

        const field = getStatField(section);

        const ourValue = laneData.ourPlayer[field];
        const oppValue = laneData.opponentPlayer[field];

        const diffValue: number = laneData.diff[section];
        const isPositive = diffValue >= 0; // 우리 팀이 앞서면 +
        const abs = Math.abs(diffValue);

        const total = Math.min(ourValue, oppValue) / 3;
        // 이 라인에서의 총량 대비 차이 비율 (0 ~ 50%)
        const percent = total > 0 ? (abs / total) * 50 : 0;

        return (
          <div key={lane} className="py-1 border-b border-border/40">
            <div className="flex items-center gap-3">
              {/* 우리 팀 (왼쪽) */}
              <div className="flex-1 flex gap-2 items-center">
                <ChmpionImg
                  championName={laneData.ourPlayer.championName}
                  size={8}
                  level={laneData.ourPlayer.level}
                />
                <div className="flex flex-col shrink-0">
                  <span className="text-xs font-bold text-text-2">
                    {laneData.ourPlayer.playerName || "Unknown"}
                    <span className="text-xs text-text-4 font-normal">
                      #{laneData.ourPlayer.playerTag}
                    </span>
                  </span>
                  <span className="text-xs text-text-4">
                    {laneData.ourPlayer.championName}
                  </span>
                </div>
              </div>

              {/* 가운데 바 (고정 너비) */}
              <div className="w-84 shrink-0 flex flex-col gap-1">
                <h3 className="text-xs font-semibold text-text-3 mb-1 text-center">
                  {lane}
                </h3>

                <div className="relative h-2 rounded-full bg-surface-3 overflow-hidden">
                  {/* 중앙 기준선 */}
                  <div className="absolute inset-y-0 left-1/2 w-px bg-border/60" />
                  {/* diff 바 */}
                  <div
                    className={`absolute inset-y-0 ${
                      isPositive ? "bg-win" : "bg-lose"
                    }`}
                    style={{
                      //  +면 왼쪽(우리쪽)으로, -면 오른쪽(상대쪽)으로
                      left: isPositive
                        ? `${50 - percent}%` // center에서 왼쪽으로
                        : "50%", // center에서 오른쪽으로
                      width: `${percent}%`,
                    }}
                  />
                </div>

                <div className="text-[11px] text-center text-text-3">
                  {diffValue === 0 ? (
                    "동일"
                  ) : (
                    <>
                      {diffValue > 0 ? "+" : ""}
                      {diffValue} {section.toUpperCase()}
                    </>
                  )}
                </div>
              </div>

              {/* 상대 팀 (오른쪽) */}
              <div className="flex-1 flex gap-2 items-center justify-end">
                <div className="flex flex-col shrink-0 items-end">
                  <span className="text-xs font-bold text-text-2">
                    {laneData.opponentPlayer.playerName || "Unknown"}
                    <span className="text-xs text-text-4 font-normal">
                      {" "}
                      #{laneData.opponentPlayer.playerTag}
                    </span>
                  </span>
                  <span className="text-xs text-text-4">
                    {laneData.opponentPlayer.championName}
                  </span>
                </div>
                <ChmpionImg
                  championName={laneData.opponentPlayer.championName}
                  size={8}
                  level={laneData.opponentPlayer.level}
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
