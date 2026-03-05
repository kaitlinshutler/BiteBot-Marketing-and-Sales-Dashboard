// ============================================================================
// Utility Functions
// ============================================================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatValue(value: number | null | undefined, format: string): string {
  if (value === null || value === undefined) return '—';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    case 'currency_whole':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'integer':
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(value);
    case 'decimal':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    default:
      return String(value);
  }
}

export function getChangeColor(change: number | null | undefined, isPositiveGood: boolean = true): string {
  if (change === null || change === undefined || change === 0) return 'text-slate-400';
  const isPositive = change > 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;
  return isGood ? 'text-emerald-400' : 'text-red-400';
}

export function getChangeBgColor(change: number | null | undefined, isPositiveGood: boolean = true): string {
  if (change === null || change === undefined || change === 0) return 'bg-slate-500/10';
  const isPositive = change > 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;
  return isGood ? 'bg-emerald-500/10' : 'bg-red-500/10';
}

export function calcChange(current: number | null, previous: number | null): { absolute: number | null; percent: number | null } {
  if (current === null || previous === null || previous === 0) {
    return { absolute: null, percent: null };
  }
  const absolute = current - previous;
  const percent = ((current - previous) / previous) * 100;
  return { absolute, percent };
}

export function formatChangePercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export const SEGMENT_LABELS: Record<string, string> = {
  company: 'Company',
  bitebot: 'BiteBot',
  smilegen: 'SmileGen',
};

export const SEGMENT_COLORS: Record<string, string> = {
  company: '#14b8a6',
  bitebot: '#3b82f6',
  smilegen: '#a855f7',
};
