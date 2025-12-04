import api, { ApiResponse } from "./client";
import type { User } from "@supabase/supabase-js";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
}

interface AuthRes {
  message: string;
  user: User;
}

export const authAPI = {
  // 로그인
  login: async (loginData: LoginData): Promise<ApiResponse<AuthRes>> => {
    try {
      const response = await api.post("/auth/login", loginData);
      const result = response.data;

      console.log(result.data);
      return { data: result.data };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.error || error.message || "로그인에 실패했습니다.",
      };
    }
  },

  // 회원가입
  register: async (
    registerData: RegisterData
  ): Promise<ApiResponse<AuthRes>> => {
    try {
      const response = await api.post("/auth/register", registerData);
      const result = response.data;

      return { data: result.data };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.error || error.message || "회원가입에 실패했습니다.",
      };
    }
  },

  // 로그아웃
  logout: async (): Promise<ApiResponse<AuthRes>> => {
    try {
      const response = await api.post("/auth/logout");
      const result = response.data;

      return { data: result.data };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.error || error.message || "로그아웃에 실패했습니다.",
      };
    }
  },
};
