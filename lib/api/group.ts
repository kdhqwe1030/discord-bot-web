import api, { ApiResponse } from "./client";
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
      const response = await api.get("/groups");
      const result = response.data;

      return { data: result.groups || [] };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.error || error.message || "그룹 목록 조회에 실패했습니다.",
      };
    }
  },

  // 그룹 생성
  addGroups: async (
    data: AddGroupsType
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post("/groups", data);
      const result = response.data;

      return { data: result };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.error || error.message || "그룹 추가에 실패했습니다.",
      };
    }
  },

  // Discord 서버 목록 조회
  fetchDiscordGuilds: async (): Promise<ApiResponse<DiscordGuild[]>> => {
    try {
      const response = await api.get("/discord/guilds");
      const result = response.data;

      return { data: result.guilds || [] };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.error || error.message || "Discord 서버 목록 조회에 실패했습니다.",
      };
    }
  },

  // 초대 링크 생성
  createInvite: async (groupId: string) => {
    try {
      const res = await api.post(`/groups/${groupId}/invites`);
      return res.data as { inviteUrl: string; invitation: any };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "초대 링크 생성에 실패했습니다.");
    }
  },

  // 그룹 투표 목록 조회 (페이지네이션)
  fetchGroupPolls: async (
    groupId: string,
    page: number = 0
  ): Promise<PollsResponse> => {
    try {
      const response = await api.get(
        `/groups/${groupId}/polls?page=${page}&limit=20`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "투표 목록 조회에 실패했습니다.");
    }
  },
};
