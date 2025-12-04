"use client";
import AddGroupCard from "./AddGroupCard";
import GroupCard from "./GroupCard";
import { useQuery } from "@tanstack/react-query";
import { groupAPI } from "@/lib/api/group";
import { useUserStore } from "@/stores/userStore";

const GroupCardWrapper = () => {
  const { userData } = useUserStore();
  const userId = userData?.user?.id || "";

  const {
    data: groupsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["groups", userId],
    queryFn: async () => {
      const result = await groupAPI.fetchGroups();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId,
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <section className="mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-center">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-full bg-surface-1  rounded-2xl p-6 shadow-lg shadow-black/40 h-64 animate-pulse"
          >
            <div className="h-6 bg-surface-3  rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-surface-3  rounded w-1/2 mb-6"></div>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 h-20 bg-surface-3  rounded-xl"></div>
              <div className="flex-1 h-20 bg-surface-3  rounded-xl"></div>
            </div>
            <div className="flex -space-x-3">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="h-8 w-8 bg-surface-3  rounded-full"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <section className="mx-auto max-w-2xl text-center py-12">
        <div className="bg-surface-1  rounded-2xl p-8 text-text-1 ">
          <h3 className="text-xl font-semibold mb-2">
            그룹 목록을 불러올 수 없습니다
          </h3>
          <p className="text-text-3  mb-4">
            {error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-discord text-text-1  rounded-md hover:bg-discord/80 transition"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  const groups = groupsData || [];

  return (
    <section className="mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-center">
      {/* 그룹 카드들 */}
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          id={group.id}
          name={group.name}
          linkedGuildId={group.linked_guild_id}
          memberCount={group.memberCount}
          userRole={group.userRole}
          members={group.members}
        />
      ))}

      {/* 그룹 추가 카드 */}
      <AddGroupCard />
    </section>
  );
};

export default GroupCardWrapper;
