import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExportPdfButton } from '../../components/ExportPdfButton';
import { ProgressChart } from '../../components/ProgressChart';
import { RadarChart } from '../../components/RadarChart';
import { DataTable } from '../../components/DataTable';
import { sessionsRepo } from '../../store/repositories/sessionsRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import { db } from '../../store/db';
import { billingRepo } from '../../store/repositories/billingRepo';
import type {
  LessonWallet,
  SessionRecord,
  Student,
  WarriorPathNode,
  RankMove,
} from '../../types';
import { buildFreestyleProgress, buildSpeedSeries, latestRadar } from '../../utils/calc';

export function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = params.id!;
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [wallet, setWallet] = useState<LessonWallet | null>(null);
  const [nodes, setNodes] = useState<WarriorPathNode[]>([]);
  const [rankMoves, setRankMoves] = useState<RankMove[]>([]);
  const [radar, setRadar] = useState<Record<string, number> | undefined>();

  useEffect(() => {
    async function load() {
      const [stu, sessionList, walletInfo, nodesData, moves, tests] = await Promise.all([
        studentsRepo.get(studentId),
        sessionsRepo.recent(50),
        billingRepo.calcWallet(studentId),
        db.warriorNodes.toArray(),
        db.rankMoves.toArray(),
        testsRepo.listResultsByStudent(studentId),
      ]);
      setStudent(stu ?? null);
      setSessions(sessionList.filter((session) => session.attendance.some((a) => a.studentId === studentId)));
      setWallet(walletInfo);
      setNodes(nodesData);
      setRankMoves(moves);
      setRadar(latestRadar(tests));
    }
    void load();
  }, [studentId]);

  const speedSeriesSingle = useMemo(
    () => buildSpeedSeries(sessions, 'single', 30, studentId).filter((item) => Boolean(item)),
    [sessions],
  );
  const speedSeriesDouble = useMemo(
    () => buildSpeedSeries(sessions, 'double', 30, studentId).filter((item) => Boolean(item)),
    [sessions],
  );
  const freestyleSeries = useMemo(
    () => buildFreestyleProgress(sessions, nodes, studentId),
    [sessions, nodes],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{student?.name ?? '学员档案'}</h1>
          <p className="text-sm text-slate-500">
            段位 L{student?.currentRank ?? '-'} · 课时余额 {wallet?.remaining ?? 0} 节
          </p>
        </div>
        <ExportPdfButton targetId="student-report" filename={`${student?.name ?? 'student'}-report.pdf`} />
      </div>

      <section
        id="student-report"
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">速度曲线</h2>
            <ProgressChart title="30s 单摇" series={speedSeriesSingle} />
            <ProgressChart title="30s 双摇" series={speedSeriesDouble} />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">花样进阶与雷达</h2>
            <ProgressChart title="勇士进阶积分" series={freestyleSeries} />
            <RadarChart data={radar as any} />
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">课时与购课记录</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="总购课时" value={`${wallet?.totalPurchased ?? 0} 节`} />
            <StatCard label="已消课" value={`${wallet?.totalConsumed ?? 0} 节`} />
            <StatCard label="剩余课时" value={`${wallet?.remaining ?? 0} 节`} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">最近课时记录</h2>
          <DataTable
            data={sessions.slice(0, 10)}
            columns={[
              {
                key: 'date',
                header: '日期',
                cell: (item) => new Date(item.date).toLocaleDateString(),
              },
              {
                key: 'attendance',
                header: '出勤',
                cell: (item) => (item.attendance.find((a) => a.studentId === studentId)?.present ? '到课' : '缺席'),
              },
              {
                key: 'speed',
                header: '速度亮点',
                cell: (item) => {
                  const record = item.speed
                    .filter((row) => row.studentId === studentId)
                    .sort((a, b) => b.reps - a.reps)[0];
                  return record ? `${record.window}s ${record.mode === 'single' ? '单摇' : '双摇'} ${record.reps}` : '—';
                },
              },
              {
                key: 'notes',
                header: '教练评语',
                cell: (item) => item.notes.find((note) => note.studentId === studentId)?.comments ?? '—',
              },
            ]}
            emptyMessage="暂无课时记录"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">段位动作库</h2>
          <div className="grid gap-2 text-sm text-slate-600">
            {rankMoves.map((move) => (
              <div key={move.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>
                  L{move.rank} · {move.name}
                </span>
                <span className="text-xs text-slate-400">{move.criteria}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}
