"use client";

import { groupAPI } from "@/lib/api/group";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const RecordUpdateButton = ({ groupId }: { groupId: string }) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: () => groupAPI.recordUpdate(groupId),
    onSuccess: (data) => {
      console.log("매치 검색 성공:", data);
      alert("전적 갱신 완료");
    },
    onError: (error) => {
      console.error("매치 검색 실패:", error);
      alert("전적 갱신 실패");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["groupMemberCount", "groupSideBar", "matches"],
      });
    },
  });

  const handleSearch = () => {
    mutate();
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSearch}
        disabled={isPending}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "갱신 중..." : "전적 갱신"}
      </button>
    </div>
  );
};

export default RecordUpdateButton;
