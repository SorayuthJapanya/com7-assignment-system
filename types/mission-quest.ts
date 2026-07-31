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
// 🆕 1 แถว = 1 user พร้อมจำนวนครั้งสะสม "ตลอดกาล" ของแต่ละ bucket (ตั้งแต่วันที่ track หรือวันที่ reset ล่าสุด)
export interface BonusLeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  username: string;
  buckets: number[]; // length เท่ากับ BonusBucketMeta[] เรียงลำดับตรงกัน
  bucketEntries: BonusBucketEntry[][];
  total: number; // ผลรวมจำนวนครั้งทุก bucket
  missionsDone: number; // จำนวนครั้งที่ claim mission สะสม
  bonusEarned: number; // ส่วนโบนัส/เพนัลตี้จาก % ความเร็ว + mission claim (ติดลบได้)
  totalPoints: number; // คะแนนรวมจากตาราง Score
}

export type BonusBucketEntry = {
  id: string;
  assignmentId: string;
  title: string;
  deadline: string;   // ISO string
  submitAt: string;   // ISO string
  reward: number;
};


export interface BonusTableData {
  buckets: BonusBucketMeta[];
  leaderboard: BonusLeaderboardRow[];
  cycleStart: string; // 🆕 ISO string — วันที่เริ่มนับสะสมของรอบปัจจุบัน (อัปเดตเมื่อ SuperAdmin กด Reset)
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
  bonusTable: BonusTableData; // 🆕 เปลี่ยนจาก BonusTableRow[] เป็น object
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