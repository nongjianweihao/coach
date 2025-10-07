import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AttendanceGrid } from '../../components/AttendanceGrid';
import { CommentEditor } from '../../components/CommentEditor';
import { ExportPdfButton } from '../../components/ExportPdfButton';
import { ProgressChart } from '../../components/ProgressChart';
import { RadarChart } from '../../components/RadarChart';
import { SpeedInput, type SpeedRow } from '../../components/SpeedInput';
import { classesRepo } from '../../store/repositories/classesRepo';
import { sessionsRepo } from '../../store/repositories/sessionsRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import { generateId } from '../../store/repositories/utils';
import { db } from '../../store/db';
import type {
  AttendanceItem,
  ClassEntity,
  RankMove,
  SessionRecord,
  Student,
  TrainingNote,
  TrainingTemplate,
  WarriorPathNode,
  LessonWallet,
} from '../../types';
import { buildFreestyleProgress, buildSpeedSeries, latestRadar } from '../../utils/calc';
import { billingRepo } from '../../store/repositories/billingRepo';

interface FreestyleDraft {
  id: string;
  studentId: string;
  moveId: string;
  passed: boolean;
  note?: string;
}

export function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const classId = params.id!;
  const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [template, setTemplate] = useState<TrainingTemplate | null>(null);
  const [rankMoves, setRankMoves] = useState<RankMove[]>([]);
  const [warriorNodes, setWarriorNodes] = useState<WarriorPathNode[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [speedRows, setSpeedRows] = useState<SpeedRow[]>([]);
  const [notes, setNotes] = useState<TrainingNote[]>([]);
  const [freestyle, setFreestyle] = useState<FreestyleDraft[]>([]);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Record<string, LessonWallet>>({});

  useEffect(() => {
    async function load() {
      const cls = await classesRepo.get(classId);
      if (!cls) return;
      setClassEntity(cls);
      const studentList = await studentsRepo.list();
      const filtered = studentList.filter((student) => cls.studentIds.includes(student.id));
      setStudents(filtered);
      if (cls.templateId) {
        const tpl = await templatesRepo.get(cls.templateId);
        if (tpl) setTemplate(tpl);
      }
      const [moves, nodes] = await Promise.all([db.rankMoves.toArray(), db.warriorNodes.toArray()]);
      setRankMoves(moves);
      setWarriorNodes(nodes);
      const walletsList = await Promise.all(
        filtered.map(async (student) => [student.id, await billingRepo.calcWallet(student.id)] as const),
      );
      setWallets(Object.fromEntries(walletsList));
    }
    void load();
  }, [classId]);

  const startSession = () => {
    const newSession: SessionRecord = {
      id: generateId(),
      classId,
      date: new Date().toISOString(),
      templateId: classEntity?.templateId,
      attendance: students.map((student) => ({ studentId: student.id, present: true })),
      speed: [],
      freestyle: [],
      notes: [],
      closed: false,
      lessonConsume: 1,
    };
    setSession(newSession);
    setAttendance(newSession.attendance);
    setSpeedRows([]);
    setNotes([]);
    setFreestyle([]);
    setStatus(null);
  };

  const saveComment = (note: TrainingNote) => {
    setNotes((prev) => [...prev.filter((item) => item.studentId !== note.studentId), note]);
  };

  const addFreestyle = (draft: Omit<FreestyleDraft, 'id'>) => {
    setFreestyle((prev) => [...prev, { ...draft, id: generateId() }]);
  };

  const handleClose = async () => {
    if (!session) return;
    const record: SessionRecord = {
      ...session,
      attendance,
      speed: speedRows.map((row) => ({ ...row, id: generateId() })),
      freestyle: freestyle.map((item) => ({
        id: item.id,
        studentId: item.studentId,
        moveId: item.moveId,
        passed: item.passed,
        note: item.note,
      })),
      notes,
      closed: true,
      highlights: deriveHighlights(),
    };
    await sessionsRepo.upsert(record);
    setSession(record);
    setStatus('本节课程已同步到档案');
    const walletsList = await Promise.all(
      students.map(async (student) => [student.id, await billingRepo.calcWallet(student.id)] as const),
    );
    setWallets(Object.fromEntries(walletsList));
  };

  const deriveHighlights = () => {
    const highlights: string[] = [];
    const pr = speedRows.reduce<{ [studentId: string]: number }>((map, row) => {
      map[row.studentId] = Math.max(map[row.studentId] ?? 0, row.reps);
      return map;
    }, {});
    Object.entries(pr).forEach(([studentId, reps]) => {
      const student = students.find((item) => item.id === studentId);
      if (student) highlights.push(`${student.name} ${reps} 次刷新${reps >= 150 ? '高光' : '成绩'}!`);
    });
    freestyle
      .filter((item) => item.passed)
      .forEach((item) => {
        const student = students.find((stu) => stu.id === item.studentId);
        const move = rankMoves.find((mv) => mv.id === item.moveId);
        if (student && move) {
          highlights.push(`${student.name} 通过花样 ${move.name}`);
        }
      });
    return highlights.slice(0, 3);
  };

  const handleSpeedSubmit = (rows: SpeedRow[]) => {
    setSpeedRows((prev) => {
      const map = new Map(prev.map((row) => [`${row.studentId}-${row.mode}-${row.window}`, row]));
      rows.forEach((row) => {
        map.set(`${row.studentId}-${row.mode}-${row.window}`, row);
      });
      return Array.from(map.values());
    });
  };

  const profileData = useMemo(() => {
    if (!students.length) return [] as const;
    return students.map((student) => ({
      student,
      wallet: wallets[student.id],
    }));
  }, [students, wallets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{classEntity?.name ?? '班级详情'}</h1>
          <p className="text-sm text-slate-500">
            教练：{classEntity?.coachName} · 时间：{classEntity?.schedule ?? '未设置'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startSession}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            开始本节课
          </button>
          <ExportPdfButton targetId="class-report" filename={`${classEntity?.name ?? 'class'}-report.pdf`} />
        </div>
      </div>


      {status && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </div>
      )}


      {template && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">默认模板 · {template.name}</h2>
              <p className="text-xs text-slate-500">周期：{template.period} · 建议周数：{template.weeks ?? '—'}</p>
            </div>
          </div>
          <ol className="space-y-2 text-sm text-slate-600">
            {template.blocks.map((block, index) => (
              <li key={block.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{index + 1}. {block.title}</span>
                  <span className="text-xs text-slate-400">{block.durationMin ?? 0} min</span>
                </div>
                {block.notes && <p className="text-xs text-slate-500">{block.notes}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {session ? (
        <div className="grid gap-6 lg:grid-cols-2" id="class-report">
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">出勤与课消</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <label className="flex items-center gap-1">
                  <span>标准课时</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={session.lessonConsume ?? 1}
                    onChange={(event) =>
                      setSession((prev) =>
                        prev ? { ...prev, lessonConsume: Number(event.target.value) } : prev,
                      )
                    }
                    className="w-16 rounded-md border border-slate-200 px-2 py-1"
                  />
                </label>
              </div>
            </header>
            <AttendanceGrid students={students} value={attendance} onChange={setAttendance} />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">速度成绩</h2>
            <SpeedInput students={students} onSubmit={handleSpeedSubmit} />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">花样挑战</h2>
            <FreestyleEditor
              students={students}
              rankMoves={rankMoves}
              items={freestyle}
              onAdd={addFreestyle}
              onToggle={(id) =>
                setFreestyle((prev) =>
                  prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item)),
                )
              }
              onRemove={(id) => setFreestyle((prev) => prev.filter((item) => item.id !== id))}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">教练点评</h2>
            <div className="grid gap-3">
              {students.map((student) => (
                <div key={student.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-700">{student.name}</p>
                  <CommentEditor studentId={student.id} onSave={saveComment} />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">今日亮点卡</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {deriveHighlights().map((item, index) => (
                <li key={index} className="rounded-lg bg-amber-50 px-3 py-2">
                  {item}
                </li>
              ))}
              {!deriveHighlights().length && <li className="text-slate-400">结课后自动生成亮点</li>}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">同步与导出</h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              结束课程并同步
            </button>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          点击「开始本节课」进入上课面板。
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">班级资产</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profileData.map(({ student, wallet }) => (
            <div key={student.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-500">段位 L{student.currentRank ?? '-'} · 余额 {wallet?.remaining ?? 0} 节</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AnalyticsSection classId={classId} students={students} warriorNodes={warriorNodes} />
    </div>
  );
}

interface FreestyleEditorProps {
  students: Student[];
  rankMoves: RankMove[];
  items: FreestyleDraft[];
  onAdd: (item: Omit<FreestyleDraft, 'id'>) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function FreestyleEditor({ students, rankMoves, items, onAdd, onToggle, onRemove }: FreestyleEditorProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [moveId, setMoveId] = useState(rankMoves[0]?.id ?? '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!studentId && students.length) setStudentId(students[0].id);
  }, [studentId, students]);
  useEffect(() => {
    if (!moveId && rankMoves.length) setMoveId(rankMoves[0].id);
  }, [moveId, rankMoves]);

  const handleAdd = () => {
    if (!studentId || !moveId) return;
    onAdd({ studentId, moveId, passed: true, note });
    setNote('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">学员</span>
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">动作</span>
          <select
            value={moveId}
            onChange={(event) => setMoveId(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {rankMoves.map((move) => (
              <option key={move.id} value={move.id}>
                L{move.rank} - {move.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid flex-1 gap-1">
          <span className="text-xs text-slate-500">备注</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="通关细节或提醒"
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          记录
        </button>
      </div>
      <div className="space-y-2 text-sm">
        {items.map((item) => {
          const student = students.find((stu) => stu.id === item.studentId);
          const move = rankMoves.find((mv) => mv.id === item.moveId);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-700">
                  {student?.name} · {move?.name}
                </p>
                {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.passed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {item.passed ? '通过' : '未过'}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
        {!items.length && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-slate-400">
            暂无记录
          </div>
        )}
      </div>
    </div>
  );
}

interface AnalyticsSectionProps {
  classId: string;
  students: Student[];
  warriorNodes: WarriorPathNode[];
}

function AnalyticsSection({ classId, students, warriorNodes }: AnalyticsSectionProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [radars, setRadars] = useState<Record<string, ReturnType<typeof latestRadar>>>({});

  useEffect(() => {
    async function load() {
      const [sessionList, radarMapEntries] = await Promise.all([
        sessionsRepo.listByClass(classId),
        Promise.all(
          students.map(async (student) => {
            const tests = await testsRepo.listResultsByStudent(student.id);
            return [student.id, latestRadar(tests)] as const;
          }),
        ),
      ]);
      setSessions(sessionList);
      setRadars(Object.fromEntries(radarMapEntries));
    }
    if (students.length) void load();
  }, [classId, students]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">训练分析</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {students.map((student) => {
          const speedSeries = buildSpeedSeries(sessions, 'single', 30, student.id);
          const freestyleSeries = buildFreestyleProgress(
            sessions.filter((session) => session.attendance.some((a) => a.studentId === student.id)),
            warriorNodes,
            student.id,
          );
          return (
            <div key={student.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-500">段位 L{student.currentRank ?? '-'} </p>
                </div>
              </div>
              <ProgressChart title="速度曲线 (30s 单摇)" series={speedSeries} />
              <ProgressChart title="勇士进阶积分" series={freestyleSeries} />
              <RadarChart data={radars[student.id] ?? undefined} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
