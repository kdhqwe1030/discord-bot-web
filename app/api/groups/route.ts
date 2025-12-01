import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

type CreateGroupBody = {
  name: string;
  linkedGuildId?: string | null;
};

// 그룹 목록 조회
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // 현재 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 유저가 속한 그룹 목록 조회 (group_members 테이블 기준)
  const { data: memberships, error: memberError } = await supabase
    .from("group_members")
    .select(
      `
      *,
      groups (
        id,
        name,
        owner_id,
        linked_guild_id,
        created_at
      )
    `
    )
    .eq("user_id", user.id);

  if (memberError) {
    console.error("fetch group_members error:", memberError);
    return NextResponse.json(
      { error: "그룹 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 각 그룹별 멤버 수 및 멤버 정보 조회
  const groupsWithDetails = await Promise.all(
    (memberships || []).map(async (membership: any) => {
      const group = membership.groups;

      // 해당 그룹의 멤버들 조회 (최대 5명)
      const { data: groupMembers, error: membersError } = await supabase
        .from("group_members")
        .select(
          `
          user_id,
          role
        `
        )
        .eq("group_id", group.id)
        .limit(5);

      // 멤버 수 카운트
      const { count, error: countError } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      // 각 멤버의 Discord 프로필 정보 가져오기
      const membersWithProfiles = await Promise.all(
        (groupMembers || []).map(async (member: any) => {
          const { data: discordProfile } = await supabase
            .from("discord_profiles")
            .select("avatar_url, username")
            .eq("user_id", member.user_id)
            .single();

          return {
            userId: member.user_id,
            role: member.role,
            avatarUrl: discordProfile?.avatar_url || "",
            username: discordProfile?.username || "Unknown",
          };
        })
      );

      return {
        ...group,
        memberCount: count || 0,
        userRole: membership.role,
        members: membersWithProfiles,
      };
    })
  );

  return NextResponse.json({ groups: groupsWithDetails });
}

// 그룹 생성
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // 1) 현재 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 2) 요청 바디 파싱
  let body: CreateGroupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON body를 파싱할 수 없습니다." },
      { status: 400 }
    );
  }

  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json(
      { error: "그룹 이름(name)은 필수입니다." },
      { status: 400 }
    );
  }

  const name = body.name.trim();
  const linkedGuildId = body.linkedGuildId ?? null;

  // 3) groups 테이블에 그룹 생성
  const { data: group, error: insertGroupError } = await supabase
    .from("groups")
    .insert({
      name,
      owner_id: user.id,
      linked_guild_id: linkedGuildId,
    })
    .select("*")
    .single();

  if (insertGroupError || !group) {
    console.error("insert groups error:", insertGroupError);
    return NextResponse.json(
      { error: "그룹 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 4) group_members에 owner로 등록
  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
    })
    .select("*")
    .single();

  if (memberError || !membership) {
    console.error("insert group_members error:", memberError);
    return NextResponse.json(
      { error: "그룹 멤버 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 5) 성공 응답
  return NextResponse.json(
    {
      group,
      membership,
    },
    { status: 201 }
  );
}
