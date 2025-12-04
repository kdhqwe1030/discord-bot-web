"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { groupAPI } from "@/lib/api/group";
import { useEffect, useRef } from "react";
import PollCard from "../PollCard";

interface PollListProps {
  groupId: string;
}

const PollList = ({ groupId }: PollListProps) => {
  const observerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["groupPolls", groupId],
      queryFn: ({ pageParam = 0 }) =>
        groupAPI.fetchGroupPolls(groupId, pageParam),
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
      <div className="flex items-center justify-center p-12 text-text-3">
        투표 목록을 불러오는 중...
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-text-3">
        아직 투표가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 p-4">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}

      {/* 무한 스크롤 트리거 */}
      <div
        ref={observerRef}
        className="col-span-full h-10 flex items-center justify-center"
      >
        {isFetchingNextPage && (
          <span className="text-sm text-text-3">투표 불러오는 중...</span>
        )}
      </div>
    </div>
  );
};

// 개별 투표 카드 컴포넌트

export default PollList;
