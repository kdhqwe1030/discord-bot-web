"use client";
import { FaDiscord } from "react-icons/fa";
import { getRankImageUrl } from "@/utils/lolImg";
import type { Group, MemberWithProfile } from "@/types/group";
import RecordUpdateButton from "@/components/ui/Buttons/RecordUpdateButton";
import { useQuery } from "@tanstack/react-query";
import { groupAPI } from "@/lib/api/group";

interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
}

interface SummarySectionProps {
  group: Group;
  discordGuildInfo: DiscordGuildInfo | null;
  membersWithProfiles: MemberWithProfile[];
}

const SummarySection = ({
  group,
  discordGuildInfo,
  membersWithProfiles,
}: SummarySectionProps) => {
  // 평균 티어 계산 (현재는 첫 번째 티어만 사용)
  const tiers = membersWithProfiles
    .map((m) => m.tierFlex)
    .filter((t): t is string => !!t);

  const avgTier = tiers[0] ?? null;
  const avgTierImg = avgTier
    ? getRankImageUrl({ tierFlex: avgTier, isMini: false })
    : null;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["groupAllCount", group],
    queryFn: () => groupAPI.fetchMatchCount(group.id),
  });
  const winRateColor =
    typeof data?.winRatePercent === "number"
      ? data?.totalMatches !== 0
        ? data?.winRatePercent >= 50
          ? "text-emerald-400" //승률이 50이상인 경우
          : "text-red-400" //승률이 50 미만인 경우
        : "text-text-2" //매치가 0번인 경우
      : "text-text-2"; //defalut

  return (
    <div className="bg-surface-1 border border-border rounded-xl p-4">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-semibold text-text-1">{group.name}</h1>
        {discordGuildInfo && (
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <FaDiscord className="text-discord" />
            <span className="text-text-2">{discordGuildInfo.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-center mt-6 mb-6">
        <div className="shrink-0 flex items-center justify-center">
          {avgTierImg ? (
            <img
              src={avgTierImg}
              alt={avgTier}
              className="w-12 h-12 lg:w-18 lg:h-18 object-contain"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-dashed border-border flex items-center justify-center text-[11px] text-text-3">
              티어 데이터 없음
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div>
            <p className="text-xs text-text-3 mb-0.5">그룹 평균 티어</p>
            <p className="text-lg font-semibold text-text-1">
              {avgTier ?? "-"}
            </p>
          </div>
          <div className="flex justify-between text-[11px] text-text-3">
            <div>
              <p className="mb-0.5">전체 매치 수</p>
              {isLoading || isError ? (
                <p className="font-medium text-text-2 ">-</p>
              ) : (
                <p className="font-medium text-text-2 text-xl">
                  {data?.totalMatches ?? "-"}
                </p>
              )}
            </div>
            <div>
              <p className="mb-0.5 ">승률</p>
              {isLoading || isError ? (
                <p className="font-medium text-text-2">-</p>
              ) : (
                <p className={`font-bold text-xl ${winRateColor}`}>
                  {data?.totalMatches !== 0 ? data?.winRatePercent ?? "-" : "-"}
                  {data?.totalMatches !== 0 ? "%" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <RecordUpdateButton groupId={group.id} />
    </div>
  );
};

export default SummarySection;
