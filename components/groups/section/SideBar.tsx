"use client";

import MemberSection from "./MemberSection";
import SummarySection from "./SummarySection";
import type { Group } from "@/types/group";
import { useQuery } from "@tanstack/react-query";
import { groupAPI } from "@/lib/api/group";

interface SideBarProps {
  group: Group;
  groupId: string;
}

const SideBar = ({ group, groupId }: SideBarProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupAPI.fetchGroup(groupId),
  });

  if (isLoading) {
    return (
      <aside className="max-w-1/4 min-w-1/4 flex flex-col gap-4">
        <div>로딩 중...</div>
      </aside>
    );
  }

  const { membersWithProfiles, discordGuildInfo } = data || {
    membersWithProfiles: [],
    discordGuildInfo: null,
  };

  return (
    <aside className="w-1/4 flex flex-col gap-4">
      <SummarySection
        group={group}
        discordGuildInfo={discordGuildInfo}
        membersWithProfiles={membersWithProfiles}
      />
      <MemberSection
        groupId={groupId}
        group={group}
        membersWithProfiles={membersWithProfiles}
      />
    </aside>
  );
};

export default SideBar;
