// app/api/auth/discord/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);

  // ?next=/invite/abc123 같은 거 읽기 (없으면 "/")
  const next = url.searchParams.get("next") || "/";

  // 콜백 URL에 next를 같이 붙여서 넘김
  const callbackUrl = new URL(
    "/api/auth/discord/login/callback",
    process.env.NEXT_PUBLIC_URL
  );
  callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: "identify email guilds guilds.members.read",
    },
  });

  if (error || !data?.url) {
    console.error("signInWithOAuth error:", error);

    const redirectUrl = new URL("/login", url);
    redirectUrl.searchParams.set("error", "oauth_init_failed");
    // 실패했을 때도 next를 유지해두면 좋음
    if (next) redirectUrl.searchParams.set("next", next);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(data.url);
}
