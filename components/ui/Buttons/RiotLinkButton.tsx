"use client";

import Modal from "@/components/Modal";
import { userAPI } from "@/lib/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiRiotgames } from "react-icons/si";

const RiotLinkButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-riot px-2 py-1 text-sm font-medium text-white hover:bg-riot-dark transition-colors"
      >
        <SiRiotgames className="w-4 h-4" />
        <span>Riot 계정 연결</span>
      </button>

      <RiotLinkModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default RiotLinkButton;

const RiotLinkModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const linkRiotMutation = useMutation({
    mutationFn: (payload: { gameName: string; tagLine: string }) =>
      userAPI.addRiotAccount(payload.gameName, payload.tagLine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onCloseModal();
    },
    onError: (error: any) => {
      setErrorMsg(error?.message ?? "라이엇 계정 연결에 실패했습니다.");
    },
  });

  const onCloseModal = () => {
    onClose();
    setGameName("");
    setTagLine("");
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameName.trim()) {
      setErrorMsg("게임 이름을 입력해 주세요.");
      return;
    }

    if (!tagLine.trim()) {
      setErrorMsg("태그라인을 입력해 주세요.");
      return;
    }

    setErrorMsg("");
    linkRiotMutation.mutate({ gameName, tagLine });
  };

  return (
    <Modal isOpen={isOpen} onClose={onCloseModal}>
      <h2 className="text-lg font-semibold text-text-1">
        라이엇 계정 연동하기
      </h2>

      <p className="mt-1 text-sm text-text-3">
        리그 오브 레전드 닉네임과 태그를 입력해주세요.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-2">
            <label className="text-sm text-gray-300">닉네임</label>
            <input
              className="mt-1 w-full rounded-md bg-surface-3 px-3 py-2 text-sm text-text-1 outline-none focus:ring-2 focus:ring-discord"
              placeholder="Faker"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-300">태그</label>
            <input
              className="mt-1 w-full rounded-md bg-surface-3 px-3 py-2 text-sm text-text-1 outline-none focus:ring-2 focus:ring-discord"
              placeholder="#KR1"
              value={tagLine}
              onChange={(e) => setTagLine(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && <p className="text-xs text-error mt-1">{errorMsg}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCloseModal}
            className="rounded-md px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-3 transition"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={linkRiotMutation.isPending}
            className="rounded-md bg-riot px-4 py-1.5 text-xs font-medium text-white hover:bg-riot-dark disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {linkRiotMutation.isPending ? "연동 중..." : "계정 연동"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
