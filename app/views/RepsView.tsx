'use client';

import { useState, useMemo } from 'react';
import { KPIGrid, Section, DataTable } from '@/components';
import { formatValue } from '@/lib/utils';
import type { SalesRepMetrics, SalesRepDaily, KPIData, Segment } from '@/types';

interface RepsViewProps {
  reps: SalesRepMetrics[];
  repDaily: SalesRepDaily[];
  segment: Segment;
}

export function RepsView({ reps, repDaily, segment }: RepsViewProps) {
  const [selectedRep, setSelectedRep] = useState<string>('all');

  // Get rep names from data
  const repNames = useMemo(() => {
    const fromData = reps.map(r => r.repName).filter(Boolean);
    const unique = Array.from(new Set(fromData)).filter(n => n && n !== 'Unknown' && n !== 'Unassigned');
    return unique.sort();
  }, [reps]);

  // Get selected rep's data
  const selectedRepData = useMemo(() => {
    if (selectedRep === 'all') {
      // Aggregate all reps
      return reps.reduce(
        (acc, r) => ({
          repName: 'All Reps',
          callsMade: acc.callsMade + (r.callsMade || 0),
          demosBooked: acc.demosBooked + r.demosBooked,
          demosShowed: acc.demosShowed + r.demosShowed,
          demosNoShowed: acc.demosNoShowed + r.demosNoShowed,
          salesClosed: acc.salesClosed + r.salesClosed,
          cashCollected: acc.cashCollected + r.cashCollected,
          commissionEarned: acc.commissionEarned + r.commissionEarned,
          showRate: 0,
          closeRate: 0,
        }),
        {
          repName: 'All Reps',
          callsMade: 0,
          demosBooked: 0,
          demosShowed: 0,
          demosNoShowed: 0,
          salesClosed: 0,
          cashCollected: 0,
          commissionEarned: 0,
          showRate: 0,
          closeRate: 0,
        }
      );
    }
    return reps.find(r => r.repName === selectedRep) || null;
  }, [reps, selectedRep]);

  // Calculate rates for aggregated data
  const repKpis: KPIData[] = selectedRepData
    ? [
        { id: 'callsMade', label: 'Calls Made', value: selectedRepData.callsMade, format: 'integer', trendDirection: 'up' },
        { id: 'demosBooked', label: 'Demos Booked', value: selectedRepData.demosBooked, format: 'integer', trendDirection: 'up' },
        { id: 'demosShowed', label: 'Demos Showed', value: selectedRepData.demosShowed, format: 'integer', trendDirection: 'up' },
        { id: 'salesClosed', label: 'Sales Closed', value: selectedRepData.salesClosed, format: 'integer', trendDirection: 'up' },
        { id: 'cashCollected', label: 'Cash Collected', value: selectedRepData.cashCollected, format: 'currency_whole', trendDirection: 'up' },
        { id: 'commission', label: 'Commission', value: selectedRepData.commissionEarned, format: 'currency', trendDirection: 'up' },
      ]
    : [];

  // Performance summary table for individual rep
  const performanceColumns = [
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value', align: 'right' as const },
  ];

  const performanceData = selectedRepData
    ? [
        { metric: 'Calls Made', value: selectedRepData.callsMade },
        { metric: 'Demos Booked', value: selectedRepData.demosBooked },
        { metric: 'Demos Showed', value: selectedRepData.demosShowed },
        { metric: 'Demos No-Showed', value: selectedRepData.demosNoShowed },
        { metric: 'Show Rate', value: formatValue(selectedRepData.demosBooked > 0 ? (selectedRepData.demosShowed / selectedRepData.demosBooked) * 100 : 0, 'percent') },
        { metric: 'Sales Closed', value: selectedRepData.salesClosed },
        { metric: 'Close Rate', value: formatValue(selectedRepData.demosShowed > 0 ? (selectedRepData.salesClosed / selectedRepData.demosShowed) * 100 : 0, 'percent') },
        { metric: 'Cash Collected', value: formatValue(selectedRepData.cashCollected, 'currency_whole') },
        { metric: 'Commission', value: formatValue(selectedRepData.commissionEarned, 'currency') },
      ]
    : [];

  // Leaderboard columns
  const leaderboardColumns = [
    { key: 'rank', label: '#', width: '40px' },
    { key: 'repName', label: 'Rep Name', sortable: true },
    { key: 'callsMade', label: 'Calls', align: 'right' as const, sortable: true },
    { key: 'demosBooked', label: 'Booked', align: 'right' as const, sortable: true },
    { key: 'demosShowed', label: 'Showed', align: 'right' as const, sortable: true },
    { key: 'showRate', label: 'Show %', align: 'right' as const, format: 'percent', sortable: true },
    { key: 'salesClosed', label: 'Closes', align: 'right' as const, sortable: true },
    { key: 'cashCollected', label: 'Cash', align: 'right' as const, format: 'currency_whole', sortable: true },
    { key: 'closeRate', label: 'Close %', align: 'right' as const, format: 'percent', sortable: true },
  ];

  const leaderboardData = reps
    .filter(r => r.repName !== 'Unassigned' && r.repName !== 'Unknown')
    .sort((a, b) => b.cashCollected - a.cashCollected)
    .map((r, i) => ({
      rank: i === 0 ? '🏆' : String(i + 1),
      ...r,
      showRate: r.demosBooked > 0 ? (r.demosShowed / r.demosBooked) * 100 : 0,
      closeRate: r.demosShowed > 0 ? (r.salesClosed / r.demosShowed) * 100 : 0,
    }));

  // Daily activity columns (no product column anymore)
  const dailyColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'repName', label: 'Rep' },
    { key: 'callsMade', label: 'Calls', align: 'right' as const },
    { key: 'demosBooked', label: 'Booked', align: 'right' as const },
    { key: 'demosShowed', label: 'Showed', align: 'right' as const },
    { key: 'demosNoShowed', label: 'No-Show', align: 'right' as const },
    { key: 'salesClosed', label: 'Closes', align: 'right' as const },
    { key: 'cashCollected', label: 'Cash', align: 'right' as const, format: 'currency' },
  ];

  // Filter daily activity by selected rep
  const filteredDailyData = repDaily
    .filter(d => selectedRep === 'all' || d.repName === selectedRep)
    .filter(d => d.repName !== 'Unassigned' && d.repName !== 'Unknown');

  return (
    <div className="space-y-10">
      {/* Rep Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-slate-400">Select Rep:</label>
        <select
          value={selectedRep}
          onChange={(e) => setSelectedRep(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-accent-500 focus:border-accent-500"
        >
          <option value="all">All Reps</option>
          {repNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Rep KPIs */}
      <Section title={selectedRepData?.repName || 'Sales Rep'} subtitle="Performance metrics for selected rep">
        {selectedRepData ? (
          <KPIGrid items={repKpis} columns={6} />
        ) : (
          <p className="text-slate-500 text-sm">No data for selected rep</p>
        )}
      </Section>

      {/* Performance Summary (Individual Rep) */}
      {selectedRep !== 'all' && selectedRepData && (
        <Section title="Performance Summary" subtitle="Detailed metrics">
          <DataTable
            columns={performanceColumns}
            data={performanceData as Record<string, unknown>[]}
            emptyMessage="No performance data"
          />
        </Section>
      )}

      {/* Leaderboard (All Reps) */}
      {selectedRep === 'all' && reps.length > 0 && (
        <Section title="Rep Leaderboard" subtitle="Ranked by cash collected">
          <DataTable
            columns={leaderboardColumns}
            data={leaderboardData as unknown as Record<string, unknown>[]}
            highlightFirst
            emptyMessage="No rep data available"
          />
        </Section>
      )}

      {/* Daily Activity Feed */}
      <Section title="Daily Activity Feed" subtitle="Individual daily submissions">
        <div className="max-h-96 overflow-y-auto">
          <DataTable
            columns={dailyColumns}
            data={filteredDailyData as unknown as Record<string, unknown>[]}
            emptyMessage="No daily activity data yet. Data will appear once reps begin logging their daily numbers."
          />
        </div>
      </Section>
    </div>
  );
}
