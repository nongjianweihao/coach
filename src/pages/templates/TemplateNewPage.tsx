import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateBuilder } from '../../components/TemplateBuilder';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import type { TrainingTemplate } from '../../types';
import { generateId } from '../../store/repositories/utils';

export function TemplateNewPage() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TrainingTemplate>({
    id: generateId(),
    name: '新模板',
    period: 'PREP',
    weeks: 4,
    blocks: [],
    createdAt: new Date().toISOString(),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await templatesRepo.upsert(template);
    navigate('/templates');
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">创建模板</h1>
        <p className="text-sm text-slate-500">定义周课表结构，可供多个班级复用。</p>
      </div>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">模板名称</span>
            <input
              value={template.name}
              onChange={(event) => setTemplate((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">周期</span>
            <select
              value={template.period}
              onChange={(event) => setTemplate((prev) => ({ ...prev, period: event.target.value as any }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="PREP">准备期</option>
              <option value="SPEC">专项准备期</option>
              <option value="COMP">比赛期</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">建议周数</span>
            <input
              type="number"
              value={template.weeks ?? 4}
              onChange={(event) => setTemplate((prev) => ({ ...prev, weeks: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <TemplateBuilder value={template} onChange={setTemplate} />
      </section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          保存模板
        </button>
      </div>
    </form>
  );
}
