import { apiClient, ApiResponse } from "./client";

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
};
