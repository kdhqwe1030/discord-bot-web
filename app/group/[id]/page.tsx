import GroupInviteButton from "@/components/groups/GroupInviteButton";
import PollList from "@/components/groups/PollList";
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
      <div className="min-h-screen flex items-center justify-center text-red-400">
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
      <div className="min-h-screen flex items-center justify-center text-red-400">
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
        <div className="bg-sub2 rounded-xl p-4">
          <h2 className="text-lg font-semibold">Group Summary</h2>
          <p className="text-sm text-gray-400 mt-1">• 그룹명: {group.name}</p>
          <p className="text-sm text-gray-400">
            • 멤버 수: {membersWithProfiles.length}명
          </p>
          <p className="text-sm text-gray-400">• 내 역할: {membership.role}</p>
          {discordGuildInfo && (
            <p className="text-sm text-gray-400">
              • Discord: {discordGuildInfo.name}
            </p>
          )}
        </div>

        <div className="bg-sub2 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Members</h3>
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
                <span className="text-white">{member.username}</span>
                <span className="text-gray-400 text-[10px]">
                  ({member.role})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sub2 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Invite</h3>
          <p className="text-gray-400 text-xs mb-2">
            그룹 초대 버튼 또는 초대 링크 생성
          </p>
          <GroupInviteButton groupId={groupId} groupName={group.name} />
        </div>
      </aside>

      {/* 🔸 RIGHT — 메인 영역 */}
      <section className="flex-1 flex flex-col gap-6">
        {/* 상단 통계 카드 영역 */}
        <section className="grid grid-cols-4 gap-4">
          <div className="bg-sub2 rounded-xl h-32 p-4 flex flex-col justify-center">
            <span className="text-sm text-gray-400">Group Win Rate</span>
            <span className="text-2xl font-bold text-green-400 mt-2">--%</span>
          </div>
          <div className="bg-sub2 rounded-xl h-32 p-4">MVP 카드 자리</div>
          <div className="bg-sub2 rounded-xl h-32 p-4">Feeder 카드 자리</div>
          <div className="bg-sub2 rounded-xl h-32 p-4">
            Best Combo 카드 자리
          </div>
        </section>

        {/* 탭 영역 */}
        <section className="flex flex-col flex-1 bg-sub2 rounded-xl">
          {/* 탭 헤더 */}
          <div className="border-b border-sub3 flex gap-6 px-4 py-2 text-sm font-medium">
            <button className="text-main">Vote</button>
            <button className="text-gray-400 hover:text-white">Matches</button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 p-4 text-gray-400 text-sm">
            - 투표 리스트 or 경기 기록 리스트 표시 영역 - 여기 안에서
            react-query / infinite scroll
          </div>
          <PollList groupId={groupId} />
        </section>
      </section>
    </div>
  );
};

export default eachGroupPage;
