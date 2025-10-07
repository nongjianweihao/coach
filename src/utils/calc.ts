import type {
  Benchmark,
  FitnessQuality,
  FitnessTestResult,
  FreestyleChallengeRecord,
  SessionRecord,
  Student,
  WarriorPathNode,
  WindowSec,
  JumpMode,
} from '../types';

interface NormalizeOptions {
  benchmarks: Benchmark[];
  student?: Student;
}

export function normalizeScore(
  value: number,
  quality: FitnessQuality,
  { benchmarks, student }: NormalizeOptions,
): number {
  if (!Number.isFinite(value)) return 0;
  const age = student?.birth
    ? Math.max(4, Math.floor((Date.now() - new Date(student.birth).getTime()) / (365 * 24 * 3600 * 1000)))
    : undefined;
  const group = benchmarks.find((item) => {
    if (item.quality !== quality) return false;
    if (age && (age < item.ageMin || age > item.ageMax)) return false;
    if (student?.gender && item.gender && student.gender !== item.gender) return false;
    return true;
  });
  const min = group?.min ?? 0;
  const max = group?.max ?? 100;
  if (max === min) return 0;
  return Math.max(0, Math.min(100, Math.round(((value - min) / (max - min)) * 100)));
}

export function buildSpeedSeries(
  sessions: SessionRecord[],
  mode: JumpMode,
  window: WindowSec,
  studentId?: string,
): Array<{ date: string; score: number }> {
  return sessions
    .flatMap((session) =>
      session.speed
        .filter((record) =>
          record.mode === mode &&
          record.window === window &&
          (!studentId || record.studentId === studentId),
        )
        .map((record) => ({ date: session.date, score: record.reps })),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildFreestyleProgress(
  sessions: SessionRecord[],
  nodes: WarriorPathNode[],
  studentId?: string,
): Array<{ date: string; score: number }> {
  let cumulative = 0;
  const progress: Array<{ date: string; score: number }> = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  sessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((session) => {
      const points = session.freestyle.reduce((sum, record) => {
        if (!record.passed) return sum;
        if (studentId && record.studentId !== studentId) return sum;
        const node = nodeMap.get(record.moveId);
        if (node) {
          return sum + node.points;
        }
        return sum;
      }, 0);
      cumulative += points;
      progress.push({ date: session.date, score: cumulative });
    });
  return progress;
}

export function mergeFreestyleRecords(
  current: FreestyleChallengeRecord[],
  incoming: FreestyleChallengeRecord[],
): FreestyleChallengeRecord[] {
  const map = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((record) => {
    map.set(record.id, record);
  });
  return Array.from(map.values());
}

export function latestRadar(results: FitnessTestResult[]) {
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.radar;
}
