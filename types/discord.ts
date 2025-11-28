export type Group = {
  id: string;
  name: string;
  owner_id: string | null;
  linked_guild_id: string | null;
  created_at: string; // ISO 날짜 문자열
};

export type GroupMembership = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  group?: Group;
};

// poll 옵션 / 투표 타입
export type PollOption = {
  id: string;
  label: string;
  poll_id: string;
  created_at: string;
};

export type Vote = {
  id: string;
  poll_id: string;
  user_id: number; // Discord user_id라 bigint → number로 직렬화된 상태
  voted_at: string;
  option_id: string;
  user_name: string;
};

// poll + 옵션 + 투표 묶은 타입
export type PollWithRelations = {
  id: string;
  channel_id: string;
  title: string;
  created_by: number;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  message_id: string | null;
  guild_id: string;
  poll_options: PollOption[];
  votes: Vote[];
};

// discord_profiles 테이블 한 줄
export type DiscordProfile = {
  user_id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  guilds: unknown | null; // 나중에 구조 정해지면 타입 좁히기
  created_at: string;
  connected: boolean;
};

// /api/user/me 에서 내려주는 discordData
export type DiscordData = {
  groupsOwned: Group[];
  groupMemberships: GroupMembership[];
  pollsCreated: PollWithRelations[];
};
