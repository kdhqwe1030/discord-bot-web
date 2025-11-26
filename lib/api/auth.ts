import { apiClient } from "./client";
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

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface AuthRes {
  message: string;
  user: User;
}

export const authAPI = {
  // 로그인
  login: async (loginData: LoginData): Promise<ApiResponse<AuthRes>> => {
    try {
      const response = await apiClient.post("/api/auth/login", loginData);
      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || "로그인에 실패했습니다." };
      }
      console.log(result.data);
      return { data: result.data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "로그인에 실패했습니다.",
      };
    }
  },

  // 회원가입
  register: async (
    registerData: RegisterData
  ): Promise<ApiResponse<AuthRes>> => {
    try {
      const response = await apiClient.post("/api/auth/register", registerData);
      const result = await response.json();

      if (!response.ok)
        return { error: result.error || "회원가입에 실패했습니다." };

      return { data: result.data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "회원가입에 실패했습니다.",
      };
    }
  },

  // 로그아웃
  logout: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post("/api/auth/logout");
      const result = await response.json();

      if (!response.ok)
        return { error: result.error || "로그아웃에 실패했습니다." };

      return { data: result.data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "로그아웃에 실패했습니다.",
      };
    }
  },
};
