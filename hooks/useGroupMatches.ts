// src/hooks/useGroupMatches.ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { groupAPI, MatchType } from "@/lib/api/group";

const PAGE_SIZE = 20;

export function useGroupMatches(groupId: string, type: MatchType) {
  return useInfiniteQuery({
    queryKey: ["matches", groupId, type],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam ?? 0;

      const data = await groupAPI.fetchMatches(groupId, {
        type,
        limit: PAGE_SIZE,
        offset,
      });

      return {
        ...data,
        offset,
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;

      return lastPage.offset + PAGE_SIZE;
    },
  });
}
