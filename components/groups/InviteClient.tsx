// app/invite/[token]/InviteClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Invitation {
  group_id: string;
  groups?: { name: string };
}

interface InviteClientProps {
  token: string;
}

const InviteClient = ({ token }: InviteClientProps) => {
  const router = useRouter();
  const { user, loggedIn, loading: userLoading } = useCurrentUser();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invLoading, setInvLoading] = useState(true);
  const [error, setError] = useState("");

  // 초대 정보 가져오기
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "유효하지 않은 초대 링크입니다.");
          setInvitation(null);
        } else {
          setInvitation(data.invitation);
        }
      } catch (e) {
        setError("초대 정보를 불러오지 못했습니다.");
      } finally {
        setInvLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleGoLogin = () => {
    const next = encodeURIComponent(`/invite/${token}`);
    router.push(`/login?next=${next}`);
  };

  const handleAccept = async () => {
    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "초대 수락에 실패했습니다.");
        return;
      }

      // ✅ 실제 라우트에 맞게 경로 맞춰주자
      // 그룹 상세 페이지가 /group/[id] 라우트면:
      if (data.groupId) {
        router.push(`/group/${data.groupId}`);
      } else {
        router.push("/group");
      }
    } catch (e) {
      alert("초대 수락 중 오류가 발생했습니다.");
    }
  };

  if (invLoading || userLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-200">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-200">
        초대 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const groupName = invitation.groups?.name ?? "알 수 없는 그룹";
  const displayName =
    user?.user_metadata?.custom_claims?.global_name ||
    user?.user_metadata?.name ||
    user?.email;

  return (
    <main className="h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl bg-sub2 p-6 shadow-lg">
        <h1 className="text-xl font-semibold mb-2">그룹 초대</h1>
        <p className="text-sm text-gray-300 mb-4">
          <span className="font-semibold text-main">{groupName}</span> 그룹에
          초대되었어요.
        </p>

        {!loggedIn ? (
          <>
            <p className="text-sm text-gray-400 mb-4">
              참여하려면 먼저 로그인해 주세요.
            </p>
            <button
              onClick={handleGoLogin}
              className="w-full p-3 bg-main text-white rounded-md text-sm font-semibold hover:bg-main/80 transition"
            >
              로그인하고 참여하기
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              <span className="font-semibold">{displayName}</span> 님으로 이
              그룹에 참여하시겠어요?
            </p>
            <button
              onClick={handleAccept}
              className="w-full p-3 bg-main text-white rounded-md text-sm font-semibold hover:bg-main/80 transition"
            >
              그룹 참여하기
            </button>
          </>
        )}
      </div>
    </main>
  );
};

export default InviteClient;
