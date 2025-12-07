import { createClient } from "@/lib/supabase/supabaseServer";
import { redirect } from "next/navigation";
import MemberSection from "@/components/groups/section/MemberSection";
import SummarySection from "@/components/groups/section/SummarySection";
import type { MemberWithProfile } from "@/types/group";

interface GroupLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const GroupLayout = async ({ children, params }: GroupLayoutProps) => {
  const { id: groupId } = await params;
  const supabase = await createClient();

  // 1. 현재 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // 2. 그룹 기본 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center text-error">
        그룹을 찾을 수 없습니다.
      </div>
    );
  }

  // 3. 현재 유저가 이 그룹의 멤버인지 확인
  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    return (
      <div className="min-h-screen flex items-center justify-center text-error">
        이 그룹에 접근 권한이 없습니다.
      </div>
    );
  }

  // 4. 그룹 멤버 목록 조회
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId);

  const memberIds = (members || []).map((m) => m.user_id);

  // 4-1. 각 멤버의 LoL 계정 정보 (tier_flex만)
  const { data: riotAccounts } = await supabase
    .from("lol_accounts")
    .select("user_id, tier_flex")
    .in(
      "user_id",
      memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]
    );

  const riotByUser = new Map((riotAccounts || []).map((r) => [r.user_id, r]));

  // 5. 각 멤버의 Discord 프로필 정보 가져오기
  const membersWithProfiles: MemberWithProfile[] = await Promise.all(
    (members || []).map(async (member: any) => {
      const { data: discordProfile } = await supabase
        .from("discord_profiles")
        .select("avatar_url, username, discord_id")
        .eq("user_id", member.user_id)
        .maybeSingle();

      const riot = riotByUser.get(member.user_id);

      return {
        userId: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        avatarUrl: discordProfile?.avatar_url || "",
        username: discordProfile?.username || "Unknown",
        discordId: discordProfile?.discord_id || "",
        hasDiscord: !!discordProfile,
        hasRiot: !!riot,
        tierFlex: riot?.tier_flex ?? null,
        matchCount: null,
        winRate: null,
      };
    })
  );

  // 6. 디스코드 서버 정보
  let discordGuildInfo: {
    id: string;
    name: string;
    icon: string | null;
  } | null = null;

  if (group.linked_guild_id) {
    const { data: guild } = await supabase
      .from("guilds")
      .select("id, name, icon")
      .eq("id", group.linked_guild_id)
      .maybeSingle();

    if (guild) {
      discordGuildInfo = {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
      };
    }
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground ">
      {/* 그룹 Summary 영역 */}
      <div className="w-full px-4 py-6 flex flex-row gap-6 lg:max-w-6xl lg:mx-auto">
        <aside className="max-w-1/4 min-w-1/4 flex flex-col gap-4">
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
        {/* 메인 영역 */}
        <section className="max-w-3/4 min-w-3/4 flex flex-col gap-6 ">
          {children}
        </section>
      </div>
    </div>
  );
};

export default GroupLayout;
