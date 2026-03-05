'use client';

import { cn, formatValue, formatChangePercent, getChangeColor, getChangeBgColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPIData } from '@/types';

interface KPICardProps {
  data: KPIData;
  className?: string;
  compact?: boolean;
}

export function KPICard({ data, className, compact = false }: KPICardProps) {
  const { label, value, format, changePercent, trendDirection } = data;
  const isPositiveGood = trendDirection !== 'down';
  const changeColor = getChangeColor(changePercent, isPositiveGood);
  const changeBg = getChangeBgColor(changePercent, isPositiveGood);

  const TrendIcon = changePercent === null || changePercent === undefined || changePercent === 0
    ? Minus
    : changePercent > 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300',
        'bg-slate-900/40 border-slate-700/40',
        'hover:border-slate-600/60 hover:bg-slate-900/60',
        compact ? 'p-3' : 'p-4 sm:p-5',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <p className={cn(
          'text-slate-400 font-medium truncate',
          compact ? 'text-[10px] uppercase tracking-wider' : 'text-xs uppercase tracking-wider mb-1'
        )}>
          {label}
        </p>

        <div className={cn('flex items-end justify-between', compact ? 'mt-1' : 'mt-2')}>
          <p className={cn(
            'font-bold text-white leading-none',
            compact ? 'text-lg' : 'text-2xl sm:text-3xl'
          )} style={{ fontFamily: 'var(--font-display)' }}>
            {formatValue(value, format)}
          </p>

          {changePercent !== null && changePercent !== undefined && (
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full', changeBg)}>
              <TrendIcon className={cn('w-3 h-3', changeColor)} />
              <span className={cn('text-xs font-medium', changeColor)} style={{ fontFamily: 'var(--font-mono)' }}>
                {formatChangePercent(changePercent)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface KPIGridProps {
  items: KPIData[];
  columns?: number;
  compact?: boolean;
}

export function KPIGrid({ items, columns = 4, compact = false }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    8: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8',
  }[columns] || 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid gap-3 sm:gap-4', gridCols)}>
      {items.map((item, i) => (
        <KPICard
          key={item.id}
          data={item}
          compact={compact}
          className={cn('animate-fade-in-up opacity-0', `stagger-${Math.min(i + 1, 8)}`)}
        />
      ))}
    </div>
  );
}
