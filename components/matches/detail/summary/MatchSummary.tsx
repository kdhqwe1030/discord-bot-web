import MatchDetailHeader from "./Header/MatchDetailHeader";
import MatchDetailRow from "../MatchDetailRow";
import TeamAnalysisHeader from "./Header/TeamAnalysisHeader";
import { MatchDetailProps, Participant } from "../type";

const MatchSummary = ({
  matchData,
  winnerTeamId,
  groupWin,
  matchDuration,
}: MatchDetailProps) => {
  const participants: Participant[] = matchData?.info?.participants;

  if (!participants || participants.length === 0) return null;

  // 그룹에 해당하는 팀이 위로 올 수 있도록
  const groupTeamId = groupWin
    ? winnerTeamId === participants[0].teamId
      ? participants[0].teamId
      : participants[5].teamId
    : winnerTeamId === participants[0].teamId
    ? participants[5].teamId
    : participants[0].teamId;

  // 전체 참가자 기준 max 데미지 계산
  const maxDamage = Math.max(
    ...participants.map((p) => p.totalDamageDealtToChampions || 0)
  );
  const maxDamageTaken = Math.max(
    ...participants.map((p) => p.totalDamageTaken || 0)
  );

  const firstGroup = participants.filter((x) => x.teamId === groupTeamId);
  const secondGroup = participants.filter((x) => x.teamId !== groupTeamId);

  // 첫 번째 그룹의 승리 여부 및 팀 ID
  const isFirstGroupWinner =
    firstGroup.length > 0 && firstGroup[0].teamId === winnerTeamId;
  const firstGroupTeamId = firstGroup.length > 0 ? firstGroup[0].teamId : 0;

  // 두 번째 그룹의 승리 여부 및 팀 ID
  const isSecondGroupWinner =
    secondGroup.length > 0 && secondGroup[0].teamId === winnerTeamId;
  const secondGroupTeamId = secondGroup.length > 0 ? secondGroup[0].teamId : 0;
  return (
    <div className="w-full rounded-lg shadow px-1 flex flex-col overflow-y-auto ">
      <MatchDetailHeader
        teamId={firstGroupTeamId}
        isWinner={isFirstGroupWinner}
      />
      {firstGroup.map((player) => (
        <MatchDetailRow
          key={player.puuid}
          player={player}
          isWinner={player.teamId === winnerTeamId}
          maxDamage={maxDamage}
          maxDamageTaken={maxDamageTaken}
          matchDuration={matchDuration}
        />
      ))}
      <TeamAnalysisHeader matchData={matchData} groupTeamId={groupTeamId} />
      <MatchDetailHeader
        teamId={secondGroupTeamId}
        isWinner={isSecondGroupWinner}
      />
      {secondGroup.map((player) => (
        <MatchDetailRow
          key={player.puuid}
          player={player}
          isWinner={player.teamId === winnerTeamId}
          maxDamage={maxDamage}
          maxDamageTaken={maxDamageTaken}
          matchDuration={matchDuration}
        />
      ))}
    </div>
  );
};

export default MatchSummary;
