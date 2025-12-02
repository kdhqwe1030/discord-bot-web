"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { DiscordData, DiscordProfile } from "@/types/discord";

export type ApiUserResponse = {
  user: User | null; // supabase user 객체
  discordLinked: boolean;
  discordProfile: DiscordProfile | null;
  discordData: DiscordData | null;
  message?: string;
};

interface UserState {
  userData: ApiUserResponse | null;
  setData: (data: ApiUserResponse | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userData: null,
  setData: (userData) => set({ userData }),
  clear: () => set({ userData: null }),
}));
