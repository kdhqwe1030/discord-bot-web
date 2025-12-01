// app/api/groups/[id]/polls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServer";
import type { Poll, PollWithResults } from "@/types/poll";

// 투표 데이터 가공 함수
function processPollData(polls: Poll[]): PollWithResults[] {
  return polls.map((poll) => {
    const totalVotes = poll.votes.length;

    const options = poll.poll_options.map((option) => {
      const optionVotes = poll.votes.filter(
        (vote) => vote.option_id === option.id
      );
      const voteCount = optionVotes.length;
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

      return {
        id: option.id,
        label: option.label,
        voteCount,
        percentage: Math.round(percentage * 10) / 10,
        voters: optionVotes.map((vote) => ({
          userId: vote.user_id,
          userName: vote.user_name,
          votedAt: vote.voted_at,
        })),
      };
    });

    return {
      id: poll.id,
      channelId: poll.channel_id,
      title: poll.title,
      createdBy: poll.created_by,
      startTime: poll.start_time,
      endTime: poll.end_time,
      isActive: poll.is_active,
      createdAt: poll.created_at,
      messageId: poll.message_id,
      guildId: poll.guild_id,
      options,
      totalVotes,
    };
  });
}

// 그룹의 투표 목록 조회 (페이지네이션)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: groupId } = await params;

  // 페이지네이션 파라미터
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = page * limit;

  // 1. 로그인 확인
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

  // 2. 그룹 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("linked_guild_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      { error: "그룹을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 3. 멤버 권한 확인
  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    return NextResponse.json(
      { error: "이 그룹에 접근 권한이 없습니다." },
      { status: 403 }
    );
  }

  // 4. Discord 서버가 연결되어 있는지 확인
  if (!group.linked_guild_id) {
    return NextResponse.json({
      polls: [],
      hasMore: false,
      nextPage: null,
    });
  }

  // 5. 투표 총 개수 조회
  const { count } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true })
    .eq("guild_id", group.linked_guild_id);

  // 6. 투표 데이터 가져오기 (페이지네이션)
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("*, poll_options (*), votes (*)")
    .eq("guild_id", group.linked_guild_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (pollsError) {
    console.error("투표 조회 오류:", pollsError);
    return NextResponse.json(
      { error: "투표 목록을 불러올 수 없습니다." },
      { status: 500 }
    );
  }

  // 7. 투표 데이터 가공
  const processedPolls = polls ? processPollData(polls as Poll[]) : [];
  const hasMore = offset + limit < (count || 0);

  return NextResponse.json({
    polls: processedPolls,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count || 0,
  });
}
