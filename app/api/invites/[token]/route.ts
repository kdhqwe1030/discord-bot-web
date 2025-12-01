import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/invites/[token]
 * 초대 조회 + 만료/상태 체크
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { token } = await params;

  const { data, error } = await supabase
    .from("group_invitations")
    .select("*, groups(name)")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "유효하지 않은 초대 링크입니다." },
      { status: 404 }
    );
  }

  // 만료 체크
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "만료된 초대 링크입니다." },
      { status: 400 }
    );
  }

  // 취소된 초대만 막기
  if (data.status === "cancelled") {
    return NextResponse.json(
      { error: "취소된 초대 링크입니다." },
      { status: 400 }
    );
  }

  return NextResponse.json({ invitation: data });
}

/**
 * POST /api/invites/[token]
 * 초대 수락
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { token } = await params;

  // 1) 로그인 유저 확인
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

  // 2) 초대 조회
  const { data: invite, error: inviteError } = await supabase
    .from("group_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "유효하지 않은 초대입니다." },
      { status: 404 }
    );
  }

  // 3) 만료/상태 체크
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "만료된 초대입니다." }, { status: 400 });
  }

  if (invite.status === "cancelled") {
    return NextResponse.json({ error: "취소된 초대입니다." }, { status: 400 });
  }

  // 4) 이미 멤버인지 체크
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", invite.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: invite.group_id,
      user_id: user.id,
      role: "member",
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
  }

  // 5) 초대 레코드 업데이트 (로그용)
  const updateFields: Record<string, any> = {};

  if (!invite.accepted_at) {
    updateFields.accepted_at = new Date().toISOString();
  }
  if (invite.status === "pending") {
    updateFields.status = "accepted";
  }

  if (Object.keys(updateFields).length > 0) {
    const { error: updateError } = await supabase
      .from("group_invitations")
      .update(updateFields)
      .eq("id", invite.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, groupId: invite.group_id });
}
