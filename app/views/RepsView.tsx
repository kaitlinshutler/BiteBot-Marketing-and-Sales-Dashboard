'use client';

import { useState, useMemo } from 'react';
import { KPIGrid, Section, DataTable } from '@/components';
import { formatValue } from '@/lib/utils';
import type { SalesRepMetrics, SalesRepDaily, KPIData, Segment } from '@/types';

interface RepsViewProps {
  reps: SalesRepMetrics[];
  repDaily: SalesRepDaily[];
  segment: Segment;
  config: {
    commissionRate: number;
    repNames: string[];
  };
}

export function RepsView({ reps, repDaily, segment, config }: RepsViewProps) {
  const [selectedRep, setSelectedRep] = useState<string>('all');

  // Get rep names from data or config
  const repNames = useMemo(() => {
    const fromData = reps.map(r => r.repName).filter(Boolean);
    const allNames = fromData.concat(config.repNames);
    const unique = Array.from(new Set(allNames)).filter(n => n && n !== '[Rep 2 Name]');
    return unique;
  }, [reps, config.repNames]);

  // Get selected rep's data
  const selectedRepData = useMemo(() => {
    if (selectedRep === 'all') {
      // Aggregate all reps
      return reps.reduce(
        (acc, r) => ({
          repName: 'All Reps',
          demosBooked: acc.demosBooked + r.demosBooked,
          demosShowed: acc.demosShowed + r.demosShowed,
          demosNoShowed: acc.demosNoShowed + r.demosNoShowed,
          salesClosed: acc.salesClosed + r.salesClosed,
          cashCollected: acc.cashCollected + r.cashCollected,
          commissionEarned: acc.commissionEarned + r.commissionEarned,
          showRate: 0,
          closeRate: 0,
          bitebot: {
            demosBooked: acc.bitebot.demosBooked + r.bitebot.demosBooked,
            demosShowed: acc.bitebot.demosShowed + r.bitebot.demosShowed,
            demosNoShowed: acc.bitebot.demosNoShowed + r.bitebot.demosNoShowed,
            salesClosed: acc.bitebot.salesClosed + r.bitebot.salesClosed,
            cashCollected: acc.bitebot.cashCollected + r.bitebot.cashCollected,
            commissionEarned: acc.bitebot.commissionEarned + r.bitebot.commissionEarned,
          },
          smilegen: {
            demosBooked: acc.smilegen.demosBooked + r.smilegen.demosBooked,
            demosShowed: acc.smilegen.demosShowed + r.smilegen.demosShowed,
            demosNoShowed: acc.smilegen.demosNoShowed + r.smilegen.demosNoShowed,
            salesClosed: acc.smilegen.salesClosed + r.smilegen.salesClosed,
            cashCollected: acc.smilegen.cashCollected + r.smilegen.cashCollected,
            commissionEarned: acc.smilegen.commissionEarned + r.smilegen.commissionEarned,
          },
        }),
        {
          repName: 'All Reps',
          demosBooked: 0,
          demosShowed: 0,
          demosNoShowed: 0,
          salesClosed: 0,
          cashCollected: 0,
          commissionEarned: 0,
          showRate: 0,
          closeRate: 0,
          bitebot: { demosBooked: 0, demosShowed: 0, demosNoShowed: 0, salesClosed: 0, cashCollected: 0, commissionEarned: 0 },
          smilegen: { demosBooked: 0, demosShowed: 0, demosNoShowed: 0, salesClosed: 0, cashCollected: 0, commissionEarned: 0 },
        }
      );
    }
    return reps.find(r => r.repName === selectedRep) || null;
  }, [reps, selectedRep]);

  // Calculate rates for aggregated data
  const repKpis: KPIData[] = selectedRepData
    ? [
        { id: 'demosBooked', label: 'Demos Booked', value: selectedRepData.demosBooked, format: 'integer', trendDirection: 'up' },
        { id: 'demosShowed', label: 'Demos Showed', value: selectedRepData.demosShowed, format: 'integer', trendDirection: 'up' },
        { id: 'demosNoShowed', label: 'Demos No-Showed', value: selectedRepData.demosNoShowed, format: 'integer', trendDirection: 'down' },
        { id: 'salesClosed', label: 'Sales Closed', value: selectedRepData.salesClosed, format: 'integer', trendDirection: 'up' },
        { id: 'cashCollected', label: 'Cash Collected', value: selectedRepData.cashCollected, format: 'currency_whole', trendDirection: 'up' },
        { id: 'commission', label: `Commission (${config.commissionRate * 100}%)`, value: selectedRepData.commissionEarned, format: 'currency', trendDirection: 'up' },
      ]
    : [];

  // Product breakdown table
  const productColumns = [
    { key: 'metric', label: 'Metric' },
    { key: 'bitebot', label: 'BiteBot', align: 'right' as const },
    { key: 'smilegen', label: 'SmileGen', align: 'right' as const },
    { key: 'total', label: 'Total', align: 'right' as const },
  ];

  const productData = selectedRepData
    ? [
        {
          metric: 'Demos Booked',
          bitebot: selectedRepData.bitebot.demosBooked,
          smilegen: selectedRepData.smilegen.demosBooked,
          total: selectedRepData.demosBooked,
        },
        {
          metric: 'Demos Showed',
          bitebot: selectedRepData.bitebot.demosShowed,
          smilegen: selectedRepData.smilegen.demosShowed,
          total: selectedRepData.demosShowed,
        },
        {
          metric: 'Demos No-Showed',
          bitebot: selectedRepData.bitebot.demosNoShowed,
          smilegen: selectedRepData.smilegen.demosNoShowed,
          total: selectedRepData.demosNoShowed,
        },
        {
          metric: 'Sales Closed',
          bitebot: selectedRepData.bitebot.salesClosed,
          smilegen: selectedRepData.smilegen.salesClosed,
          total: selectedRepData.salesClosed,
        },
        {
          metric: 'Cash Collected',
          bitebot: formatValue(selectedRepData.bitebot.cashCollected, 'currency_whole'),
          smilegen: formatValue(selectedRepData.smilegen.cashCollected, 'currency_whole'),
          total: formatValue(selectedRepData.cashCollected, 'currency_whole'),
        },
        {
          metric: `Commission (${config.commissionRate * 100}%)`,
          bitebot: formatValue(selectedRepData.bitebot.commissionEarned, 'currency'),
          smilegen: formatValue(selectedRepData.smilegen.commissionEarned, 'currency'),
          total: formatValue(selectedRepData.commissionEarned, 'currency'),
        },
      ]
    : [];

  // Leaderboard columns
  const leaderboardColumns = [
    { key: 'rank', label: '#', width: '40px' },
    { key: 'repName', label: 'Rep Name', sortable: true },
    { key: 'demosBooked', label: 'Booked', align: 'right' as const, sortable: true },
    { key: 'demosShowed', label: 'Showed', align: 'right' as const, sortable: true },
    { key: 'showRate', label: 'Show %', align: 'right' as const, format: 'percent', sortable: true },
    { key: 'salesClosed', label: 'Closes', align: 'right' as const, sortable: true },
    { key: 'cashCollected', label: 'Cash', align: 'right' as const, format: 'currency_whole', sortable: true },
    { key: 'commissionEarned', label: 'Comm.', align: 'right' as const, format: 'currency', sortable: true },
    { key: 'closeRate', label: 'Close %', align: 'right' as const, format: 'percent', sortable: true },
  ];

  const leaderboardData = reps
    .sort((a, b) => b.cashCollected - a.cashCollected)
    .map((r, i) => ({
      rank: i === 0 ? '🏆' : String(i + 1),
      ...r,
      showRate: r.demosBooked > 0 ? (r.demosShowed / r.demosBooked) * 100 : 0,
      closeRate: r.demosShowed > 0 ? (r.salesClosed / r.demosShowed) * 100 : 0,
    }));

  // Daily activity columns
  const dailyColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'repName', label: 'Rep' },
    { key: 'product', label: 'Product' },
    { key: 'demosBooked', label: 'Booked', align: 'right' as const },
    { key: 'demosShowed', label: 'Showed', align: 'right' as const },
    { key: 'demosNoShowed', label: 'No-Show', align: 'right' as const },
    { key: 'salesClosed', label: 'Closes', align: 'right' as const },
    { key: 'cashCollected', label: 'Cash', align: 'right' as const, format: 'currency' },
  ];

  // Filter daily activity by selected rep
  const filteredDailyData = repDaily.filter(
    d => selectedRep === 'all' || d.repName === selectedRep
  );

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

      {/* Product Breakdown (Individual Rep) */}
      {selectedRep !== 'all' && selectedRepData && (
        <Section title="Product Breakdown" subtitle="Performance by product">
          <DataTable
            columns={productColumns}
            data={productData as Record<string, unknown>[]}
            emptyMessage="No product breakdown data"
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
