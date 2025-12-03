export interface Group {
  id: string;
  name: string;
  owner_id: string;
  linked_guild_id: string | null;
  created_at: string;
}

export interface MemberWithProfile {
  userId: string;
  role: string;
  joinedAt: string;
  avatarUrl: string;
  username: string;
  discordId: string;
  hasDiscord: boolean;
  hasRiot: boolean;
  tierFlex: string | null;
  matchCount: number | null;
  winRate: number | null;
}
