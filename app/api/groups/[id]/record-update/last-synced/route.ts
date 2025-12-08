import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const groupId = id;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_match_sync_state")
    .select("last_synced_at")
    .eq("group_id", groupId)
    .order("last_synced_at", { ascending: false }) // 최신 순
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ last_synced_at 조회 에러:", error);
    return NextResponse.json(
      { error: "마지막 전적 갱신 시점 조회 실패" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      lastSyncedAt: data?.last_synced_at ?? null, // 그룹에 아직 전적이 한 번도 없으면 null
    },
    { status: 200 }
  );
}
