// app/api/auth/discord/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // 1️⃣ Discord Access Token 요청
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    console.error("Token Error:", tokenData);
    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 400 }
    );
  }

  // 2️⃣ Discord 사용자 정보 요청
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const discordUser = await userRes.json();
  console.log("Discord user:", discordUser);

  // 3️⃣ Supabase Auth 사용자 정보 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4️⃣ Discord 프로필 테이블 업데이트 / 삽입
  const { error: upsertError } = await supabase.from("discord_profiles").upsert(
    {
      user_id: user.id,
      discord_id: discordUser.id,
      username: discordUser.global_name || discordUser.username,
      avatar_url: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      email: discordUser.email || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
      connected: true,
    },
    { onConflict: "discord_id" }
  );

  if (upsertError) {
    console.error("Supabase upsert error:", upsertError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  console.log("Discord profile saved successfully.");
  return NextResponse.redirect(new URL("/", req.url));
}
