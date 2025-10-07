export type ID = string;
export type ISODate = string;

export type Period = 'PREP' | 'SPEC' | 'COMP';
export type WindowSec = 10 | 20 | 30 | 60;
export type JumpMode = 'single' | 'double';

export interface RankMove {
  id: ID;
  rank: number;
  name: string;
  tags?: string[];
  description?: string;
  criteria?: string;
}

export interface WarriorPathNode {
  id: ID;
  rank: number;
  title: string;
  moveIds: ID[];
  points: number;
}

export type FitnessQuality =
  | 'speed'
  | 'power'
  | 'endurance'
  | 'coordination'
  | 'agility'
  | 'balance'
  | 'flexibility'
  | 'core'
  | 'accuracy';

export interface GameDrill {
  id: ID;
  name: string;
  qualityTags: FitnessQuality[];
  description?: string;
}

export interface TemplateBlock {
  id: ID;
  title: string;
  period: Period | 'ALL';
  durationMin?: number;
  rankMoveIds?: ID[];
  qualities?: FitnessQuality[];
  gameIds?: ID[];
  notes?: string;
}

export interface TrainingTemplate {
  id: ID;
  name: string;
  period: Period;
  weeks?: number;
  blocks: TemplateBlock[];
  createdAt: ISODate;
}

export interface Student {
  id: ID;
  name: string;
  gender?: 'M' | 'F';
  birth?: ISODate;
  guardian?: { name: string; phone?: string };
  joinDate?: ISODate;
  currentRank?: number;
  tags?: string[];
}

export interface ClassEntity {
  id: ID;
  name: string;
  coachName: string;
  schedule?: string;
  templateId?: ID;
  studentIds: ID[];
}

export interface AttendanceItem {
  studentId: ID;
  present: boolean;
  remark?: string;
}

export interface SpeedRecord {
  id: ID;
  studentId: ID;
  mode: JumpMode;
  window: WindowSec;
  reps: number;
}

export interface FreestyleChallengeRecord {
  id: ID;
  studentId: ID;
  moveId: ID;
  passed: boolean;
  note?: string;
}

export interface TrainingNote {
  id: ID;
  studentId: ID;
  rating?: number;
  comments?: string;
  tags?: string[];
}

export interface SessionRecord {
  id: ID;
  classId: ID;
  date: ISODate;
  templateId?: ID;
  attendance: AttendanceItem[];
  speed: SpeedRecord[];
  freestyle: FreestyleChallengeRecord[];
  notes: TrainingNote[];
  closed: boolean;
  lessonConsume?: number;
  consumeOverrides?: Array<{ studentId: ID; consume: number }>;
  highlights?: string[];
}

export interface FitnessTestItem {
  id: ID;
  name: string;
  quality: FitnessQuality;
  unit: 'count' | 'cm' | 's' | 'grade';
}

export interface FitnessTestResult {
  id: ID;
  studentId: ID;
  quarter: string;
  date: ISODate;
  items: Array<{ itemId: ID; value: number }>;
  radar: Record<FitnessQuality, number>;
}

export interface RankExamRecord {
  id: ID;
  studentId: ID;
  date: ISODate;
  fromRank: number;
  toRank: number;
  passed: boolean;
  notes?: string;
}

export interface StudentProfileSnapshot {
  student: Student;
  sessions: SessionRecord[];
  speedSeries: Array<{ date: ISODate; window: WindowSec; mode: JumpMode; reps: number }>;
  freestyleProgress: Array<{ date: ISODate; rank: number; score: number }>;
  latestRadar?: Record<FitnessQuality, number>;
  latestRank?: number;
  wallet?: LessonWallet;
  metrics?: MetricsSnapshot;
}

export interface LessonPackage {
  id: ID;
  studentId: ID;
  purchasedLessons: number;
  price: number;
  unitPrice?: number;
  purchasedAt: ISODate;
  remark?: string;
}

export interface LessonWallet {
  studentId: ID;
  totalPurchased: number;
  totalConsumed: number;
  remaining: number;
}

export interface PaymentRecord {
  id: ID;
  studentId: ID;
  packageId: ID;
  amount: number;
  method?: 'cash' | 'wechat' | 'alipay' | 'card' | 'other';
  paidAt: ISODate;
}

export interface Recommendation {
  id: ID;
  studentId: ID;
  createdAt: ISODate;
  reason: string;
  templateId?: ID;
  applied: boolean;
}

export interface MetricsSnapshot {
  id: ID;
  studentId: ID;
  weekOf: ISODate;
  speedDelta: number;
  freestyleDelta: number;
  attendanceRate: number;
  wellnessRate: number;
  parentNps?: number;
}

export interface Benchmark {
  id: ID;
  quality: FitnessQuality;
  ageMin: number;
  ageMax: number;
  gender?: 'M' | 'F';
  unit: 'count' | 'cm' | 's' | 'grade';
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
}
