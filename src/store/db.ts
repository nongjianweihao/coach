import Dexie, { type EntityTable } from 'dexie';
import type {
  Benchmark,
  ClassEntity,
  FitnessTestItem,
  FitnessTestResult,
  LessonPackage,
  PaymentRecord,
  RankExamRecord,
  Recommendation,
  SessionRecord,
  Student,
  TrainingTemplate,
  WarriorPathNode,
  RankMove,
  GameDrill,
  MetricsSnapshot,
} from '../types';

export class CoachDatabase extends Dexie {
  students!: EntityTable<Student, 'id'>;
  classes!: EntityTable<ClassEntity, 'id'>;
  templates!: EntityTable<TrainingTemplate, 'id'>;
  sessions!: EntityTable<SessionRecord, 'id'>;
  fitnessTestItems!: EntityTable<FitnessTestItem, 'id'>;
  fitnessTests!: EntityTable<FitnessTestResult, 'id'>;
  rankExams!: EntityTable<RankExamRecord, 'id'>;
  lessonPackages!: EntityTable<LessonPackage, 'id'>;
  payments!: EntityTable<PaymentRecord, 'id'>;
  recommendations!: EntityTable<Recommendation, 'id'>;
  benchmarks!: EntityTable<Benchmark, 'id'>;
  warriorNodes!: EntityTable<WarriorPathNode, 'id'>;
  rankMoves!: EntityTable<RankMove, 'id'>;
  gameDrills!: EntityTable<GameDrill, 'id'>;
  metrics!: EntityTable<MetricsSnapshot, 'id'>;

  constructor() {
    super('coach-db');

    this.version(1).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
    });
  }
}

export const db = new CoachDatabase();
