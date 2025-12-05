"use client";

import MatchRow from "@/components/matches/MatchRow";
import { MatchType } from "@/lib/api/group";
import NoMatchData from "./NoMatchData";
import { Match } from "@/types/match";
import { useGroupMatches } from "@/hooks/useGroupMatches";
import { useEffect, useRef } from "react";

const MatchWrapper = ({
  groupId,
  type,
}: {
  groupId: string;
  type: MatchType;
}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGroupMatches(groupId, type);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 무한스크롤용 IntersectionObserver
  useEffect(() => {
    if (!hasNextPage) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 200px 0px", // 조금 일찍 불러오고 싶으면 margin 조절
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) return <div>로딩 중...</div>;
  if (isError)
    return (
      <div>
        오류가 발생했습니다: {(error as Error)?.message ?? "알 수 없는 오류"}
      </div>
    );

  const matches: Match[] =
    data?.pages.flatMap((page) => page.matches as Match[]) ?? [];

  if (!matches.length) return <NoMatchData />;

  return (
    <div className="space-y-4">
      {matches.map((match, index) => (
        <MatchRow key={match.matchId ?? index} match={match} />
      ))}

      {/* 로딩 트리거용 sentinel */}
      <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
        {isFetchingNextPage && <span>더 불러오는 중...</span>}
        {!hasNextPage && (
          <span className="text-sm text-gray-500">마지막 매치입니다.</span>
        )}
      </div>
    </div>
  );
};

export default MatchWrapper;
