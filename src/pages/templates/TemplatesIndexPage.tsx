import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import type { TrainingTemplate } from '../../types';

export function TemplatesIndexPage() {
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);

  useEffect(() => {
    templatesRepo.list().then(setTemplates);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">训练模板</h1>
          <p className="text-sm text-slate-500">维护周期课表与教学要点，班级可直接引用。</p>
        </div>
        <Link
          to="/templates/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          新建模板
        </Link>
      </div>
      <DataTable
        data={templates}
        columns={[
          {
            key: 'name',
            header: '名称',
            cell: (item) => item.name,
          },
          {
            key: 'period',
            header: '周期',
            cell: (item) => ({ PREP: '准备期', SPEC: '专项准备期', COMP: '比赛期' }[item.period]),
          },
          {
            key: 'blocks',
            header: '模块数',
            cell: (item) => item.blocks.length,
          },
          {
            key: 'createdAt',
            header: '创建时间',
            cell: (item) => new Date(item.createdAt).toLocaleDateString(),
          },
        ]}
        emptyMessage="暂无模板"
      />
    </div>
  );
}
