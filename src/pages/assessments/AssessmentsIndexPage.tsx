import { useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import type { FitnessTestItem, FitnessTestResult, RankExamRecord, Student } from '../../types';
import { generateId } from '../../store/repositories/utils';
import { normalizeScore } from '../../utils/calc';
import { db } from '../../store/db';

export function AssessmentsIndexPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [items, setItems] = useState<FitnessTestItem[]>([]);
  const [results, setResults] = useState<FitnessTestResult[]>([]);
  const [rankExams, setRankExams] = useState<RankExamRecord[]>([]);
  const [form, setForm] = useState({ studentId: '', quarter: '2025Q1', itemId: '', value: 0 });
  const [examForm, setExamForm] = useState({ studentId: '', toRank: 1, passed: true, notes: '' });

  useEffect(() => {
    async function load() {
      const [studentList, itemList] = await Promise.all([studentsRepo.list(), db.fitnessTestItems.toArray()]);
      setStudents(studentList);
      setItems(itemList);
      if (studentList.length) {
        setForm((prev) => ({ ...prev, studentId: studentList[0].id }));
        setExamForm((prev) => ({ ...prev, studentId: studentList[0].id }));
      }
      if (itemList.length) {
        setForm((prev) => ({ ...prev, itemId: itemList[0].id }));
      }
      const allResults = await Promise.all(studentList.map((student) => testsRepo.listResultsByStudent(student.id)));
      setResults(allResults.flat());
      const exams = await Promise.all(studentList.map((student) => testsRepo.listRankExams(student.id)));
      setRankExams(exams.flat());
    }
    void load();
  }, []);

  const handleAddResult = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedItem = items.find((item) => item.id === form.itemId);
    if (!selectedItem) return;
    const student = students.find((s) => s.id === form.studentId);
    const value = Number(form.value);
    const benchmarks = await db.benchmarks.toArray();
    const radar = {
      [selectedItem.quality]: normalizeScore(value, selectedItem.quality, {
        benchmarks,
        student,
      }),
    } as FitnessTestResult['radar'];
    const result: FitnessTestResult = {
      id: generateId(),
      studentId: form.studentId,
      quarter: form.quarter,
      date: new Date().toISOString(),
      items: [{ itemId: selectedItem.id, value }],
      radar,
    };
    await testsRepo.upsertResult(result);
    setResults((prev) => [result, ...prev]);
  };

  const handleAddExam = async (event: React.FormEvent) => {
    event.preventDefault();
    const record: RankExamRecord = {
      id: generateId(),
      studentId: examForm.studentId,
      date: new Date().toISOString(),
      fromRank: students.find((s) => s.id === examForm.studentId)?.currentRank ?? 0,
      toRank: examForm.toRank,
      passed: examForm.passed,
      notes: examForm.notes,
    };
    await testsRepo.upsertRankExam(record);
    if (record.passed) {
      const current = await studentsRepo.get(record.studentId);
      if (current) {
        await studentsRepo.upsert({ ...current, currentRank: record.toRank });
        setStudents((prev) => prev.map((stu) => (stu.id === current.id ? { ...stu, currentRank: record.toRank } : stu)));
      }
    }
    setRankExams((prev) => [record, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">测评与段位</h1>
        <p className="text-sm text-slate-500">录入季度体能测评数据与段位升级结果。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleAddResult} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">体能测评</h2>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">学员</span>
            <select
              value={form.studentId}
              onChange={(event) => setForm((prev) => ({ ...prev, studentId: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">季度</span>
            <input
              value={form.quarter}
              onChange={(event) => setForm((prev) => ({ ...prev, quarter: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">项目</span>
            <select
              value={form.itemId}
              onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">选择项目</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">成绩</span>
            <input
              type="number"
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            保存测评
          </button>
        </form>

        <form onSubmit={handleAddExam} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">段位考核</h2>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">学员</span>
            <select
              value={examForm.studentId}
              onChange={(event) => setExamForm((prev) => ({ ...prev, studentId: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">升级段位</span>
            <input
              type="number"
              min={1}
              max={9}
              value={examForm.toRank}
              onChange={(event) => setExamForm((prev) => ({ ...prev, toRank: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={examForm.passed}
              onChange={(event) => setExamForm((prev) => ({ ...prev, passed: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-500"
            />
            <span className="text-slate-700">通过</span>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">备注</span>
            <textarea
              value={examForm.notes}
              onChange={(event) => setExamForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
              rows={3}
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            记录段位
          </button>
        </form>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">测评历史</h2>
        <DataTable
          data={results}
          columns={[
            {
              key: 'student',
              header: '学员',
              cell: (item) => students.find((s) => s.id === item.studentId)?.name ?? '',
            },
            {
              key: 'quarter',
              header: '季度',
              cell: (item) => item.quarter,
            },
            {
              key: 'item',
              header: '项目',
              cell: (item) =>
                item.items
                  .map((entry) => `${items.find((i) => i.id === entry.itemId)?.name ?? ''} ${entry.value}`)
                  .join(' / '),
            },
          ]}
          emptyMessage="暂无测评"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">段位考核记录</h2>
        <DataTable
          data={rankExams}
          columns={[
            {
              key: 'student',
              header: '学员',
              cell: (item) => students.find((s) => s.id === item.studentId)?.name ?? '',
            },
            {
              key: 'date',
              header: '日期',
              cell: (item) => new Date(item.date).toLocaleDateString(),
            },
            {
              key: 'rank',
              header: '调整',
              cell: (item) => `${item.fromRank} → ${item.toRank}`,
            },
            {
              key: 'passed',
              header: '结果',
              cell: (item) => (item.passed ? '通过' : '待提升'),
            },
          ]}
          emptyMessage="暂无段位记录"
        />
      </section>
    </div>
  );
}
