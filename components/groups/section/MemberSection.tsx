import { getRankImageUrl } from "@/utils/lolRank";
import GroupInviteButton from "../GroupInviteButton";
import UserProfile from "@/components/users/UserProfile";
import { FaDiscord } from "react-icons/fa";
import type { Group, MemberWithProfile } from "@/types/group";

interface MemberSectionProps {
  groupId: string;
  group: Group;
  membersWithProfiles: MemberWithProfile[];
}

const MemberSection = ({
  groupId,
  group,
  membersWithProfiles,
}: MemberSectionProps) => {
  return (
    <>
      {/* 멤버 테이블 */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <div className="flex justify-between mb-2 items-center">
          <h3 className="text-sm font-semibold text-text-1">Members</h3>
          <GroupInviteButton groupId={groupId} groupName={group.name} />
        </div>

        {/* 헤더 */}
        <div className="grid grid-cols-4 text-[11px] text-text-3 mb-1 px-1">
          <span>멤버</span>
          <span className="text-center">계정</span>
          <span className="text-right">매치수</span>
          <span className="text-right">승률</span>
        </div>

        <div className="space-y-1">
          {membersWithProfiles.map((member) => {
            const rankImg = member.tierFlex
              ? getRankImageUrl({ tierFlex: member.tierFlex })
              : null;
            const winRate = member.winRate;

            const winRateColor =
              typeof winRate === "number"
                ? winRate >= 50
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-text-2";

            return (
              <div
                key={member.userId}
                className="grid grid-cols-4 items-center text-xs px-1 py-1 rounded-lg hover:bg-surface-2"
              >
                {/* 멤버 + 역할 */}
                <div className="flex items-center gap-2">
                  <UserProfile imgUrl={member.avatarUrl || ""} />
                  <div className="flex flex-col">
                    <span className="text-text-1">{member.username}</span>
                    {member.role === "owner" ? (
                      <span className="text-[10px] text-primary">그룹장</span>
                    ) : member.role === "admin" ? (
                      <span className="text-[10px] text-emerald-400">
                        관리자
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 계정 상태 */}
                <div className="flex items-center justify-center gap-2">
                  {member.hasDiscord && (
                    <FaDiscord className="w-4 h-4 text-discord" />
                  )}
                  {member.hasRiot && rankImg && (
                    <img
                      src={rankImg}
                      alt={member.tierFlex || "rank"}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                </div>

                {/* 매치수 (TODO) */}
                <div className="text-right text-text-2">
                  {member.matchCount ?? "-"}
                </div>

                {/* 승률 (TODO) */}
                <div className={`text-right font-medium ${winRateColor}`}>
                  {typeof winRate === "number" ? `${winRate}%` : "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MemberSection;
