'use client';

import { cn, formatValue } from '@/lib/utils';
import type { TrendPoint, FunnelStep } from '@/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Area,
} from 'recharts';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="font-bold text-lg text-white" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface ChartCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartCard({ title, children, className, height = 280 }: ChartCardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 sm:p-5', className)}>
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>}
      <div style={{ height }}>{children}</div>
    </div>
  );
}

interface TrendChartProps {
  data: TrendPoint[];
  title?: string;
  color?: string;
  format?: string;
  height?: number;
  showArea?: boolean;
}

export function TrendChart({ data, title, color = '#14b8a6', format = 'integer', height = 280, showArea = false }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title={title} height={height}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={55}
            tickFormatter={(v) => formatValue(v, format)} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
            formatter={(v: number) => [formatValue(v, format), '']}
          />
          {showArea && <Area type="monotone" dataKey="value" fill={color} fillOpacity={0.08} stroke="none" />}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: color, stroke: '#0f172a', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface BarChartWidgetProps {
  data: { label: string; value: number; secondaryValue?: number }[];
  title?: string;
  color?: string;
  secondaryColor?: string;
  format?: string;
  secondaryFormat?: string;
  height?: number;
  barLabel?: string;
  secondaryLabel?: string;
}

export function BarChartWidget({
  data, title, color = '#14b8a6', secondaryColor = '#3b82f6',
  format = 'integer', secondaryFormat, height = 280, barLabel = 'Value', secondaryLabel = 'Secondary'
}: BarChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title={title} height={height}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data available</div>
      </ChartCard>
    );
  }

  const hasSecondary = data.some(d => d.secondaryValue !== undefined);
  const secFormat = secondaryFormat || format;

  return (
    <ChartCard title={title} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={55}
            tickFormatter={(v) => formatValue(v, format)} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
            formatter={(v: number, name: string) => {
              const fmt = name === secondaryLabel ? secFormat : format;
              return [formatValue(v, fmt), name];
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name={barLabel} />
          {hasSecondary && <Bar dataKey="secondaryValue" fill={secondaryColor} radius={[4, 4, 0, 0]} name={secondaryLabel} />}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface FunnelChartProps {
  steps: FunnelStep[];
  title?: string;
  height?: number;
}

export function FunnelChart({ steps, title, height = 220 }: FunnelChartProps) {
  if (!steps || steps.length === 0) {
    return (
      <ChartCard title={title} height={height}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data available</div>
      </ChartCard>
    );
  }

  const maxValue = Math.max(...steps.map(s => s.value));

  return (
    <ChartCard title={title} height={height}>
      <div className="flex flex-col justify-center h-full gap-2.5 pr-4">
        {steps.map((step, i) => {
          const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
          const colors = ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];
          const barColor = colors[i % colors.length];

          return (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-28 text-right shrink-0 truncate">{step.label}</span>
              <div className="flex-1 relative h-7 bg-slate-800/60 rounded">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-700 ease-out flex items-center px-3"
                  style={{ width: `${Math.max(widthPercent, 8)}%`, backgroundColor: barColor }}
                >
                  <span className="text-xs font-bold text-dark-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)' }}>
                    {step.value.toLocaleString()}
                  </span>
                </div>
              </div>
              {step.conversionRate !== undefined && (
                <span className="text-[10px] text-accent-400 w-12 text-right shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>
                  {step.conversionRate.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  format?: string;
}

const DONUT_COLORS = ['#14b8a6', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#22c55e'];

export function DonutChart({ data, title, height = 280, format = 'integer' }: DonutChartProps) {
  const filteredData = data.filter(d => d.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <ChartCard title={title} height={height}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {filteredData.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [formatValue(v, format), '']}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span style={{ color: '#cbd5e1', fontSize: 11, marginLeft: 4 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface SparklineProps {
  data: TrendPoint[];
  label: string;
  value: string;
  color?: string;
  change?: number | null;
  isPositiveGood?: boolean;
}

export function Sparkline({ data, label, value, color = '#14b8a6', change, isPositiveGood = true }: SparklineProps) {
  const changeIsGood = change !== null && change !== undefined
    ? (isPositiveGood ? change > 0 : change < 0)
    : null;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/30 border border-slate-800/40">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 truncate">{label}</p>
        <p className="text-base font-bold text-white mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
        {change !== null && change !== undefined && (
          <p className={cn(
            'text-[10px]',
            changeIsGood === true ? 'text-emerald-400' : changeIsGood === false ? 'text-red-400' : 'text-slate-400'
          )} style={{ fontFamily: 'var(--font-mono)' }}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </p>
        )}
      </div>
      {data && data.length > 0 && (
        <div className="w-20 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
