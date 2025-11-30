"use client";

import UserProfile from "@/components/users/UserProfile";
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
  return (
    <div className="w-full bg-sub2 rounded-2xl p-6 shadow-lg shadow-black/40 text-white h-64 hover:border-discord border-2 border-transparent transition-all cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-tight">{name}</h2>
          {linkedGuildId && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <FaDiscord className="text-discord" />
              <span>Discord 연동됨</span>
            </div>
          )}
        </div>

        <div className="inline-flex items-center rounded-full bg-sub3/70 px-3 py-1 text-xs text-gray-300 border border-white/5">
          <span className="mr-1 font-medium">{memberCount}</span>
          <span>members</span>
        </div>
      </div>

      <div className="mt-5 flex gap-4">
        <div className="flex-1 rounded-xl bg-sub3 px-4 py-3 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
            Role
          </span>
          <span className="mt-2 text-lg font-semibold text-discord capitalize">
            {userRole}
          </span>
        </div>

        <div className="flex-1 rounded-xl bg-sub3 px-4 py-3 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
            Status
          </span>
          <span className="mt-2 text-lg font-semibold text-green-400">
            Active
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center -space-x-3">
        {/* 실제 멤버 디스코드 프로필 표시 */}
        {members.slice(0, 4).map((member, i) => (
          <UserProfile key={member.userId} imgUrl={member.avatarUrl} />
        ))}
        {memberCount > 4 && (
          <span className="flex h-8 px-3 items-center justify-center rounded-full bg-sub3 text-xs font-medium">
            +{memberCount - 4}
          </span>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
