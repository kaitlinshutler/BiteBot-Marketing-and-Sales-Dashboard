'use client';

import { cn, formatValue, formatChangePercent, getChangeColor } from '@/lib/utils';
import type { ComparisonData, PeriodOption } from '@/types';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';

interface ComparisonPanelProps {
  isOpen: boolean;
  periodALabel: string;
  periodBLabel: string;
  periodB: string;
  onPeriodBChange: (value: string) => void;
  periodOptions: PeriodOption[];
  data: ComparisonData[];
}

export function ComparisonPanel({
  isOpen, periodALabel, periodBLabel, periodB, onPeriodBChange, periodOptions, data
}: ComparisonPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="animate-fade-in rounded-xl border border-accent-500/20 bg-accent-500/[0.03] overflow-hidden">
      <div className="px-5 py-3 border-b border-accent-500/10 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-accent-400" />
          <span className="text-sm font-semibold text-accent-400">Period Comparison</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-md bg-accent-500/15 text-accent-300 font-medium">
            {periodALabel}
          </span>
          <span className="text-slate-500 font-medium">vs</span>
          <div className="relative">
            <select
              value={periodB}
              onChange={(e) => onPeriodBChange(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1 rounded-md text-xs font-medium bg-slate-900/60 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="px-5 py-2.5 text-left text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Metric</th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-accent-400 font-semibold">{periodALabel}</th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{periodBLabel}</th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Change</th>
              <th className="px-5 py-2.5 text-right text-[10px] uppercase tracking-wider text-slate-500 font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const changeColor = getChangeColor(row.changePercent, row.isPositiveGood);
              return (
                <tr key={row.metricId} className="border-b border-slate-800/20 last:border-0 hover:bg-slate-800/10 transition-colors">
                  <td className="px-5 py-2.5 text-sm text-slate-300 font-medium">{row.label}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatValue(row.periodA, row.format)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right text-slate-400" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatValue(row.periodB, row.format)}
                  </td>
                  <td className={cn('px-4 py-2.5 text-sm text-right', changeColor)} style={{ fontFamily: 'var(--font-mono)' }}>
                    {row.change !== null ? (row.change > 0 ? '+' : '') + formatValue(row.change, row.format) : '—'}
                  </td>
                  <td className={cn('px-5 py-2.5 text-sm text-right font-medium', changeColor)} style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatChangePercent(row.changePercent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
