import { createClient } from "@/lib/supabase/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
const RIOT_API_KEY = process.env.RIOT_API_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const matchId = id;

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
  const url = `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const response = await fetch(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });
  const matchData = await response.json();
  // console.log(matchData);

  return NextResponse.json({ matchData }, { status: 200 });
}
