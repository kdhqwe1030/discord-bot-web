const MatchDetailHeader = ({
  teamId,
  isWinner,
}: {
  teamId: number;
  isWinner: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md ${
        isWinner ? "bg-win/20 text-win" : "bg-lose/20 text-lose"
      } font-bold text-sm mb-1 mt-3`}
    >
      {/* 1. 챔피언 + 스펠 + 이름 : 고정폭 */}
      <div className="flex items-end gap-2 w-64 shrink-0 text-left">
        <span className="text-sm">{isWinner ? "승리" : "패배"}</span>
        <span className="text-xs text-text-3">
          {teamId === 100 ? "블루팀" : "레드팀"}
        </span>
      </div>

      {/* 2. KDA + 킬관여 : 고정폭 */}
      <div className="w-32 text-center shrink-0">KDA</div>

      {/* 3. 가한 피해 / 받은 피해 : 바 + 숫자 (폭 고정) */}
      <div className="w-56 text-center shrink-0">피해량</div>

      {/* 4. 성장 지표 (CS & 골드) */}
      <div className="w-20 text-center shrink-0">성장</div>

      {/* 5. 시야 관련 : 와드 / 점수 */}
      <div className="w-28 text-center shrink-0">시야</div>

      {/* 6. 아이템 : 항상 같은 자리 */}
      <div className="ml-auto w-64 text-center">아이템</div>
    </div>
  );
};

export default MatchDetailHeader;
