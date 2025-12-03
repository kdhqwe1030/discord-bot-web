"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { DiscordData, DiscordProfile } from "@/types/discord";

export interface LolAccount {
  id: string;
  user_id: string;
  puuid: string;
  game_name: string;
  tag_line: string;
  tier_flex: string | null;
  point_flex: number | null;
  created_at: string;
}

export type ApiUserResponse = {
  user: User | null; // supabase user 객체
  discordLinked: boolean;
  discordProfile: DiscordProfile | null;
  discordData: DiscordData | null;
  lolAccount: LolAccount | null;
  riotLinked: boolean;
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
