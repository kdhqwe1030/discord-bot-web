import { apiClient, ApiResponse } from "./client";
import type { PollWithResults } from "@/types/poll";

interface AddGroupsType {
  name: string;
  ownerId: string;
  linkedGuildId?: string;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

interface GroupMember {
  userId: string;
  role: string;
  avatarUrl: string;
  username: string;
}

interface Group {
  id: string;
  name: string;
  owner_id: string;
  linked_guild_id: string | null;
  created_at: string;
  memberCount: number;
  userRole: string;
  members: GroupMember[];
}

interface PollsResponse {
  polls: PollWithResults[];
  hasMore: boolean;
  nextPage: number | null;
  totalCount: number;
}

export const groupAPI = {
  // 그룹 목록 조회
  fetchGroups: async (): Promise<ApiResponse<Group[]>> => {
    try {
      const response = await apiClient.get("/api/groups");
      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || "그룹 목록 조회에 실패했습니다." };
      }

      return { data: result.groups || [] };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "그룹 목록 조회에 실패했습니다.",
      };
    }
  },

  // 그룹 생성
  addGroups: async (
    data: AddGroupsType
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post("/api/groups", data);
      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || "그룹 추가에 실패했습니다." };
      }

      return { data: result };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "그룹 추가에 실패했습니다.",
      };
    }
  },

  // Discord 서버 목록 조회
  fetchDiscordGuilds: async (): Promise<ApiResponse<DiscordGuild[]>> => {
    try {
      const response = await apiClient.get("/api/discord/guilds");
      const result = await response.json();

      if (!response.ok) {
        return {
          error: result.error || "Discord 서버 목록 조회에 실패했습니다.",
        };
      }

      return { data: result.guilds || [] };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Discord 서버 목록 조회에 실패했습니다.",
      };
    }
  },

  // 초대 링크 생성
  createInvite: async (groupId: string) => {
    const res = await fetch(`/api/groups/${groupId}/invites`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "초대 링크 생성에 실패했습니다.");
    }

    return data as { inviteUrl: string; invitation: any };
  },

  // 그룹 투표 목록 조회 (페이지네이션)
  fetchGroupPolls: async (
    groupId: string,
    page: number = 0
  ): Promise<PollsResponse> => {
    const response = await apiClient.get(
      `/api/groups/${groupId}/polls?page=${page}&limit=20`
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "투표 목록 조회에 실패했습니다.");
    }

    return result;
  },
};
