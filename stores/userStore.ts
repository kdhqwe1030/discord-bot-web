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
  data: ApiUserResponse | null;
  setData: (data: ApiUserResponse | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null }),
}));
