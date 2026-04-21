"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatsChartProps {
  data: {
    date: string;
    certificates: number;
    students: number;
  }[];
}

export default function StatsChart({ data }: StatsChartProps) {
  const { t } = useLanguage();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCerts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0945A5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0945A5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#046358" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#046358" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#d1d5db"
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#d1d5db"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Area
          type="monotone"
          dataKey="certificates"
          stroke="#0945A5"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCerts)"
          name={t('institution.home.stats.totalCertificates')}
        />
        <Area
          type="monotone"
          dataKey="students"
          stroke="#046358"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorStudents)"
          name={t('institution.home.stats.totalStudents')}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
