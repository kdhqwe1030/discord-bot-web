"use client";

import { GrowthAnalysisResponse } from "@/types/analysis";
import GrowthGraph from "./section/GrowthGraph";
import LineStatistics from "./section/LineStatistics";

interface GrowthGraphProps {
  growthData: GrowthAnalysisResponse | null;
}
const MatchGrowth = ({ growthData }: GrowthGraphProps) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <GrowthGraph growthData={growthData} />
      <LineStatistics playerData={growthData?.laning} />
    </div>
  );
};

export default MatchGrowth;
