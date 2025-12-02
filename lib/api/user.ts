import api from "./client";

interface Invitation {
  group_id: string;
  groups?: { name: string };
}

export const userAPI = {
  fetchMe: async () => {
    try {
      const res = await api.get("/user/me");
      return res.data;
    } catch (error: any) {
      return {
        user: null,
        discordLinked: false,
        discordProfile: null,
        discordData: null,
        message: `status ${error.response?.status}`,
      };
    }
  },
  addRiotAccount: async (riotUsername: string) => {
    try {
      const res = await api.post("/user/riot", { riotUsername });
      return res.data;
    } catch (error: any) {
      return {
        success: false,
        message: `status ${error.response?.status}`,
      };
    }
  },
  fetchInvite: async (token: string) => {
    try {
      const res = await api.get(`/invites/${token}`);
      return { data: res.data.invitation as Invitation };
    } catch (error: any) {
      return {
        error: error.response?.data?.error || "초대 정보를 불러오지 못했습니다.",
      };
    }
  },
  acceptInvite: async (token: string) => {
    try {
      const res = await api.post(`/invites/${token}`);
      return { data: res.data };
    } catch (error: any) {
      return {
        error: error.response?.data?.error || "초대 수락 중 오류가 발생했습니다.",
      };
    }
  },
};
