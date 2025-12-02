// components/group/GroupInviteModal.tsx
"use client";

import { useState } from "react";
import Modal from "../Modal";
import { groupAPI } from "@/lib/api/group";
import { useMutation } from "@tanstack/react-query";

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName?: string;
}

const GroupInviteModal = ({
  isOpen,
  onClose,
  groupId,
  groupName,
}: GroupInviteModalProps) => {
  const [inviteUrl, setInviteUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const createInviteMutation = useMutation({
    mutationFn: () => groupAPI.createInvite(groupId),
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      setErrorMsg("");
      setCopied(false);
    },
    onError: (error: any) => {
      setErrorMsg(error?.message ?? "초대 링크 생성에 실패했습니다.");
    },
  });

  const handleClose = () => {
    onClose();
    setInviteUrl("");
    setErrorMsg("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
      alert("클립보드 복사에 실패했습니다. 직접 복사해주세요.");
    }
  };
  console.log("📌 invite modal groupId =", groupId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-lg font-semibold text-text-1 ">그룹 초대 링크</h2>
      <p className="mt-1 text-sm text-text-3 ">
        {groupName ? (
          <>
            <span className="font-medium text-discord">{groupName}</span> 그룹에
            초대할 링크를 생성합니다.
          </>
        ) : (
          <>이 그룹에 초대할 링크를 생성합니다.</>
        )}
      </p>

      <div className="mt-4 space-y-3">
        {/* 링크 생성 버튼 */}
        {!inviteUrl && (
          <button
            type="button"
            onClick={() => createInviteMutation.mutate()}
            disabled={createInviteMutation.isPending}
            className="w-full rounded-md bg-discord px-4 py-2 text-sm font-medium text-text-1  hover:bg-discord/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {createInviteMutation.isPending
              ? "생성 중..."
              : "초대 링크 생성하기"}
          </button>
        )}

        {/* 생성된 링크 영역 */}
        {inviteUrl && (
          <div className="space-y-2">
            <label className="text-xs text-gray-300">생성된 초대 링크</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 rounded-md bg-surface-3  px-3 py-2 text-xs text-text-1  outline-none ring-1 ring-sub3 focus:ring-2 focus:ring-discord"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="whitespace-nowrap rounded-md bg-primary px-3 py-2 text-xs font-medium text-text-1  hover:bg-main/80 transition"
              >
                {copied ? "복사 완료!" : "복사"}
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              이 링크는 24시간 동안만 유효합니다. 만료되면 새로 생성해 주세요.
            </p>

            {/* 재생성 버튼 */}
            <button
              type="button"
              onClick={() => createInviteMutation.mutate()}
              disabled={createInviteMutation.isPending}
              className="mt-2 text-[11px] text-text-3  hover:text-gray-200 underline-offset-2 hover:underline"
            >
              {createInviteMutation.isPending
                ? "다시 생성 중..."
                : "새 링크로 다시 생성하기"}
            </button>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-error  mt-1 whitespace-pre-line">
            {errorMsg}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-3  transition"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GroupInviteModal;
