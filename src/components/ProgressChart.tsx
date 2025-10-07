import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ProgressChartProps {
  series: Array<{ date: string; score: number }>;
  title?: string;
}

export function ProgressChart({ series, title }: ProgressChartProps) {
  if (!series.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold text-slate-600">{title}</h3>}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 20, right: 16, left: 0, bottom: 20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#0a96f0" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
