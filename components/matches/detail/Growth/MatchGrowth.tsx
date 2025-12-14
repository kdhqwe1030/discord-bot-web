"use client";

import { GrowthAnalysisResponse } from "@/types/analysis";
import GrowthGraph from "./section/GrowthGraph";
import LineStatistics from "./section/LineStatistics";

export interface GrowthGraphProps {
  growthData: GrowthAnalysisResponse | null;
  myTeamId: number;
}
const MatchGrowth = ({ growthData, myTeamId }: GrowthGraphProps) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <GrowthGraph growthData={growthData} myTeamId={myTeamId} />
      <LineStatistics playerData={growthData!.laning} myTeamId={myTeamId} />
    </div>
  );
};

export default MatchGrowth;
