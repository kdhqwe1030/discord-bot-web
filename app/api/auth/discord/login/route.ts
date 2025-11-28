// app/api/auth/discord/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_URL + "/api/auth/discord/login/callback",
    },
  });

  if (error || !data.url) {
    console.error("signInWithOAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_init_failed", url)
    );
  }

  return NextResponse.redirect(data.url);
}
