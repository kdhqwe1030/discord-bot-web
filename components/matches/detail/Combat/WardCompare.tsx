import { GameFlowEvent } from "@/types/analysis";

const WardCompare = ({
  visionData,
  myTeamId,
}: {
  visionData: NonNullable<GameFlowEvent["visionData"]>;
  myTeamId: number;
}) => {
  const my = myTeamId === 100 ? visionData.team100 : visionData.team200;
  const enemy = myTeamId === 100 ? visionData.team200 : visionData.team100;

  const StatRow = ({
    label,
    a,
    b,
  }: {
    label: string;
    a: number;
    b: number;
  }) => {
    const diff = a - b;
    const diffText = diff === 0 ? "±0" : diff > 0 ? `+${diff}` : `${diff}`;
    const diffClass =
      diff === 0 ? "text-text-3" : diff > 0 ? "text-blue-300" : "text-red-300";

    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <div className="text-left font-bold text-text-1">{a}</div>

        <div className="text-center">
          <div className="text-[10px] text-text-3">{label}</div>
          <div className={`text-xs font-bold ${diffClass}`}>{diffText}</div>
        </div>

        <div className="text-right font-bold text-text-1">{b}</div>
      </div>
    );
  };

  return (
    <div className="h-full rounded-xl border border-slate-700 bg-slate-800 shadow-md p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-text-1">시야 비교</div>
        <div className="text-[10px] text-text-3">이벤트 시점 기준</div>
      </div>

      {/* 팀 라벨 */}
      <div className="grid grid-cols-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs font-semibold text-blue-200">우리팀</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs font-semibold text-red-200">상대팀</span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </div>
      </div>

      {/* 지표 */}
      <div className="space-y-1">
        <StatRow label="와드 설치" a={my.placed} b={enemy.placed} />
        <StatRow label="와드 제거" a={my.killed} b={enemy.killed} />
      </div>
    </div>
  );
};

export default WardCompare;
