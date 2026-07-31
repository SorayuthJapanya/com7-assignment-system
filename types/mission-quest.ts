// types/mission-quest.ts

export type MissionCategory =
  | "punctual"
  | "respond"
  | "quality"
  | "volume"
  | "report"
  | "team"
  | "growth"
  | "volunteer"
  | "legendary";

export interface MissionQuestKpis {
  missionsDone: number;
  missionsTotal: number;
  streakDays: number;
  bonusEarned: number;
  daysLeft: number;
}

export interface Mission {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: MissionCategory;
  categoryLabel: string;
  rewardPoints: number;
  current: number;
  target: number;
  progressLabel: string;
  progressPct: number;
  progressColor: "teal" | "pink" | "blue" | "purple" | "gold" | "green";
  isCompleted: boolean;
  isClaimed?: boolean;
}

export interface MissionSectionData {
  key: string;
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  countLabel: string;
  missions: Mission[];
}

// 🆕 เมทาดาต้าของแต่ละ "สถานการณ์" (คอลัมน์ตายตัว 7 คอลัมน์ เหมือนเหรียญโอลิมปิก)
export interface BonusBucketMeta {
  key: string; // ใช้ผูก index กับ leaderboard.buckets[]
  emoji: string;
  situation: string;
  condition: string;
  modifierLabel: string;
  modifierType: "positive" | "neutral" | "negative";
  exampleReward: number;
}

// 🆕 1 แถว = 1 user พร้อมจำนวนครั้งสะสมของแต่ละ bucket ในเดือนนี้
export interface BonusLeaderboardRow {
  rank: number;
  userId?: string;        // 🔑 ปรับเป็น Optional เพื่อรองรับ mock data
  name: string;
  username: string;
  buckets: number[]; // length เท่ากับ BonusBucketMeta[] เรียงลำดับตรงกัน
  bucketEntries: BonusBucketEntry[][];
  total: number; // ผลรวมจำนวนครั้งทุก bucket
  missionsDone?: number; // 🔑 ปรับเป็น Optional
  bonusEarned?: number;  // 🔑 ปรับเป็น Optional
  totalPoints?: number;  // 🔑 ปรับเป็น Optional
}

export type BonusBucketEntry = {
  assignmentId: string;
  deadline: string;   // ISO string
  submitAt: string;   // ISO string
  id?: string;        
  title?: string;     
  reward?: number;    
  diffDays?: number;  
};

export interface BonusTableData {
  buckets: BonusBucketMeta[];
  leaderboard: BonusLeaderboardRow[];
  cycleStart?: string; // 🔑 ปรับเป็น Optional — ISO string วันที่เริ่มนับสะสมของรอบปัจจุบัน
}

export interface RewardBreakdownItem {
  label: string;
  value: number;
  emoji: string;
}

export interface MissionQuestSummary {
  potentialBonusPoints: number;
  totalMissions: number;
  breakdown: RewardBreakdownItem[];
}

export interface MissionCategoryChartPoint {
  name: string;
  value: number;
}

export interface MissionProgressChartPoint {
  category: string;
  progressPct: number;
}

export interface MissionQuestResponse {
  kpis: MissionQuestKpis;
  sections: MissionSectionData[];
  bonusTable: BonusTableData;
  summary: MissionQuestSummary;
  categoryChart: MissionCategoryChartPoint[];
  progressChart: MissionProgressChartPoint[];
}

export interface MissionQuestParams {
  year?: number | null;
  month?: number | null;
}

export interface RedeemMissionRequest {
  missionId: string;
}

export interface RedeemMissionResponse {
  message: string;
  rewardPoints: number;
  newTotalScore?: number;
}