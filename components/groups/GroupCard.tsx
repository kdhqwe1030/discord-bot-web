"use client";

import UserProfile from "@/components/users/UserProfile";
import { groupAPI } from "@/lib/api/group";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FaDiscord } from "react-icons/fa";

interface GroupMember {
  userId: string;
  role: string;
  avatarUrl: string;
  username: string;
}

interface GroupCardProps {
  id: string;
  name: string;
  linkedGuildId?: string | null;
  memberCount: number;
  userRole: string;
  members: GroupMember[];
}

const GroupCard = ({
  id,
  name,
  linkedGuildId,
  memberCount,
  userRole,
  members,
}: GroupCardProps) => {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["groupAllCount", id],
    queryFn: () => groupAPI.fetchMatchCount(id),
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
    <div
      className="w-full bg-surface-1  rounded-2xl p-6 shadow-lg shadow-black/40 text-text-1  h-64 hover:border-discord border-2 border-transparent transition-all cursor-pointer"
      onClick={() => router.push(`/group/${id}/matches/all`)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex gap-4 items-center text-center">
            <h2 className="text-xl font-semibold leading-tight">{name}</h2>
            {userRole === "owner" && (
              <span className="mt-2 text-md font-semibold text-discord capitalize">
                {userRole}
              </span>
            )}
          </div>
          {linkedGuildId && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <FaDiscord className="text-discord" />
              <span>Discord 연동됨</span>
            </div>
          )}
        </div>

        <div className="inline-flex items-center rounded-full bg-surface-3 /70 px-3 py-1 text-xs text-gray-300 border border-white/5">
          <span className="mr-1 font-medium">{memberCount}</span>
          <span>members</span>
        </div>
      </div>

      <div className="mt-5 flex gap-4">
        <div className="flex-1 rounded-xl bg-surface-3  px-4 py-3 flex flex-col justify-between">
          <span className="text-sm uppercase tracking-[0.12em] text-text-3 ">
            매치수
          </span>

          {isLoading || isError ? (
            <p className="font-medium text-text-2 ">-</p>
          ) : (
            <p className="font-medium text-text-2 text-xl">
              {data?.totalMatches ?? "-"}
            </p>
          )}
        </div>

        <div className="flex-1 rounded-xl bg-surface-3  px-4 py-3 flex flex-col justify-between">
          <span className="text-sm uppercase tracking-[0.12em] text-text-3 ">
            승률
          </span>
          {isLoading || isError ? (
            <p className="mt-2 text-lg font-semibold">-</p>
          ) : (
            <p className={`mt-2 text-lg font-semibold ${winRateColor}`}>
              {data?.totalMatches !== 0 ? data?.winRatePercent ?? "-" : "-"}
              {data?.totalMatches !== 0 ? "%" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center -space-x-3">
        {/* 실제 멤버 디스코드 프로필 표시 */}
        {members.slice(0, 4).map((member, i) => (
          <UserProfile key={member.userId} imgUrl={member.avatarUrl} />
        ))}
        {memberCount > 4 && (
          <span className="flex h-8 px-3 items-center justify-center rounded-full bg-surface-3  text-xs font-medium">
            +{memberCount - 4}
          </span>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
