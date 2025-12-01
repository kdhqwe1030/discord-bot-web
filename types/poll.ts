// types/poll.ts

export interface Vote {
  id: string;
  poll_id: string;
  user_id: number;
  voted_at: string;
  option_id: string;
  user_name: string;
}

export interface PollOption {
  id: string;
  label: string;
  poll_id: string;
  created_at: string;
}

export interface Poll {
  id: string;
  channel_id: string;
  title: string;
  created_by: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  message_id: string;
  guild_id: string;
  poll_options: PollOption[];
  votes: Vote[];
}

// 프론트엔드에서 사용할 가공된 투표 데이터 타입
export interface PollWithResults {
  id: string;
  channelId: string;
  title: string;
  createdBy: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  messageId: string;
  guildId: string;
  options: PollOptionWithVotes[];
  totalVotes: number;
}

export interface PollOptionWithVotes {
  id: string;
  label: string;
  voteCount: number;
  percentage: number;
  voters: {
    userId: number;
    userName: string;
    votedAt: string;
  }[];
}
