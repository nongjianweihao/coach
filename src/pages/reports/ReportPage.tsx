import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExportPdfButton } from '../../components/ExportPdfButton';
import { ProgressChart } from '../../components/ProgressChart';
import { RadarChart } from '../../components/RadarChart';
import { sessionsRepo } from '../../store/repositories/sessionsRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import { billingRepo } from '../../store/repositories/billingRepo';
import type { LessonWallet, SessionRecord, Student, WarriorPathNode } from '../../types';
import { buildFreestyleProgress, buildSpeedSeries, latestRadar } from '../../utils/calc';
import { db } from '../../store/db';

export function ReportPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId!;
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [wallet, setWallet] = useState<LessonWallet | null>(null);
  const [radar, setRadar] = useState<Record<string, number> | undefined>();
  const [nodes, setNodes] = useState<WarriorPathNode[]>([]);

  useEffect(() => {
    async function load() {
      const [stu, sessionList, walletInfo, tests, nodesData] = await Promise.all([
        studentsRepo.get(studentId),
        sessionsRepo.recent(40),
        billingRepo.calcWallet(studentId),
        testsRepo.listResultsByStudent(studentId),
        db.warriorNodes.toArray(),
      ]);
      setStudent(stu ?? null);
      setSessions(sessionList.filter((session) => session.attendance.some((a) => a.studentId === studentId)));
      setWallet(walletInfo);
      setRadar(latestRadar(tests));
      setNodes(nodesData);
    }
    void load();
  }, [studentId]);

  const singleSeries = buildSpeedSeries(sessions, 'single', 30, studentId);
  const doubleSeries = buildSpeedSeries(sessions, 'double', 30, studentId);
  const freestyleSeries = buildFreestyleProgress(sessions, nodes, studentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">学员成长报告</h1>
          <p className="text-sm text-slate-500">{student?.name} · 段位 L{student?.currentRank ?? '-'} </p>
        </div>
        <ExportPdfButton targetId="report-sheet" filename={`${student?.name ?? 'student'}-quarter-report.pdf`} />
      </div>
      <section id="report-sheet" className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-700">课时余额</p>
            <p className="text-2xl font-semibold text-brand-600">{wallet?.remaining ?? 0} 节</p>
          </div>
          <div className="text-sm text-slate-600">
            <p>最近出勤：{sessions.slice(0, 5).map((s) => new Date(s.date).toLocaleDateString()).join(' / ')}</p>
            <p>总购课：{wallet?.totalPurchased ?? 0} 节 · 已消课 {wallet?.totalConsumed ?? 0} 节</p>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">速度成长</h2>
            <ProgressChart title="30s 单摇" series={singleSeries} />
            <ProgressChart title="30s 双摇" series={doubleSeries} />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">花样进阶 & 体能雷达</h2>
            <ProgressChart title="勇士进阶积分" series={freestyleSeries} />
            <RadarChart data={radar as any} />
          </div>
        </div>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">教练点评集锦</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {sessions
              .flatMap((session) =>
                session.notes.filter((note) => note.studentId === studentId && note.comments),
              )
              .slice(0, 5)
              .map((note) => (
                <li key={note.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-400">{new Date(note.id).toLocaleDateString?.() ?? ''}</div>
                  <div>{note.comments}</div>
                </li>
              ))}
            {!sessions.length && <li className="text-slate-400">暂无点评记录</li>}
          </ul>
        </section>
      </section>
    </div>
  );
}
