import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { billingRepo } from '../../store/repositories/billingRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import type { LessonWallet, PaymentRecord, Student } from '../../types';

export function FinanceDashboardPage() {
  const [wallets, setWallets] = useState<LessonWallet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    async function load() {
      const [walletList, studentList, paymentList] = await Promise.all([
        billingRepo.calcAllWallets(),
        studentsRepo.list(),
        billingRepo.listPayments(),
      ]);
      setWallets(walletList);
      setStudents(studentList);
      setPayments(paymentList);
    }
    void load();
  }, []);

  const totals = useMemo(() => {
    const totalPurchased = wallets.reduce((sum, wallet) => sum + wallet.totalPurchased, 0);
    const totalConsumed = wallets.reduce((sum, wallet) => sum + wallet.totalConsumed, 0);
    const totalRemaining = wallets.reduce((sum, wallet) => sum + wallet.remaining, 0);
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return { totalPurchased, totalConsumed, totalRemaining, totalRevenue };
  }, [wallets, payments]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((payment) => {
      const month = payment.paidAt.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + payment.amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, amount]) => ({ month, amount }));
  }, [payments]);

  const remainingDistribution = useMemo(() => {
    const buckets = { small: 0, medium: 0, large: 0 };
    wallets.forEach((wallet) => {
      if (wallet.remaining <= 5) buckets.small += 1;
      else if (wallet.remaining <= 10) buckets.medium += 1;
      else buckets.large += 1;
    });
    return buckets;
  }, [wallets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">财务仪表盘</h1>
        <p className="text-sm text-slate-500">统计课消、收入与课时余额，辅助续费提醒。</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="总收入" value={`¥${totals.totalRevenue.toFixed(0)}`} accent="gold" />
        <MetricCard label="已消课" value={`${totals.totalConsumed.toFixed(1)} 节`} accent="sky" />
        <MetricCard label="剩余课时" value={`${totals.totalRemaining.toFixed(1)} 节`} accent="emerald" />
        <MetricCard label="学员人数" value={`${students.length} 人`} accent="violet" />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">月度收入趋势</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {monthlyRevenue.map((item) => (
              <li key={item.month} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{item.month}</span>
                <span>¥{item.amount.toFixed(0)}</span>
              </li>
            ))}
            {!monthlyRevenue.length && <li className="text-slate-400">暂无数据</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">剩余课时分布</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <DistributionBar label="≤5 节" value={remainingDistribution.small} total={wallets.length} />
            <DistributionBar label="6-10 节" value={remainingDistribution.medium} total={wallets.length} />
            <DistributionBar label=">10 节" value={remainingDistribution.large} total={wallets.length} />
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">续费提醒</h2>
        <DataTable
          data={wallets.filter((wallet) => wallet.remaining <= 3)}
          columns={[
            {
              key: 'student',
              header: '学员',
              cell: (item) => students.find((student) => student.id === item.studentId)?.name ?? '',
            },
            {
              key: 'remaining',
              header: '剩余课时',
              cell: (item) => item.remaining.toFixed(1),
            },
            {
              key: 'contact',
              header: '联系方式',
              cell: (item) => students.find((student) => student.id === item.studentId)?.guardian?.phone ?? '—',
            },
          ]}
          emptyMessage="暂无需要提醒的学员"
        />
      </section>
    </div>
  );
}

type Accent = 'gold' | 'sky' | 'emerald' | 'violet';

function MetricCard({ label, value, accent }: { label: string; value: string; accent: Accent }) {
  const palette: Record<Accent, string> = {
    gold: 'from-amber-200 to-amber-400 text-amber-900',
    sky: 'from-sky-200 to-sky-400 text-sky-900',
    emerald: 'from-emerald-200 to-emerald-400 text-emerald-900',
    violet: 'from-violet-200 to-violet-400 text-violet-900',
  } as const;
  return (
    <div className={`rounded-xl border border-slate-200 bg-gradient-to-br ${palette[accent]} px-4 py-3 shadow-sm`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value} 人</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}
