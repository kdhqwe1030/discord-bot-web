"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserStore, ApiUserResponse } from "@/stores/userStore";
import { userAPI } from "@/lib/api/user";

export function useCurrentUser() {
  const storeData = useUserStore((s) => s.userData);
  const setStoreData = useUserStore((s) => s.setData);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<ApiUserResponse>({
      queryKey: ["me"], // 이 키로 캐싱
      queryFn: userAPI.fetchMe,
    });

  // React Query 결과를 zustand에 동기화
  useEffect(() => {
    if (data) {
      setStoreData(data);
    }
  }, [data, setStoreData]);

  const effectiveData = data ?? storeData; // 첫 렌더시 store에 남아있으면 활용 가능
  const loggedIn = !!effectiveData?.user;

  return {
    user: effectiveData?.user ?? null,
    discordLinked: effectiveData?.discordLinked ?? false,
    discordProfile: effectiveData?.discordProfile ?? null,
    discordData: effectiveData?.discordData ?? null,
    lolAccount: effectiveData?.lolAccount ?? null,
    riotLinked: effectiveData?.riotLinked ?? false,
    loading: isLoading || isFetching,
    isError,
    error,
    refetch, // 강제 재조회할 때 사용 (로그인 직후 등)
    loggedIn,
  };
}
