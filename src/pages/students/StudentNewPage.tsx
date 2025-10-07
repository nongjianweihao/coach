import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { billingRepo } from '../../store/repositories/billingRepo';
import type { LessonPackage, PaymentRecord, Student } from '../../types';
import { generateId } from '../../store/repositories/utils';

export function StudentNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Student>>({
    name: '',
    gender: 'F',
    currentRank: 1,
  });
  const [packageForm, setPackageForm] = useState({ lessons: 0, price: 0, method: 'wechat' });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = generateId();
    const student: Student = {
      id,
      name: form.name ?? '',
      gender: form.gender as Student['gender'],
      birth: form.birth,
      currentRank: Number(form.currentRank) || undefined,
      guardian: form.guardian,
      joinDate: form.joinDate ?? new Date().toISOString(),
      tags: form.tags ?? [],
    };
    await studentsRepo.upsert(student);

    if (packageForm.lessons > 0 && packageForm.price > 0) {
      const pkg: LessonPackage = {
        id: generateId(),
        studentId: id,
        purchasedLessons: Number(packageForm.lessons),
        price: Number(packageForm.price),
        unitPrice: Number(packageForm.price) / Number(packageForm.lessons),
        purchasedAt: new Date().toISOString(),
      };
      const payment: PaymentRecord = {
        id: generateId(),
        studentId: id,
        packageId: pkg.id,
        amount: Number(packageForm.price),
        method: packageForm.method as PaymentRecord['method'],
        paidAt: new Date().toISOString(),
      };
      await billingRepo.addPackage(pkg);
      await billingRepo.addPayment(payment);
    }

    navigate(`/students/${id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">新增学员</h1>
        <p className="text-sm text-slate-500">录入基本信息，可选首购课时与实付金额。</p>
      </div>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">姓名</span>
            <input
              required
              value={form.name ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">性别</span>
            <select
              value={form.gender}
              onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value as Student['gender'] }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="F">女</option>
              <option value="M">男</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">出生日期</span>
            <input
              type="date"
              value={form.birth?.slice(0, 10) ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, birth: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">当前段位</span>
            <input
              type="number"
              min={1}
              max={9}
              value={form.currentRank ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, currentRank: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">监护人</span>
          <input
            value={form.guardian?.name ?? ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                guardian: { ...prev.guardian, name: event.target.value },
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">联系电话</span>
          <input
            value={form.guardian?.phone ?? ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                guardian: { ...prev.guardian, phone: event.target.value },
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">标签</span>
          <input
            value={form.tags?.join(',') ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value.split(',') }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="例如：基础,进阶,走班"
          />
        </label>
      </section>
      <section className="space-y-4 rounded-xl border border-brand-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">首购课时（可选）</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">课时数</span>
            <input
              type="number"
              min={0}
              value={packageForm.lessons}
              onChange={(event) => setPackageForm((prev) => ({ ...prev, lessons: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">实付金额</span>
            <input
              type="number"
              min={0}
              value={packageForm.price}
              onChange={(event) => setPackageForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">支付方式</span>
            <select
              value={packageForm.method}
              onChange={(event) => setPackageForm((prev) => ({ ...prev, method: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="wechat">微信</option>
              <option value="alipay">支付宝</option>
              <option value="cash">现金</option>
              <option value="card">刷卡</option>
              <option value="other">其他</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-slate-500">若留空，将仅创建学员信息。</p>
      </section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          保存学员
        </button>
      </div>
    </form>
  );
}
