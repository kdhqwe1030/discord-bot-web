"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api/auth";

export default function loginStatus() {
  const router = useRouter();
  const {
    user,
    discordLinked,
    discordProfile,
    discordData,
    loading,
    loggedIn,
  } = useCurrentUser();

  const [logoutLoading, setLogoutLoading] = useState(false);
  if (loading) return <div>로딩 중...</div>;

  if (!loggedIn) {
    return (
      <div>
        <h1>로그인이 필요합니다</h1>
        <Link href="/login">로그인 페이지로 이동</Link>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await authAPI.logout();
    } catch (e) {
      console.error(e);
    } finally {
      setLogoutLoading(false);
      router.push("/login");
    }
  };
  return (
    <div style={{ padding: 24 }}>
      <h1>현재 로그인 유저 정보</h1>
      <p>user: {JSON.stringify(user)}</p>
      <p>이메일: {user?.email || ""}</p>
      <p>유저 ID: {user?.id || ""}</p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>현재 로그인 유저 정보</h1>
        <button onClick={handleLogout} disabled={logoutLoading}>
          {logoutLoading ? "로그아웃 중..." : "로그아웃"}
        </button>
      </div>
      <h2 style={{ marginTop: 24 }}>디스코드 연동 상태</h2>
      <p>연동 여부: {discordLinked ? "✅ 연동됨" : "❌ 미연동"}</p>

      {discordLinked && (
        <>
          <h3>discord_profiles</h3>
          <pre>{JSON.stringify(discordProfile, null, 2)}</pre>

          <h3>디스코드 관련 데이터 (예시)</h3>
          <pre>{JSON.stringify(discordData, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
