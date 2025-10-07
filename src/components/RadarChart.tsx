import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FitnessQuality } from '../types';

interface RadarChartProps {
  data?: Record<FitnessQuality, number>;
}

export function RadarChart({ data }: RadarChartProps) {
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
        暂无雷达数据
      </div>
    );
  }

  const entries = Object.entries(data).map(([quality, value]) => ({
    quality,
    value,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RechartsRadar data={entries} outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="quality" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Radar dataKey="value" stroke="#0a96f0" fill="#38b4ff" fillOpacity={0.4} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
