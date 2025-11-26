// app/api/auth/discord/link/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
  const redirectUri = encodeURIComponent(
    process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!
  );

  const scope = "identify email guilds"; // scope — identify, email, guilds

  // OAuth 인증 URL 구성
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  console.log("✅ Redirecting to Discord OAuth:", discordAuthUrl);

  // 클라이언트가 Discord 로그인 페이지로 이동하도록 리다이렉트
  return NextResponse.redirect(discordAuthUrl);
}
