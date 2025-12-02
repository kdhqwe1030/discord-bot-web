import GroupInviteButton from "@/components/groups/GroupInviteButton";
import PollList from "@/components/groups/section/PollList";
import { createClient } from "@/lib/supabase/supabaseServer";
import { redirect } from "next/navigation";

interface EachGroupPageProps {
  params: Promise<{ id: string }>;
}

const eachGroupPage = async ({ params }: EachGroupPageProps) => {
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
      <div className="min-h-screen flex items-center justify-center text-error ">
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
      <div className="min-h-screen flex items-center justify-center text-error ">
        이 그룹에 접근 권한이 없습니다.
      </div>
    );
  }

  // 4. 그룹 멤버 목록 조회
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId);

  // 5. 각 멤버의 Discord 프로필 정보 가져오기
  const membersWithProfiles = await Promise.all(
    (members || []).map(async (member: any) => {
      const { data: discordProfile } = await supabase
        .from("discord_profiles")
        .select("avatar_url, username, discord_id")
        .eq("user_id", member.user_id)
        .single();

      return {
        userId: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        avatarUrl: discordProfile?.avatar_url || "",
        username: discordProfile?.username || "Unknown",
        discordId: discordProfile?.discord_id || "",
      };
    })
  );

  // 6. 디스코드 서버 정보 (linked_guild_id가 있는 경우)
  let discordGuildInfo = null;
  if (group.linked_guild_id) {
    const { data: profile } = await supabase
      .from("discord_profiles")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    if (profile?.access_token) {
      try {
        const guildRes = await fetch(
          `https://discord.com/api/guilds/${group.linked_guild_id}`,
          {
            headers: { Authorization: `Bearer ${profile.access_token}` },
          }
        );

        if (guildRes.ok) {
          const guildData = await guildRes.json();
          discordGuildInfo = {
            id: guildData.id,
            name: guildData.name,
            icon: guildData.icon
              ? `https://cdn.discordapp.com/icons/${guildData.id}/${guildData.icon}.png`
              : null,
          };
        }
      } catch (e) {
        console.error("Failed to fetch Discord guild info:", e);
      }
    }
  }

  console.log("📌 [page.tsx] group =", {
    group,
    userRole: membership.role,
    members: membersWithProfiles,
    memberCount: membersWithProfiles.length,
    discordGuild: discordGuildInfo,
  });

  return (
    <div className="min-h-screen flex bg-background text-foreground p-6 gap-6">
      {/* 🔹 LEFT — 그룹 Summary 영역 */}
      <aside className="w-1/4 flex flex-col gap-4">
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <h2 className="text-lg font-semibold text-text-1">Group Summary</h2>
          <p className="text-sm text-text-3 mt-1">• 그룹명: {group.name}</p>
          <p className="text-sm text-text-3">
            • 멤버 수: {membersWithProfiles.length}명
          </p>
          <p className="text-sm text-text-3">• 내 역할: {membership.role}</p>
          {discordGuildInfo && (
            <p className="text-sm text-text-3">
              • Discord: {discordGuildInfo.name}
            </p>
          )}
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2 text-text-1">Members</h3>
          <div className="space-y-2">
            {membersWithProfiles.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-2 text-xs"
              >
                {member.avatarUrl && (
                  <img
                    src={member.avatarUrl}
                    alt={member.username}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-text-1">{member.username}</span>
                {member.role === "owner" ? (
                  <span className="text-text-3 text-[10px]">그룹장</span>
                ) : member.role === "admin" ? (
                  <span className="text-text-3 text-[10px]">관리자</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2 text-text-1">Invite</h3>
          <p className="text-text-3 text-xs mb-2">
            그룹 초대 버튼 또는 초대 링크 생성
          </p>
          <GroupInviteButton groupId={groupId} groupName={group.name} />
        </div>
      </aside>

      {/* 🔸 RIGHT — 메인 영역 */}
      <section className="flex-1 flex flex-col gap-6">
        {/* 탭 영역 */}
        <section className="flex flex-col flex-1 ">
          {/* 탭 헤더 */}
          <div className="border-b border-divider flex gap-6 px-4 py-2 text-md font-medium">
            <button className="text-primary border-b-2 border-primary pb-2">
              투표 기록
            </button>
            <button className="text-text-2 hover:text-text-1 pb-2">매치</button>
          </div>
          <PollList groupId={groupId} />
        </section>
      </section>
    </div>
  );
};

export default eachGroupPage;
