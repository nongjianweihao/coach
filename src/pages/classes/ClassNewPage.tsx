import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesRepo } from '../../store/repositories/classesRepo';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import type { Student, TrainingTemplate } from '../../types';
import { generateId } from '../../store/repositories/utils';

export function ClassNewPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', coachName: '', schedule: '', templateId: '' });

  useEffect(() => {
    Promise.all([studentsRepo.list(), templatesRepo.list()]).then(([studentsData, templateData]) => {
      setStudents(studentsData);
      setTemplates(templateData);
    });
  }, []);

  const toggleStudent = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((sid) => sid !== id) : [...current, id],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = generateId();
    await classesRepo.upsert({
      id,
      name: form.name,
      coachName: form.coachName,
      schedule: form.schedule,
      templateId: form.templateId || undefined,
      studentIds: selectedIds,
    });
    navigate(`/classes/${id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">创建班级</h1>
        <p className="text-sm text-slate-500">填写班级基础信息并绑定学员。</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">班级名称</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">教练</span>
          <input
            required
            value={form.coachName}
            onChange={(event) => setForm((prev) => ({ ...prev, coachName: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">上课时间</span>
          <input
            value={form.schedule}
            onChange={(event) => setForm((prev) => ({ ...prev, schedule: event.target.value }))}
            placeholder="例如：周二 / 周五 18:30"
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">默认模板</span>
          <select
            value={form.templateId}
            onChange={(event) => setForm((prev) => ({ ...prev, templateId: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">暂不选择</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">绑定学员</h2>
        <p className="text-sm text-slate-500">可多选添加学员，后续可在班级详情调整。</p>
        <div className="mt-4 grid gap-2">
          {students.map((student) => (
            <label
              key={student.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{student.name}</p>
                <p className="text-xs text-slate-500">当前段位：L{student.currentRank ?? '-'} </p>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
                className="h-4 w-4 rounded border-slate-300 text-brand-500"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          创建班级并进入上课面板
        </button>
      </div>
    </form>
  );
}
