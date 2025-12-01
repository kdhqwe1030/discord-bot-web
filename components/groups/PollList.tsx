"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { groupAPI } from "@/lib/api/group";
import { useEffect, useRef } from "react";
import type { PollWithResults } from "@/types/poll";

interface PollListProps {
  groupId: string;
}

const PollList = ({ groupId }: PollListProps) => {
  const observerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["groupPolls", groupId],
      queryFn: ({ pageParam = 0 }) => groupAPI.fetchGroupPolls(groupId, pageParam),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
    });

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const polls = data?.pages.flatMap((page) => page.polls) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        투표 목록을 불러오는 중...
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        아직 투표가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}

      {/* 무한 스크롤 트리거 */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <span className="text-sm text-gray-400">투표 불러오는 중...</span>
        )}
      </div>
    </div>
  );
};

// 개별 투표 카드 컴포넌트
const PollCard = ({ poll }: { poll: PollWithResults }) => {
  const isActive = poll.isActive;
  const totalVotes = poll.totalVotes;

  return (
    <div className="bg-sub3 rounded-xl p-5 relative">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-white font-semibold text-lg pr-20">{poll.title}</h3>
        <span
          className={`absolute top-5 right-5 px-3 py-1 rounded text-xs font-medium ${
            isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {isActive ? "OPEN" : "CLOSED"}
        </span>
      </div>

      {/* 투표 옵션들 */}
      <div className="space-y-3">
        {poll.options.map((option) => (
          <div key={option.id}>
            {/* 옵션명과 투표 수 */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">{option.label}</span>
              <span className="text-xs text-gray-400">{option.voteCount} votes</span>
            </div>

            {/* 프로그레스 바 */}
            <div className="relative w-full h-2 bg-sub2 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${option.percentage}%` }}
              />
            </div>

            {/* 투표한 사람들 아바타 (최대 4명) */}
            {option.voters.length > 0 && (
              <div className="flex items-center gap-1 mt-2 -space-x-2">
                {option.voters.slice(0, 4).map((voter, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-sub2 flex items-center justify-center text-[10px] text-gray-400 ring-2 ring-sub3"
                    title={voter.userName}
                  >
                    {voter.userName.charAt(0).toUpperCase()}
                  </div>
                ))}
                {option.voters.length > 4 && (
                  <span className="text-[10px] text-gray-500 ml-2">
                    +{option.voters.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 총 투표 수 */}
      <div className="mt-4 pt-3 border-t border-sub2 text-xs text-gray-500">
        총 {totalVotes}명 참여
      </div>
    </div>
  );
};

export default PollList;
