import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET() {
  const supabase = await createClient();

  // 1. 현재 로그인된 유저 가져오기
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        user: null,
        discordLinked: false,
        discordProfile: null,
        discordData: null,
        message: "Not logged in",
      },
      { status: 401 }
    );
  }

  // 2. 디스코드 프로필 조회 (연동 여부 확인)
  const { data: discordProfile, error: profileError } = await supabase
    .from("discord_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("discord_profiles select error:", profileError);
  }

  // 3. 라이엇 계정 정보 조회
  const { data: lolAccount, error: lolError } = await supabase
    .from("lol_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lolError) {
    console.error("lol_accounts select error:", lolError);
  }

  let discordData = null;

  // 4. 디스코드 연동이 되어 있다면, 관련 데이터들 같이 가져오기 (예시)
  if (discordProfile) {
    const [
      { data: groupsOwned },
      { data: groupMemberships },
      { data: pollsCreated },
    ] = await Promise.all([
      // 내가 owner인 그룹들
      supabase.from("groups").select("*").eq("owner_id", user.id),

      // 내가 속한 그룹 멤버십
      supabase.from("group_members").select("*").eq("user_id", user.id),

      // 내가 만든(= 내 디스코드 계정으로 만든) 투표들
      supabase
        .from("polls")
        .select("*, poll_options(*), votes(*)")
        .eq("created_by", discordProfile.discord_id),
    ]);

    discordData = {
      groupsOwned: groupsOwned ?? [],
      groupMemberships: groupMemberships ?? [],
      pollsCreated: pollsCreated ?? [],
    };
  }

  return NextResponse.json({
    user,
    discordLinked: !!discordProfile,
    discordProfile: discordProfile ?? null,
    lolAccount: lolAccount ?? null,
    riotLinked: !!lolAccount,
    discordData,
  });
}
