"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { useUserStore } from "@/stores/userStore";
import { groupAPI } from "@/lib/api/group";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

const AddGroupModal = ({ isOpen, onClose }: AddGroupModalProps) => {
  const { data } = useUserStore();
  const userId = data?.user?.id;

  const [name, setName] = useState("");
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [selectedGuildName, setSelectedGuildName] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 디스코드 서버 목록 관련 상태
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      ownerId: string;
      linkedGuildId?: string;
    }) => groupAPI.addGroups(payload), // 반드시 Promise 반환
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      onCloseModal();
    },
    onError: (error: any) => {
      setErrorMsg(error?.message ?? "그룹 생성에 실패했습니다.");
    },
  });

  // 디스코드 서버 목록 불러오기
  const fetchDiscordGuilds = async () => {
    setGuildsLoading(true);
    const { data, error } = await groupAPI.fetchDiscordGuilds();

    if (error) {
      console.error("Failed to fetch Discord guilds:", error);
      setErrorMsg(error);
      setGuilds([]);
    } else {
      setGuilds(data || []);
    }

    setGuildsLoading(false);
  };

  // step 2로 넘어갈 때 디스코드 서버 목록 불러오기
  useEffect(() => {
    if (step === 2 && guilds.length === 0) {
      fetchDiscordGuilds();
    }
  }, [step]);

  const onCloseModal = () => {
    onClose();
    setStep(1);
    setName("");
    setSelectedGuildId("");
    setSelectedGuildName("");
    setErrorMsg("");
    setIsDropdownOpen(false);
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("그룹 이름을 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("그룹 이름을 입력해 주세요.");
      return;
    }
    if (!userId) {
      setErrorMsg("로그인 정보가 없습니다.");
      return;
    }

    setErrorMsg("");

    createGroupMutation.mutate({
      name,
      ownerId: userId,
      linkedGuildId: selectedGuildId || undefined,
    });
  };

  const handleSelectGuild = (guild: DiscordGuild) => {
    setSelectedGuildId(guild.id);
    setSelectedGuildName(guild.name);
    setIsDropdownOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onCloseModal}>
      <h2 className="text-lg font-semibold text-white">새 그룹 만들기</h2>
      {step === 1 ? (
        <p className="mt-1 text-sm text-gray-400">
          함께 게임할 그룹을 생성해보세요!
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-400">
          기존 디스코드 채널과 연결할 수 있습니다!
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {step === 1 ? (
          <div>
            <label className="text-sm text-gray-300">그룹 이름</label>
            <input
              className="mt-1 w-full rounded-md bg-sub3 px-3 py-2 text-sm text-white outline-none ring-1 ring-sub3 focus:ring-2 focus:ring-discord"
              placeholder="예) Midnight Gamers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        ) : (
          <div className="relative">
            <label className="text-sm text-gray-300">디스코드 채널(선택)</label>

            {/* 드롭다운 버튼 */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="mt-1 w-full rounded-md bg-sub3 px-3 py-2 text-sm text-white outline-none ring-1 ring-sub3 focus:ring-2 focus:ring-discord flex justify-between items-center"
              disabled={guildsLoading}
            >
              <span
                className={selectedGuildName ? "text-white" : "text-gray-400"}
              >
                {guildsLoading ? "로딩 중..." : selectedGuildName || "선택하기"}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* 드롭다운 리스트 */}
            {isDropdownOpen && !guildsLoading && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-sub3 shadow-lg max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
                {guilds.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    연동된 디스코드 서버가 없습니다.
                  </div>
                ) : (
                  guilds.map((guild) => (
                    <button
                      key={guild.id}
                      type="button"
                      onClick={() => handleSelectGuild(guild)}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-discord/20 transition flex items-center gap-2"
                    >
                      {guild.icon && (
                        <img
                          src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                          alt={guild.name}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span>{guild.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {errorMsg && <p className="text-xs text-red-400 mt-1">{errorMsg}</p>}

        <div className="mt-2 flex justify-end gap-2">
          {step === 1 ? (
            <button
              type="button"
              onClick={onCloseModal}
              className="rounded-md px-3 py-1.5 text-xs text-gray-300 hover:bg-sub3 transition"
            >
              취소
            </button>
          ) : (
            <button
              type="button"
              onClick={onCloseModal}
              className="rounded-md px-3 py-1.5 text-xs text-gray-300 hover:bg-sub3 transition"
            >
              건너뛰기
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              className="rounded-md bg-discord px-4 py-1.5 text-xs font-medium text-white hover:bg-discord/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              onClick={(event) => handleNextStep(event)}
            >
              다음
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-discord px-4 py-1.5 text-xs font-medium text-white hover:bg-discord/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "생성 중..." : "디스코드 채널 연결"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AddGroupModal;
