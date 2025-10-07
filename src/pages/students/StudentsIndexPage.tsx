import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import type { Student } from '../../types';

export function StudentsIndexPage() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    studentsRepo.list().then(setStudents);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">学员档案</h1>
          <p className="text-sm text-slate-500">查看所有学员信息、段位与课时余额。</p>
        </div>
        <Link
          to="/students/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          新增学员
        </Link>
      </div>
      <DataTable
        data={students}
        columns={[
          {
            key: 'name',
            header: '姓名',
            cell: (item) => (
              <Link to={`/students/${item.id}`} className="font-medium text-brand-600">
                {item.name}
              </Link>
            ),
          },
          {
            key: 'gender',
            header: '性别',
            cell: (item) => (item.gender === 'F' ? '女' : item.gender === 'M' ? '男' : '—'),
          },
          {
            key: 'rank',
            header: '段位',
            cell: (item) => (item.currentRank ? `L${item.currentRank}` : '—'),
          },
          {
            key: 'tags',
            header: '标签',
            cell: (item) => item.tags?.join(' / ') ?? '—',
          },
        ]}
        emptyMessage="暂未添加学员"
      />
    </div>
  );
}
