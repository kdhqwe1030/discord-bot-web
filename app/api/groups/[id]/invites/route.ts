import { NextResponse } from "next/server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/supabaseServer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;
  const groupId = id;

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

  // 2) 권한 체크: 이 유저가 해당 그룹의 owner/admin인지 확인
  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return NextResponse.json(
      { error: "이 그룹에 대한 초대 권한이 없습니다." },
      { status: 403 }
    );
  }

  // 3) 랜덤 토큰 생성
  const token = crypto.randomBytes(16).toString("hex"); // 32자리 hex

  // 만료 시간: 지금으로부터 1일 (24시간)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: inviteError } = await supabase
    .from("group_invitations")
    .insert({
      group_id: groupId,
      inviter_id: user.id,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json(
      { error: inviteError?.message ?? "초대 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL!;
  const inviteUrl = `${baseUrl}/invite/${token}`;

  return NextResponse.json({ inviteUrl, invitation }, { status: 201 });
}
