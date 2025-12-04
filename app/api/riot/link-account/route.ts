import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

// Riot API 공통 fetch helper
async function riotFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Riot API error: ${res.status}`);
  }

  return res.json();
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // 1) 현재 로그인 유저 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2) body 파싱
  const { gameName, tagLine } = await req.json();

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { success: false, error: "gameName / tagLine을 입력해주세요." },
      { status: 400 }
    );
  }
  const tag = tagLine.replace("#", ""); // #제거
  try {
    // 3) Riot ID -> PUUID (account-v1, asia)
    const account = await riotFetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName
      )}/${encodeURIComponent(tag)}`
    );

    const puuid: string = account.puuid;

    // 4) PUUID -> 티어 정보 (league-v4, kr)
    const leagueEntries: any[] = await riotFetch(
      `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`
    );

    // 솔랭 / 자랭 분리

    const flex = leagueEntries.find((e) => e.queueType === "RANKED_FLEX_SR");

    const tierFlex = flex ? `${flex.tier} ${flex.rank}` : null;
    const pointFlex = flex ? `${flex.leaguePoints}` : null;

    // 5) lol_accounts upsert
    const { error: dbError } = await supabase.from("lol_accounts").upsert(
      {
        user_id: user.id,
        puuid,
        game_name: gameName,
        tag_line: tagLine,
        tier_flex: tierFlex,
        point_flex: pointFlex,
      },
      { onConflict: "user_id" } // 한 유저당 하나의 롤 계정만
    );

    if (dbError) {
      console.error(dbError);
      return NextResponse.json(
        { success: false, error: "DB에 계정 정보를 저장하는 데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      puuid,
      tier_flex: tierFlex,
    });
  } catch (err: any) {
    console.error("Riot link error:", err);
    return NextResponse.json(
      { success: false, error: "Riot API 호출 중 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
