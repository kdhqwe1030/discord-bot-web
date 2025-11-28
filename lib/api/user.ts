import { apiClient } from "./client";

export const userAPI = {
  fetchMe: async () => {
    const res = await apiClient.get("/api/user/me");
    // 401/403 체크
    if (!res.ok) {
      return {
        user: null,
        discordLinked: false,
        discordProfile: null,
        discordData: null,
        message: `status ${res.status}`,
      };
    }

    return res.json();
  },
};
