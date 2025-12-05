"use client";
import MatchRow from "@/components/matches/MatchRow";
import { groupAPI } from "@/lib/api/group";
import { useQuery } from "@tanstack/react-query";
import NoMatchData from "./NoMatchData";
import { Match } from "@/types/match";

const MatchWrapper = ({ groupId }: { groupId: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["matches", groupId],
    queryFn: () => groupAPI.fetchMatches(groupId),
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>오류가 발생했습니다: {error.message}</div>;
  if (!data?.matches) return <NoMatchData />;

  return (
    <div className="space-y-4">
      {data.matches.map((match: Match, index: number) => (
        <MatchRow key={index} match={match} />
      ))}
    </div>
  );
};

export default MatchWrapper;
