'use client';

import { cn, SEGMENT_LABELS } from '@/lib/utils';
import type { DashboardView, Segment, ViewMode, PeriodOption } from '@/types';
import {
  LayoutDashboard, Megaphone, DollarSign, Users,
  Calendar, CalendarDays, CalendarRange,
  ArrowLeftRight, ChevronDown,
} from 'lucide-react';
import Image from 'next/image';

const NAV_ITEMS: { id: DashboardView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'reps', label: 'Sales Reps', icon: Users },
];

const SEGMENTS: Segment[] = ['company', 'bitebot', 'smilegen'];

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof Calendar }[] = [
  { id: 'weekly', label: 'Weekly', icon: Calendar },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays },
  { id: 'quarterly', label: 'Quarterly', icon: CalendarRange },
];

interface HeaderProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  segment: Segment;
  onSegmentChange: (segment: Segment) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  periodOptions: PeriodOption[];
  compareMode: boolean;
  onCompareModeToggle: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function Header({
  activeView, onViewChange,
  segment, onSegmentChange,
  viewMode, onViewModeChange,
  selectedPeriod, onPeriodChange,
  periodOptions, compareMode, onCompareModeToggle,
}: HeaderProps) {
  // Get current period label
  const currentPeriodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label || '';

  return (
    <header className="sticky top-0 z-50">
      {/* Executive Header */}
      <div className="bg-gradient-to-b from-slate-900 to-dark-950 border-b border-slate-800/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                <span className="text-xs font-semibold text-accent-400 uppercase tracking-widest">Live Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Marketing & Sales Dashboard
              </h1>
              <p className="text-sm text-slate-400">
                Real-time metrics • Current: {currentPeriodLabel}
              </p>
            </div>

            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="BiteBot Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-dark-950/95 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Nav tabs */}
            <nav className="flex items-center gap-1 bg-slate-900/50 rounded-xl p-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-accent-500/15 text-accent-400 shadow-sm shadow-accent-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Segment selector */}
            <div className="flex items-center gap-1 bg-slate-900/50 rounded-xl p-1">
              {SEGMENTS.map((seg) => (
                <button
                  key={seg}
                  onClick={() => onSegmentChange(seg)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 uppercase tracking-wide',
                    segment === seg
                      ? seg === 'company'
                        ? 'bg-accent-500/15 text-accent-400'
                        : seg === 'bitebot'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-purple-500/15 text-purple-400'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                  )}
                >
                  {SEGMENT_LABELS[seg]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls bar - centered */}
      <div className="bg-dark-950/80 backdrop-blur-xl border-b border-slate-800/40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-4 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-0.5">
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => onViewModeChange(mode.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === mode.id
                      ? 'bg-accent-500/20 text-accent-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Period dropdown */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className={cn(
                'appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium',
                'bg-slate-900/60 border border-slate-700/50 text-white',
                'focus:outline-none focus:ring-2 focus:ring-accent-500/30',
                'cursor-pointer'
              )}
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Compare toggle */}
          <button
            onClick={onCompareModeToggle}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              compareMode
                ? 'bg-accent-500/15 text-accent-400 border-accent-500/30'
                : 'text-slate-400 hover:text-white border-slate-700/50 hover:border-slate-600'
            )}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Compare
          </button>
        </div>
      </div>
    </header>
  );
}
