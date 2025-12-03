"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getRankImageUrl } from "@/utils/lolRank";
import { authAPI } from "@/lib/api/auth";
import RiotLinkButton from "./ui/Buttons/RiotLinkButton";
import { FaDiscord } from "react-icons/fa";
import UserProfile from "./users/UserProfile";
import DiscordConnectButton from "./ui/Buttons/DiscordConnectButton";
import Image from "next/image";

export default function Header() {
  const {
    user,
    discordLinked,
    discordProfile,
    lolAccount,
    riotLinked,
    loggedIn,
  } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // 기본 표시 이름 / 아바타
  const hasDiscord = discordLinked && !!discordProfile;

  const displayName =
    (hasDiscord && discordProfile?.username) ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "게스트";

  const email = user?.email || (discordProfile as any)?.email || "이메일 없음";

  const avatarUrl = hasDiscord
    ? discordProfile?.avatar_url
    : user?.user_metadata?.avatar_url ?? null;

  const hasRiot = riotLinked && !!lolAccount;
  const rankImg = getRankImageUrl({
    tierFlex: lolAccount?.tier_flex ?? "",
    isMini: true,
  });
  console.log(rankImg);
  console.log(rankImg);
  console.log(rankImg);
  const handleLogout = async () => {
    await authAPI.logout(); // 로그아웃 API 호출
    router.refresh();
  };

  const handleConnectDiscord = () => {
    router.push("/auth/discord"); // 실제 OAuth 라우트에 맞게 수정
  };

  if (!loggedIn) {
    return (
      <header className="w-full h-14 flex items-center justify-between px-4 border-b border-border bg-background text-foreground">
        <div className="font-semibold text-lg">My LoL Group</div>
        <button
          onClick={() => router.push("/login")}
          className="px-3 py-1.5 rounded-md bg-primary text-sm text-white hover:bg-primary/90"
        >
          로그인
        </button>
      </header>
    );
  }

  return (
    <header className="w-full h-16 flex items-center justify-between px-4 border-b border-border bg-background text-foreground">
      {/* 좌측 로고/타이틀 */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg text-main">이름뭘로하지</span>
        <span className="text-xs text-text-3 ml-2">
          어쩌구 저쩌구 그룹 전적 분석
        </span>
      </div>

      {/* 우측 프로필 영역 */}
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-1 border border-border hover:border-primary/60 transition-colors"
        >
          {/* 아바타 */}
          {avatarUrl ? (
            <UserProfile imgUrl={avatarUrl} />
          ) : (
            <UserProfile imgUrl={""} />
          )}

          {/* 이름 + 라이엇 정보 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-1">
              {displayName}
            </span>

            {/* 디스코드 아이콘 뱃지 (연동 시) */}
            {hasDiscord && <FaDiscord className="w-5 h-5 text-discord" />}

            {/* 라이엇 연결 상태 & 티어 표시 */}
            {hasRiot && lolAccount ? (
              <div className="flex items-center gap-1 text-[11px] text-text-2">
                {rankImg && (
                  <div className="relative w-6 h-6 shrink-0">
                    <Image
                      src={rankImg}
                      alt={lolAccount.tier_flex || "Unranked"}
                      fill
                      className="object-contain"
                      sizes="16px"
                    />
                  </div>
                )}

                <span className="text-text-3">
                  {lolAccount.game_name} {lolAccount.tag_line}
                </span>
              </div>
            ) : null}
          </div>

          {/* 드롭다운 화살표 */}
          <span className="text-text-3 text-xs ml-1">▾</span>
        </button>

        {/* 드롭다운 패널 */}
        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface-1 shadow-lg z-50">
            <div className="px-3 py-3 border-b border-border">
              <p className="text-xs text-text-3 mb-0.5">로그인 계정</p>
              <p className="text-sm font-medium text-text-1 truncate">
                {email}
              </p>
            </div>

            <div className="px-3 py-3 space-y-2 border-b border-border">
              {/* 디스코드 상태 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-2">Discord</span>
                {hasDiscord ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-discord/10 text-discord">
                    Discord 연동됨
                  </span>
                ) : (
                  <DiscordConnectButton />
                )}
              </div>

              {/* 라이엇 상태 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-2">LoL 계정</span>
                {hasRiot && lolAccount ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-riot/10 text-riot">
                    Riot 연동됨
                  </span>
                ) : (
                  <RiotLinkButton />
                )}
              </div>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 rounded-b-xl"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
