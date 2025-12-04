"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

interface MatchesLayoutProps {
  children: React.ReactNode;
}

const MatchesLayout = ({ children }: MatchesLayoutProps) => {
  const params = useParams();
  const pathname = usePathname();
  const groupId = params.id as string;

  const tabs = [
    { name: "전체", path: `/group/${groupId}/matches/all` },
    { name: "자유랭크", path: `/group/${groupId}/matches/ranked` },
    { name: "칼바람", path: `/group/${groupId}/matches/aram` },
    { name: "아수라장", path: `/group/${groupId}/matches/arena` },
    { name: "사설", path: `/group/${groupId}/matches/custom` },
  ];

  return (
    <section className="flex flex-col flex-1">
      {/* 메인 탭 헤더 */}
      <div className="border-b border-divider flex gap-6 px-4 py-2 text-md font-medium">
        <Link
          href={`/group/${groupId}/matches/all`}
          className="text-primary border-b-2 border-primary pb-2"
        >
          매치
        </Link>
        <Link
          href={`/group/${groupId}/polls`}
          className="text-text-2 hover:text-text-1 pb-2"
        >
          투표
        </Link>
      </div>

      {/* 서브 탭 헤더 (매치 내부) */}
      <div className="border-b border-divider flex gap-4 px-4 py-2 text-sm">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`pb-2 transition ${
                isActive
                  ? "text-primary border-b-2 border-primary font-medium"
                  : "text-text-2 hover:text-text-1"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* 매치 콘텐츠 */}
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
};

export default MatchesLayout;
