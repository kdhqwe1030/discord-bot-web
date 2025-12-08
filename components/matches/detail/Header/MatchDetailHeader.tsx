const MatchDetailHeader = ({
  teamId,
  isWinner,
}: {
  teamId: number;
  isWinner: boolean;
}) => {
  return (
    <div
      className={`grid grid-cols-[2.5fr_0.8fr_1.8fr_1fr_0.6fr_2fr] gap-3 p-2 rounded-md ${
        isWinner ? "bg-win/20 text-win" : "bg-lose/20 text-lose"
      } font-bold text-sm mb-1 mt-3`}
    >
      {/* 1. 챔피언 + 스펠 + 이름 */}
      <div className="flex items-end gap-2 text-left">
        <span className="text-sm">{isWinner ? "승리" : "패배"}</span>
        <span className="text-xs text-text-3">
          {teamId === 100 ? "블루팀" : "레드팀"}
        </span>
      </div>

      {/* 2. KDA + 킬관여 */}
      <div className="text-center">KDA</div>

      {/* 3. 가한 피해 / 받은 피해 */}
      <div className="text-center">피해량</div>

      {/* 4. 성장 지표 (CS & 골드) */}
      <div className="text-center">성장</div>

      {/* 5. 시야 관련 : 와드 / 점수 */}
      <div className="text-center">시야</div>

      {/* 6. 아이템 */}
      <div className="text-center">아이템</div>
    </div>
  );
};

export default MatchDetailHeader;
