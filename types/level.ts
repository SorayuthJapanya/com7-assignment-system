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
  profileImage?: string | null;
  totalScore: number;
  avgScore: number;
  assignmentCount: number;
  lateCount: number;
  overdueSeconds: number;
  level: ILevel | null;
  negativePoints?: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period?: { year: number; month: number } | null;
}

export interface RedeemStatus {
  totalScore: number;
  overdueSeconds: number;
  maxRedeemableMinutes: number;
  secondsPerMinute: number;
  remainingOverdueSeconds: number;
  negativePoints?: number;
}

export interface RedeemOverdueRequest {
  minutesToRedeem: number;
}

export interface RedeemOverdueResponse {
  success: boolean;
  minutesUsed: number;
  secondsReduced: number;
  remainingScore: number;
  remainingOverdueSeconds: number;
}

export interface RedeemNegativeRequest {
  pointsToDeduct: number;
}

export interface RedeemNegativeResponse {
  success: boolean;
  pointsDeducted: number;
  remainingNegativePoints: number;
  remainingTotalScore: number;
}