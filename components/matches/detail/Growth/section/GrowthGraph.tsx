"use client";

import { useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
  Plugin,
  ChartEvent,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { GrowthAnalysisResponse } from "@/types/analysis";
import { getObjectiveIconUrl } from "@/utils/lolImg";
import { getObjectiveDisplayName } from "@/utils/lolParseString";
import { GrowthGraphProps } from "../MatchGrowth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// OBJECTIVE 이벤트 타입
type ObjectiveEvent = {
  minute: number;
  type: string;
  isMyTeam: boolean;
  timestamp: number;
};

type IconHitBox = {
  x: number;
  y: number;
  size: number;
  minute: number;
  timestamp: number;
};

const GrowthGraph = ({ growthData, myTeamId }: GrowthGraphProps) => {
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [selectedObjectiveTs, setSelectedObjectiveTs] = useState<number | null>(
    null
  );

  // 아이콘 실제 위치(hitbox) 저장
  const iconHitBoxesRef = useRef<IconHitBox[]>([]);
  //아이콘 애니메이션 관련
  const hoveredIconTsRef = useRef<number | null>(null);
  const iconYOffsetRef = useRef<Map<number, number>>(new Map()); // timestamp -> yOffset
  const rafRef = useRef<number | null>(null);

  if (!growthData || !growthData.graph || growthData.graph.length === 0) {
    return (
      <div className="text-center p-4 text-text-3">데이터가 없습니다.</div>
    );
  }

  const graphData = growthData.graph;
  const labels = graphData.map((d) => `${d.minute}분`);
  const isBlueTeam = myTeamId === 100;

  const goldDiffData = graphData.map((d) =>
    isBlueTeam ? d.goldDiff : -d.goldDiff
  );

  const maxAbsValue = Math.max(...goldDiffData.map((v) => Math.abs(v)));

  // 1) 기본 limit (데이터 기준 + 약간 margin) — 1000 단위로 올림
  const baseLimit =
    maxAbsValue === 0 ? 1000 : Math.ceil((maxAbsValue * 1.1) / 1000) * 1000;

  // 2) 아래 여유를 위해 살짝 더 키운 값
  const marginFactor = 1.5; // 필요하면 숫자 조절
  const extendedLimit = baseLimit * marginFactor;

  // 3) 원하는 세로 줄 개수
  const desiredTickCount = 7;
  const span = extendedLimit * 2;
  const rawStep = span / (desiredTickCount - 1);
  const stepSize = Math.round(rawStep / 1000) * 1000 || 1000; // 최소 1000 보장

  // 4) stepSize의 “배수”에 맞게 최종 limit 맞추기 → 0이 반드시 tick에 포함됨
  const stepCount = Math.ceil(extendedLimit / stepSize);
  const finalLimit = stepCount * stepSize;

  // 항상 우리팀: 파랑 / 상대: 빨강
  const myTeamColor = "rgb(59, 130, 246)";
  const enemyTeamColor = "rgb(239, 68, 68)";
  const myTeamBg = "rgba(59, 130, 246, 0.2)";
  const enemyTeamBg = "rgba(239, 68, 68, 0.2)";

  // OBJECTIVE 이벤트 추출 (타입 에러 방지용 기본값 포함)

  const rawObjectEvents: ObjectiveEvent[] = graphData
    .flatMap((d) =>
      d.events
        .filter((e) => e.type === "OBJECTIVE" && e.monsterType)
        .map((e) => ({
          minute: d.minute,
          type: e.monsterType ?? "UNKNOWN",
          isMyTeam: e.triggerTeamId === myTeamId,
          timestamp: e.timestamp,
        }))
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  const OBJECTIVE_MARKER_COOLDOWN = 60 * 1000; // 1분

  const objectEvents: ObjectiveEvent[] = [];
  let lastMarkerTs: number | null = null;

  for (const obj of rawObjectEvents) {
    if (
      lastMarkerTs === null ||
      obj.timestamp - lastMarkerTs >= OBJECTIVE_MARKER_COOLDOWN
    ) {
      objectEvents.push(obj);
      lastMarkerTs = obj.timestamp;
    }
  }
  // 커스텀 플러그인: 아이콘 + 히트박스 그리기
  const objectIconsPlugin: Plugin<"line"> = {
    id: "objectIcons",

    afterInit: (chart) => {
      const onMove = (evt: MouseEvent) => {
        const rect = chart.canvas.getBoundingClientRect();
        const mx = evt.clientX - rect.left;
        const my = evt.clientY - rect.top;

        const hit = iconHitBoxesRef.current.find((b) => {
          return (
            mx >= b.x && mx <= b.x + b.size && my >= b.y && my <= b.y + b.size
          );
        });

        hoveredIconTsRef.current = hit ? hit.timestamp : null;
      };

      const onLeave = () => {
        hoveredIconTsRef.current = null;
      };

      chart.canvas.addEventListener("mousemove", onMove);
      chart.canvas.addEventListener("mouseleave", onLeave);

      // cleanup 저장
      (chart as any)._objIconOnMove = onMove;
      (chart as any)._objIconOnLeave = onLeave;
    },

    beforeDestroy: (chart) => {
      const onMove = (chart as any)._objIconOnMove;
      const onLeave = (chart as any)._objIconOnLeave;
      if (onMove) chart.canvas.removeEventListener("mousemove", onMove);
      if (onLeave) chart.canvas.removeEventListener("mouseleave", onLeave);
    },

    afterDraw: (chart) => {
      const {
        ctx,
        chartArea,
        scales: { x, y },
      } = chart as any;

      if (!chartArea) return;

      // ---- 애니메이션 업데이트 (lerp) ----
      const HOVER_UP = -4;
      const SELECT_UP = -8;
      const LERP = 0.2;

      let needRedraw = false;

      for (const obj of objectEvents) {
        const key = obj.timestamp;
        const current = iconYOffsetRef.current.get(key) ?? 0;

        const isHovered = hoveredIconTsRef.current === key;
        const isSelected = selectedObjectiveTs === key;

        const target = isSelected ? SELECT_UP : isHovered ? HOVER_UP : 0;
        const next = current + (target - current) * LERP;

        if (Math.abs(next - current) > 0.1) needRedraw = true;
        iconYOffsetRef.current.set(key, next);
      }

      if (needRedraw) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => chart.draw());
      }

      // ---- 아이콘 실제 그리기 ----
      iconHitBoxesRef.current = [];

      objectEvents.forEach((obj) => {
        const xPos = x.getPixelForValue(obj.minute);
        const baseY = y.bottom;

        const rawType = obj.type.toLowerCase();
        const typeKey = rawType.includes("dragon")
          ? "dragon"
          : rawType.includes("baron")
          ? "baron"
          : rawType.includes("herald")
          ? "herald"
          : rawType.includes("atakhan")
          ? "vilemaw"
          : "herald";

        const img = new Image();
        img.src = getObjectiveIconUrl(typeKey as any, obj.isMyTeam);

        const size = 16;
        const yOffset = iconYOffsetRef.current.get(obj.timestamp) ?? 0;

        const iconX = xPos - size / 2;
        const iconY = baseY - size - 5 + yOffset;

        // hitbox도 움직인 위치 기준으로 저장 (중요!)
        iconHitBoxesRef.current.push({
          x: iconX,
          y: iconY,
          size,
          minute: obj.minute,
          timestamp: obj.timestamp,
        });

        const draw = () => {
          ctx.save();

          const padding = 4;
          const radius = 5;
          const w = size + padding * 2;
          const h = size + padding * 2;
          const bx = xPos - w / 2;
          const by = iconY - padding;

          const isHovered = hoveredIconTsRef.current === obj.timestamp;
          const isSelected = selectedObjectiveTs === obj.timestamp;

          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.strokeStyle = obj.isMyTeam ? "#3b82f6" : "#f97373";
          ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;

          ctx.beginPath();
          ctx.moveTo(bx + radius, by);
          ctx.lineTo(bx + w - radius, by);
          ctx.quadraticCurveTo(bx + w, by, bx + w, by + radius);
          ctx.lineTo(bx + w, by + h - radius);
          ctx.quadraticCurveTo(bx + w, by + h, bx + w - radius, by + h);
          ctx.lineTo(bx + radius, by + h);
          ctx.quadraticCurveTo(bx, by + h, bx, by + h - radius);
          ctx.lineTo(bx, by + radius);
          ctx.quadraticCurveTo(bx, by, bx + radius, by);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.drawImage(img, iconX, iconY, size, size);
          ctx.restore();
        };

        if (img.complete) draw();
        else
          img.onload = () => {
            draw();
            chart.draw();
          };
      });
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: "골드 격차",
        data: goldDiffData,
        borderWidth: 2,
        pointHoverRadius: 6,
        borderColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return "#888";
          return getGradient(ctx, chartArea, myTeamColor, enemyTeamColor);
        },
        backgroundColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return "transparent";
          return getGradient(ctx, chartArea, myTeamBg, enemyTeamBg);
        },
        fill: {
          target: "origin",
          above: myTeamBg,
          below: enemyTeamBg,
        },
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    // 차트 클릭 시 아이콘 여부 체크 (토글)
    onClick: (event: ChartEvent, _elements, chart) => {
      if (!event.native) return;
      const mouseEvent = event.native as unknown as MouseEvent;

      const rect = chart.canvas.getBoundingClientRect();
      const clickX = mouseEvent.clientX - rect.left;
      const clickY = mouseEvent.clientY - rect.top;

      const hit = iconHitBoxesRef.current.find((box) => {
        return (
          clickX >= box.x &&
          clickX <= box.x + box.size &&
          clickY >= box.y &&
          clickY <= box.y + box.size
        );
      });

      if (!hit) return;
      setSelectedMinute(hit.minute);

      setSelectedObjectiveTs(hit.timestamp);

      // 같은 분 한 번 더 클릭하면 토글로 닫기
      if (selectedMinute === hit.minute) {
        setSelectedMinute(null);
        setSelectedObjectiveTs(null);
      } else {
        setSelectedMinute(hit.minute);
        setSelectedObjectiveTs(hit.timestamp);
      }
    },

    layout: {
      padding: {
        bottom: 32,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          borderColor: "#4B5563",
        } as any,
        ticks: {
          color: "#9CA3AF",
          maxTicksLimit: 8,
        },
      },
      y: {
        min: -finalLimit,
        max: finalLimit,
        grid: {
          color: (context: any) =>
            context.tick.value === 0 ? "#6a6a6a" : "#374151",
          lineWidth: (context: any) => (context.tick.value === 0 ? 2 : 1),
        },
        ticks: {
          color: "#9CA3AF",
          stepSize,
          callback: (value: any) => {
            if (value === 0) return "0";
            if (Math.abs(value) >= 1000) {
              return (value / 1000).toFixed(1) + "k";
            }
            return value;
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#F9FAFB",
        bodyColor: "#D1D5DB",
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            const label =
              val > 0 ? "우리 팀 우세" : val < 0 ? "상대 팀 우세" : "동점";
            return `${label}: ${Math.abs(val).toLocaleString()} Gold`;
          },
        },
      },
    },
  };

  const selectedMinuteData =
    selectedMinute != null
      ? graphData.find((d) => d.minute === selectedMinute)
      : null;

  type GrowthEvent = GrowthAnalysisResponse["graph"][number]["events"][number];
  const RANGE_MS = 60 * 1000; // 1분

  const rangedEvents =
    selectedObjectiveTs != null
      ? graphData.flatMap((d) =>
          d.events.filter(
            (e) => Math.abs(e.timestamp - selectedObjectiveTs) <= RANGE_MS
          )
        )
      : [];
  // const minuteEvents: GrowthEvent[] = selectedMinuteData?.events ?? [];
  const minuteEvents = rangedEvents;

  const killEvents = minuteEvents.filter((e) => e.type === "KILL");
  const objectiveEvents = minuteEvents.filter((e) => e.type === "OBJECTIVE");
  const towerEvents = minuteEvents.filter((e) => e.type === "TURRET"); // 네 타입 이름에 맞게 수정
  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 shadow-md">
      <h3 className="text-text-1 font-bold mb-2">골드 격차 그래프</h3>

      {/* 그래프 */}
      <div className="w-full h-[250px]">
        <Line options={options} data={data} plugins={[objectIconsPlugin]} />
      </div>

      {/* 차트 아래 붙는 이벤트 상세 패널 */}
      {selectedMinuteData && (
        <div className="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm space-y-3">
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between ">
            <p className="text-text-1 font-semibold ">
              {selectedMinuteData.minute}분 타임라인 분석
            </p>

            <button
              className="text-text-3 hover:text-text-1 transition-colors"
              onClick={() => setSelectedMinute(null)}
            >
              ✕
            </button>
          </div>

          {/* 좌우 컬럼: 우리 / 상대 공통 로직 */}
          <div className="mt-2 grid grid-cols-2 gap-4">
            {(["our", "enemy"] as const).map((side) => {
              const isMyTeam = side === "our";
              const checkIsMyEvent = (teamId: number) => teamId === myTeamId;

              const sideObjective = objectiveEvents.filter(
                (e) => checkIsMyEvent(e.triggerTeamId) === isMyTeam
              );
              const sideKills = killEvents.filter(
                (e) => checkIsMyEvent(e.triggerTeamId) === isMyTeam
              );
              // 포탑 파괴(TURRET)는 triggerTeamId가 '깬 팀'이므로 그대로 비교
              const sideTowers = towerEvents.filter(
                (e) => checkIsMyEvent(e.triggerTeamId) === isMyTeam
              );

              const killCount = sideKills.length;
              const towerCount = sideTowers.length;

              const hasAny =
                sideObjective.length > 0 || killCount > 0 || towerCount > 0;

              const badgeLabel = isMyTeam ? "우리 팀 이득" : "상대 팀 이득";
              const badgeClass = isMyTeam
                ? "bg-blue-500/20 text-blue-300"
                : "bg-red-500/20 text-red-300";
              const teamLabel = isMyTeam ? "우리 팀" : "상대 팀";
              const teamTextClass = isMyTeam ? "text-blue-400" : "text-red-400";
              const objectiveTitleClass = isMyTeam
                ? "text-blue-300"
                : "text-red-300";

              return (
                <div key={side} className="space-y-2">
                  {/* 상단 배지 */}
                  <p
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${badgeClass}`}
                  >
                    {badgeLabel}
                  </p>

                  {!hasAny && (
                    <p className="text-xs text-text-3">
                      이 분에는 {badgeLabel}이 없습니다.
                    </p>
                  )}
                  <div className="grid grid-cols-2 px-1">
                    <div>
                      {/* 오브젝트: 개별 로그 그대로 */}
                      {sideObjective.length > 0 && (
                        <div>
                          <p
                            className={`text-xs font-semibold mb-1 ${objectiveTitleClass}`}
                          >
                            오브젝트
                          </p>
                          <ul className="space-y-1">
                            {sideObjective.map((e, idx) => (
                              <li
                                key={`${side}-obj-${idx}`}
                                className="flex items-center gap-2 text-xs text-text-2"
                              >
                                <span className={teamTextClass}>
                                  {teamLabel}
                                </span>
                                <span>
                                  {getObjectiveDisplayName(e.monsterType)} 획득
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* 포탑: 리스트 대신 횟수만 */}
                      {towerCount > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-fuchsia-300 mb-1 mt-1">
                            포탑 / 건물
                          </p>
                          <p className="text-xs text-text-2">
                            <span className={`${teamTextClass} font-semibold`}>
                              {teamLabel}
                            </span>
                            <span> 포탑 파괴 x {towerCount}회</span>
                          </p>
                        </div>
                      )}
                    </div>
                    {/* 킬: 리스트 대신 횟수만 */}
                    {killCount > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-300 mb-1">
                          ⚔️
                        </p>
                        <p className="text-xs text-text-2">
                          <span className={teamTextClass}>{teamLabel}</span>
                          <span>이 챔피언 처치 x {killCount}회 </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 아무 이벤트 없을 때 (양쪽 다 비었을 때) */}
          {minuteEvents.length === 0 && (
            <p className="text-xs text-text-3">
              이 분에는 기록된 주요 이벤트가 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GrowthGraph;
// 그라데이션 함수
function getGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: any,
  topColor: string,
  bottomColor: string
) {
  const { top, bottom } = chartArea;
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);

  // 위쪽 (우리 팀 영역)
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.5, topColor);

  // 아래쪽 (상대 팀 영역)
  gradient.addColorStop(0.5, bottomColor);
  gradient.addColorStop(1, bottomColor);

  return gradient;
}
