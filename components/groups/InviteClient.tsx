// app/invite/[token]/InviteClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { userAPI } from "@/lib/api/user";
import { useNotificationStore } from "@/stores/notificationStore";

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
  const showNotification = useNotificationStore(
    (state) => state.showNotification
  );
  // 초대 정보 가져오기
  useEffect(() => {
    const fetchInvite = async () => {
      const result = await userAPI.fetchInvite(token);

      if (result.error) {
        setError(result.error);
        setInvitation(null);
      } else {
        setInvitation(result.data!);
      }
      setInvLoading(false);
    };

    fetchInvite();
  }, [token]);

  const handleGoLogin = () => {
    const next = `/invite/${token}`;
    router.push(`/login?next=${next}`);
  };

  const handleAccept = async () => {
    const result = await userAPI.acceptInvite(token);

    if (result.error) {
      showNotification(result.error, {
        severity: "error",
      });
      return;
    }
    if (result.data?.groupId) {
      router.push(`/group/${result.data.groupId}`);
    } else {
      router.push("/group");
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
      <div className="h-screen flex items-center justify-center text-error ">
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
      <div className="w-full max-w-md rounded-2xl bg-surface-1  p-6 shadow-lg">
        <h1 className="text-xl font-semibold mb-2">그룹 초대</h1>
        <p className="text-sm text-gray-300 mb-4">
          <span className="font-semibold text-primary">{groupName}</span> 그룹에
          초대되었어요.
        </p>

        {!loggedIn ? (
          <>
            <p className="text-sm text-text-3  mb-4">
              참여하려면 먼저 로그인해 주세요.
            </p>
            <button
              onClick={handleGoLogin}
              className="w-full p-3 bg-primary text-text-1  rounded-md text-sm font-semibold hover:bg-primary/80 transition"
            >
              로그인하고 참여하기
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-3  mb-4">
              <span className="font-semibold">{displayName}</span> 님으로 이
              그룹에 참여하시겠어요?
            </p>
            <button
              onClick={handleAccept}
              className="w-full p-3 bg-primary text-text-1  rounded-md text-sm font-semibold hover:bg-primary/80 transition"
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
