export interface ILevel {
  id: string;
  name: string;
  emoji: string;
  minScore: number;
  maxScore: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLevelRequest {
  name: string;
  emoji: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export interface UpdateLevelRequest {
  name?: string;
  emoji?: string;
  minScore?: number;
  maxScore?: number;
  color?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  nickname: string;
  totalScore: number;
  assignmentCount: number;
  level: ILevel | null;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period?: { year: number; month: number } | null;
}
