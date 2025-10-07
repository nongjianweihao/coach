import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classesRepo } from '../../store/repositories/classesRepo';
import type { ClassEntity } from '../../types';
import { DataTable } from '../../components/DataTable';

export function ClassesIndexPage() {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classesRepo.list().then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">班级管理</h1>
          <p className="text-sm text-slate-500">查看班级排课与当前学员组成。</p>
        </div>
        <Link
          to="/classes/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          新建班级
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          正在加载班级...
        </div>
      ) : (
        <DataTable
          data={classes}
          columns={[
            {
              key: 'name',
              header: '班级',
              cell: (item) => (
                <Link to={`/classes/${item.id}`} className="font-medium text-brand-600">
                  {item.name}
                </Link>
              ),
            },
            {
              key: 'coach',
              header: '教练',
              cell: (item) => item.coachName,
            },
            {
              key: 'schedule',
              header: '上课时间',
              cell: (item) => item.schedule ?? '未设置',
            },
            {
              key: 'students',
              header: '学员数量',
              cell: (item) => item.studentIds.length,
            },
          ]
          emptyMessage="尚未创建班级"
        />
      )}
    </div>
  );
}
