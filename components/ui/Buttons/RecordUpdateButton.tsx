"use client";

import { groupAPI } from "@/lib/api/group";
import { getTimeAgo } from "@/utils/timeAgo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const COOLDOWN_MS = 5 * 60 * 1000; // 5분

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
      queryClient.invalidateQueries({ queryKey: ["groupAllCount"] });
      queryClient.invalidateQueries({ queryKey: ["groupMemberCount"] });
      queryClient.invalidateQueries({ queryKey: ["groupSideBar"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["lastSynced"] });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["lastSynced", groupId],
    queryFn: () => groupAPI.fetchLastSyncedAt(groupId),
  });
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // lastSyncedAt 바뀔 때마다 쿨다운 계산 & 타이머 설정
  useEffect(() => {
    if (!data?.lastSyncedAt) {
      setCooldownRemaining(0);
      return;
    }

    const last = new Date(data.lastSyncedAt).getTime();

    const updateRemaining = () => {
      const now = Date.now();
      const elapsed = now - last;
      const remain = COOLDOWN_MS - elapsed;

      if (remain <= 0) {
        setCooldownRemaining(0);
        return false; // 끝났다는 신호
      } else {
        setCooldownRemaining(remain);
        return true;
      }
    };

    // 처음 한 번 즉시 계산
    const stillCooldown = updateRemaining();
    if (!stillCooldown) return;

    const interval = setInterval(() => {
      const alive = updateRemaining();
      if (!alive) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.lastSyncedAt]);

  const handleSearch = () => {
    mutate();
  };
  const timeAgo = data?.lastSyncedAt ? getTimeAgo(data.lastSyncedAt) : "";

  let buttonText = "전적 갱신";
  if (isPending) {
    buttonText = "갱신 중...";
  } else if (cooldownRemaining > 0) {
    const secondsLeft = Math.ceil(cooldownRemaining / 1000);
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    //시간 자리수에 따른 text 표기
    if (minutes === 0) {
      if (seconds < 10) buttonText = `${seconds}초 후 갱신 가능`;
      else buttonText = `${seconds.toString().padStart(2, "0")}초 후 갱신 가능`;
    } else {
      buttonText = `${minutes}분 ${seconds
        .toString()
        .padStart(2, "0")}초 후 갱신 가능`;
    }
  }

  const isCooldown = cooldownRemaining > 0;
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSearch}
        disabled={isPending || isCooldown}
        className={`px-4 py-2 bg-primary text-white ${
          isCooldown ? "text-sm" : ""
        } rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {buttonText}
      </button>

      <div className="flex justify-end">
        {/* 쿨다운 중에는 숨기고, 쿨다운 없고 데이터 있을 때만 표시 */}
        {!isLoading && !isCooldown && data?.lastSyncedAt && (
          <span className="text-xs text-text-3">최근 업데이트: {timeAgo}</span>
        )}
      </div>
    </div>
  );
};

export default RecordUpdateButton;
