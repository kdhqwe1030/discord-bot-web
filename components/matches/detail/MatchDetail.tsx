import { MatchDetailProps, Participant } from "./type";
import MatchSummary from "./summary/MatchSummary";
import { useState } from "react";
import MatchMacro from "./Macro/MatchMacro";
import MatchCombat from "./Combat/MatchCombat";
import MatchGrowth from "./Growth/MatchGrowth";

const MatchDetail = ({
  matchData,
  winnerTeamId,
  groupWin,
  matchDuration,
}: MatchDetailProps) => {
  const [section, setSection] = useState<
    "summary" | "GroWth" | "Combat" | "Macro"
  >("summary");

  const tabs = [
    { key: "summary", label: "종합" },
    { key: "GroWth", label: "성장" },
    { key: "Combat", label: "전투" },
    { key: "Macro", label: "운영" },
  ] as const;

  const components = {
    summary: (
      <MatchSummary
        matchData={matchData}
        winnerTeamId={winnerTeamId}
        groupWin={groupWin}
        matchDuration={matchDuration}
      />
    ),
    GroWth: <MatchGrowth />,
    Combat: <MatchCombat />,
    Macro: <MatchMacro />,
  };

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="grid grid-cols-4 gap-8 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSection(tab.key)}
            className={
              section === tab.key
                ? "bg-primary/20 rounded-md p-1 transition-colors"
                : ""
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 컴포넌트 렌더링 */}
      {components[section]}
    </div>
  );
};

export default MatchDetail;
