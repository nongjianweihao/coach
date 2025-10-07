import { NavLink } from 'react-router-dom';
import { GraduationCap, LineChart, NotebookPen, Settings2, Users, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

const navigation = [
  { to: '/classes', label: '班级', icon: GraduationCap },
  { to: '/students', label: '学员', icon: Users },
  { to: '/templates', label: '训练模板', icon: NotebookPen },
  { to: '/assessments', label: '测评', icon: LineChart },
  { to: '/finance', label: '财务', icon: Wallet },
  { to: '/settings', label: '配置', icon: Settings2, disabled: true },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-xl font-semibold text-slate-900">跳绳教练工作台</div>
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-600">
            {navigation.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <span
                    key={item.to}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-slate-400"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1 rounded-lg px-3 py-2 transition-all ${
                      isActive
                        ? 'bg-brand-100 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
