import TeamObjectives from "./TeamObjectives";
import { TeamStatsProps } from "../type";

const TeamAnalysisHeader = ({ matchData, groupTeamId }: TeamStatsProps) => {
  const teams = matchData?.info?.teams;
  const participants = matchData?.info?.participants;

  if (!teams || !participants) return null;

  // 1. 왼쪽(우리 그룹) 팀과 오른쪽(상대) 팀 찾기
  const leftTeam = teams.find((t: any) => t.teamId === groupTeamId);
  const rightTeam = teams.find((t: any) => t.teamId !== groupTeamId);

  // 2. 통계 계산 함수 (teamId 기반으로 필터링)
  const getTeamStats = (teamId: number) => {
    const teamPlayers = participants.filter((p: any) => p.teamId === teamId);
    const totalGold = teamPlayers.reduce(
      (acc: number, p: any) => acc + p.goldEarned,
      0
    );
    const totalKills = teamPlayers.reduce(
      (acc: number, p: any) => acc + p.kills,
      0
    );
    return { totalGold, totalKills };
  };

  // 3. 통계 데이터 생성 (Left vs Right)
  const leftStats = getTeamStats(leftTeam.teamId);
  const rightStats = getTeamStats(rightTeam.teamId);

  // 그래프 비율
  const totalKill = leftStats.totalKills + rightStats.totalKills;
  const totalGold = leftStats.totalGold + rightStats.totalGold;

  const leftKillRatio =
    totalKill > 0 ? (leftStats.totalKills / totalKill) * 100 : 50;
  const leftGoldRatio =
    totalGold > 0 ? (leftStats.totalGold / totalGold) * 100 : 50;

  // 왼쪽 팀(우리 그룹)이 이겼으면 파랑, 졌으면 빨강
  const leftColorClass = leftTeam.win ? "bg-win" : "bg-lose";
  const leftTextColor = leftTeam.win ? "text-win/80" : "text-lose/80";

  // 오른쪽 팀(상대)은 그 반대
  const rightColorClass = leftTeam.win ? "bg-lose" : "bg-win";
  const rightTextColor = leftTeam.win ? "text-lose/80" : "text-win/80";

  return (
    <div className="w-full rounded-lg p-4 mb-2 text-text-1 flex items-center justify-between shadow-md">
      {/* 왼쪽 팀 오브젝트 */}
      <TeamObjectives team={leftTeam} side="left" win={leftTeam.win} />

      {/* 중앙 그래프 */}
      <div className="flex-1 px-6 flex flex-col gap-2">
        {/* ⚔️ Kill Bar */}
        <div className="w-full">
          <div className="flex justify-between text-sm font-bold mb-1">
            <span className={leftTextColor}>{leftStats.totalKills}</span>
            <span className="text-gray-400 text-xs uppercase font-medium">
              Total Kill
            </span>
            <span className={rightTextColor}>{rightStats.totalKills}</span>
          </div>

          {/* 배경(오른쪽 팀 색) 위에 왼쪽 팀 비율만큼 덮어씌움 */}
          <div
            className={`w-full h-3 rounded-full overflow-hidden flex ${rightColorClass} bg-opacity-80`}
          >
            <div
              className={`h-full ${leftColorClass}`}
              style={{ width: `${leftKillRatio}%` }}
            />
          </div>
        </div>

        {/* 💰 Gold Bar */}
        <div className="w-full">
          <div className="flex justify-between text-sm font-bold mb-1">
            <span className={leftTextColor}>
              {leftStats.totalGold.toLocaleString()}
            </span>
            <span className="text-gray-400 text-xs uppercase font-medium">
              Total Gold
            </span>
            <span className={rightTextColor}>
              {rightStats.totalGold.toLocaleString()}
            </span>
          </div>

          {/* 골드 그래프도 동일한 팀 컬러 로직 적용 (파랑/빨강) */}
          <div
            className={`w-full h-3 rounded-full overflow-hidden flex ${rightColorClass} bg-opacity-80`}
          >
            <div
              className={`h-full ${leftColorClass}`}
              style={{ width: `${leftGoldRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* 오른쪽 팀 오브젝트 */}
      <TeamObjectives team={rightTeam} side="right" win={!leftTeam.win} />
    </div>
  );
};

export default TeamAnalysisHeader;
