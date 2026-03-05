'use client';

import { KPIGrid, Section, TrendChart, DonutChart, DataTable, BarChartWidget } from '@/components';
import { calcChange, formatValue } from '@/lib/utils';
import type { SalesMetrics, TrendPoint, KPIData, Segment } from '@/types';

interface SalesViewProps {
  sales: SalesMetrics;
  trends: {
    marketing: Record<string, TrendPoint[]>;
    sales: Record<string, TrendPoint[]>;
  };
  prevSales?: SalesMetrics;
  segment: Segment;
}

export function SalesView({ sales, trends, prevSales, segment }: SalesViewProps) {
  const sls = sales;
  const slsPrev = prevSales;
  const trendData = trends.sales;

  // Revenue Summary KPIs
  const revenueKpis: KPIData[] = [
    { 
      id: 'totalCloses', 
      label: 'Total Closes', 
      value: sls.totalCloses, 
      format: 'integer', 
      trendDirection: 'up', 
      changePercent: slsPrev ? calcChange(sls.totalCloses, slsPrev.totalCloses).percent : null 
    },
    { 
      id: 'cashCollected', 
      label: 'Cash Collected', 
      value: sls.cashCollected, 
      format: 'currency_whole', 
      trendDirection: 'up', 
      changePercent: slsPrev ? calcChange(sls.cashCollected, slsPrev.cashCollected).percent : null 
    },
    { 
      id: 'avgDealValue', 
      label: 'Avg Deal Value', 
      value: sls.avgDealValue, 
      format: 'currency', 
      trendDirection: 'up', 
      changePercent: slsPrev ? calcChange(sls.avgDealValue, slsPrev.avgDealValue).percent : null 
    },
    { 
      id: 'closeRate', 
      label: 'Close Rate (Showed)', 
      value: sls.closeRateDemosShowed, 
      format: 'percent', 
      trendDirection: 'up', 
      changePercent: slsPrev ? calcChange(sls.closeRateDemosShowed, slsPrev.closeRateDemosShowed).percent : null 
    },
  ];

  // Closes by Source KPIs
  const sourceKpis: KPIData[] = [
    { id: 'fromDemos', label: 'From Demos', value: sls.closesFromDemos, format: 'integer', trendDirection: 'up', changePercent: slsPrev ? calcChange(sls.closesFromDemos, slsPrev.closesFromDemos).percent : null },
    { id: 'fromAds', label: 'From Ads', value: sls.closesFromAds, format: 'integer', trendDirection: 'up', changePercent: slsPrev ? calcChange(sls.closesFromAds, slsPrev.closesFromAds).percent : null },
    { id: 'fromEmails', label: 'From Emails', value: sls.closesFromEmails, format: 'integer', trendDirection: 'up', changePercent: slsPrev ? calcChange(sls.closesFromEmails, slsPrev.closesFromEmails).percent : null },
    { id: 'fromAffiliate', label: 'From Affiliate', value: sls.closesFromAffiliate, format: 'integer', trendDirection: 'up', changePercent: slsPrev ? calcChange(sls.closesFromAffiliate, slsPrev.closesFromAffiliate).percent : null },
    { id: 'fromOther', label: 'From Other', value: sls.closesFromOther, format: 'integer', trendDirection: 'up', changePercent: slsPrev ? calcChange(sls.closesFromOther, slsPrev.closesFromOther).percent : null },
  ];

  // Donut chart data for closes by source
  const sourceDonutData = [
    { name: 'Demos', value: sls.closesFromDemos, color: '#14b8a6' },
    { name: 'Ads', value: sls.closesFromAds, color: '#3b82f6' },
    { name: 'Emails', value: sls.closesFromEmails, color: '#a855f7' },
    { name: 'Affiliate', value: sls.closesFromAffiliate, color: '#f59e0b' },
    { name: 'Other', value: sls.closesFromOther, color: '#64748b' },
  ].filter(d => d.value > 0);

  // Cash collected trend data for bar chart
  const cashBarData = (trendData.cashCollected || []).map((d, i) => ({
    label: d.label,
    value: d.value,
    secondaryValue: trendData.closes?.[i]?.value || 0,
  }));

  // Efficiency table data
  const efficiencyColumns = [
    { key: 'metric', label: 'Metric' },
    { key: 'current', label: 'Current', align: 'right' as const },
    { key: 'previous', label: 'Previous', align: 'right' as const },
    { key: 'change', label: 'Change', align: 'right' as const },
  ];

  const efficiencyData = slsPrev ? [
    {
      metric: 'Total Closes',
      current: formatValue(sls.totalCloses, 'integer'),
      previous: formatValue(slsPrev.totalCloses, 'integer'),
      change: formatValue(calcChange(sls.totalCloses, slsPrev.totalCloses).percent ?? 0, 'percent'),
    },
    {
      metric: 'Cash Collected',
      current: formatValue(sls.cashCollected, 'currency_whole'),
      previous: formatValue(slsPrev.cashCollected, 'currency_whole'),
      change: formatValue(calcChange(sls.cashCollected, slsPrev.cashCollected).percent ?? 0, 'percent'),
    },
    {
      metric: 'Close Rate',
      current: formatValue(sls.closeRateDemosShowed, 'percent'),
      previous: formatValue(slsPrev.closeRateDemosShowed, 'percent'),
      change: formatValue(calcChange(sls.closeRateDemosShowed, slsPrev.closeRateDemosShowed).percent ?? 0, 'percent'),
    },
    {
      metric: 'Avg Deal Size',
      current: formatValue(sls.avgDealValue, 'currency'),
      previous: formatValue(slsPrev.avgDealValue, 'currency'),
      change: formatValue(calcChange(sls.avgDealValue, slsPrev.avgDealValue).percent ?? 0, 'percent'),
    },
  ] : [];

  return (
    <div className="space-y-10">
      <Section title="Revenue Summary" subtitle="Total closes and cash collected">
        <KPIGrid items={revenueKpis} columns={4} />
        <div className="mt-4">
          <BarChartWidget
            data={cashBarData}
            title="Cash Collected vs Closes"
            color="#22c55e"
            secondaryColor="#3b82f6"
            barLabel="Cash ($)"
            secondaryLabel="Closes"
            format="currency_whole"
            secondaryFormat="integer"
          />
        </div>
      </Section>

      <Section title="Closes by Source" subtitle="Where sales are coming from">
        <KPIGrid items={sourceKpis} columns={5} />
        <div className="mt-4">
          <DonutChart data={sourceDonutData} height={280} format="integer" />
        </div>
      </Section>

      {segment === 'company' && (
        <Section title="Product Breakdown" subtitle="BiteBot vs SmileGen performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h4 className="text-sm font-medium text-white">BiteBot</h4>
              </div>
              <p className="text-2xl font-bold text-white mb-1">—</p>
              <p className="text-xs text-slate-500">Closes | Cash collected</p>
              <p className="text-xs text-slate-600 mt-2">Filtered data coming from API</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h4 className="text-sm font-medium text-white">SmileGen</h4>
              </div>
              <p className="text-2xl font-bold text-white mb-1">—</p>
              <p className="text-xs text-slate-500">Closes | Cash collected</p>
              <p className="text-xs text-slate-600 mt-2">Filtered data coming from API</p>
            </div>
          </div>
        </Section>
      )}

      {slsPrev && (
        <Section title="Sales Efficiency" subtitle="Period-over-period comparison">
          <DataTable
            columns={efficiencyColumns}
            data={efficiencyData as Record<string, unknown>[]}
            emptyMessage="No comparison data available"
          />
        </Section>
      )}
    </div>
  );
}
