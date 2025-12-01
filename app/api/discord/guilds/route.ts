// app/api/discord/guilds/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. 현재 로그인된 유저 확인
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

    // 2. 유저의 Discord 프로필에서 access_token 가져오기
    const { data: profile, error: profileError } = await supabase
      .from("discord_profiles")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.access_token) {
      return NextResponse.json(
        { error: "Discord 연동이 필요합니다.", guilds: [] },
        { status: 200 }
      );
    }

    // 3. Discord API로 유저가 속한 서버(길드) 목록 가져오기
    const discordRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${profile.access_token}`,
      },
    });

    if (!discordRes.ok) {
      console.error("Discord API error:", await discordRes.text());
      return NextResponse.json(
        { error: "Discord 서버 목록을 가져올 수 없습니다.", guilds: [] },
        { status: 200 }
      );
    }

    const guilds = await discordRes.json();

    return NextResponse.json({ guilds });
  } catch (error: any) {
    console.error("Failed to fetch Discord guilds:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다.", guilds: [] },
      { status: 500 }
    );
  }
}
