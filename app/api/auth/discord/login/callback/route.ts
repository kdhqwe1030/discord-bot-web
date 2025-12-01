// app/api/auth/discord/login/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/group"; // 없으면 "/"로

  if (!code) {
    const redirectUrl = new URL("/login", url);
    redirectUrl.searchParams.set("error", "missing_code");
    redirectUrl.searchParams.set("next", next);
    return NextResponse.redirect(redirectUrl);
  }

  // 1) 코드 -> 세션 교환
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("OAuth login failed:", error);
    const redirectUrl = new URL("/login", url);
    redirectUrl.searchParams.set("error", "auth_failed");
    redirectUrl.searchParams.set("next", next);
    return NextResponse.redirect(redirectUrl);
  }

  const session = data.session;
  console.log("👉 OAuth session created:", session);

  // 2) 유저 정보
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Failed to load user after OAuth:", userError);
    const redirectUrl = new URL("/login", url);
    redirectUrl.searchParams.set("error", "user_not_found");
    redirectUrl.searchParams.set("next", next);
    return NextResponse.redirect(redirectUrl);
  }

  // 3) provider_token으로 디스코드 정보 가져오기
  const providerToken = session.provider_token as string | null;

  if (providerToken) {
    const discordRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${providerToken}` },
    });

    if (discordRes.ok) {
      const discordUser = await discordRes.json();
      console.log("Discord user via provider_token:", discordUser);

      const { error: upsertError } = await supabase
        .from("discord_profiles")
        .upsert(
          {
            user_id: user.id,
            discord_id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar_url: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            email: discordUser.email || user.email || null,
            access_token: providerToken,
            token_expires_at: null,
            connected: true,
          },
          { onConflict: "discord_id" }
        );

      if (upsertError) {
        console.error("discord_profiles upsert error (login):", upsertError);
      }
    } else {
      console.error("Failed to fetch Discord user:", await discordRes.text());
    }
  } else {
    console.warn("⚠️ No provider_token returned from session.");
  }

  // ✅ 최종 리다이렉트: next 로 보내기
  const base = process.env.NEXT_PUBLIC_URL || `${url.protocol}//${url.host}`;
  const redirectUrl = new URL(next, base);

  return NextResponse.redirect(redirectUrl);
}
