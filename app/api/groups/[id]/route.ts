// app/group/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = await createClient();

  // 0. 그룹 정보에서 linked_guild_id 가져오기
  const { data: group } = await supabase
    .from("groups")
    .select("linked_guild_id")
    .eq("id", groupId)
    .maybeSingle();

  // 1. 멤버 목록 조회
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId);

  const memberIds = (members || []).map((m) => m.user_id);

  // 2. Riot 계정
  const { data: riotAccounts } = await supabase
    .from("lol_accounts")
    .select("user_id, tier_flex")
    .in(
      "user_id",
      memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]
    );
  const riotByUser = new Map(riotAccounts?.map((r) => [r.user_id, r]) ?? []);

  // 3. Discord 계정
  const { data: discordProfiles } = await supabase
    .from("discord_profiles")
    .select("user_id, avatar_url, username, discord_id")
    .in(
      "user_id",
      memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]
    );
  const discordByUser = new Map(
    discordProfiles?.map((p) => [p.user_id, p]) ?? []
  );

  // 4. User Profile
  const { data: userProfiles } = await supabase
    .from("user_profiles")
    .select("user_id, username")
    .in(
      "user_id",
      memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]
    );
  const userProfileByUser = new Map(
    userProfiles?.map((p) => [p.user_id, p]) ?? []
  );

  // 5. membersWithProfiles 생성
  const membersWithProfiles = (members || []).map((member) => {
    const discord = discordByUser.get(member.user_id);
    const profile = userProfileByUser.get(member.user_id);
    const riot = riotByUser.get(member.user_id);

    return {
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      avatarUrl: discord?.avatar_url || "",
      username: discord?.username ?? profile?.username ?? "Unknown",
      discordId: discord?.discord_id || "",
      hasDiscord: !!discord,
      hasRiot: !!riot,
      tierFlex: riot?.tier_flex ?? null,
      matchCount: null,
      winRate: null,
    };
  });

  // 6. 디스코드 서버 정보
  let discordGuildInfo: {
    id: string;
    name: string;
    icon: string | null;
  } | null = null;

  if (group?.linked_guild_id) {
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

  return NextResponse.json({
    membersWithProfiles,
    discordGuildInfo,
  });
}
