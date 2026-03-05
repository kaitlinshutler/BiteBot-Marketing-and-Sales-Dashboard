'use client';

import { KPIGrid, Section, FunnelChart, DonutChart, Sparkline } from '@/components';
import { formatValue, calcChange } from '@/lib/utils';
import type { MarketingMetrics, SalesMetrics, TrendPoint, KPIData, FunnelStep } from '@/types';

interface OverviewViewProps {
  marketing: MarketingMetrics;
  sales: SalesMetrics;
  trends: {
    marketing: Record<string, TrendPoint[]>;
    sales: Record<string, TrendPoint[]>;
  };
  prevMarketing?: MarketingMetrics;
  prevSales?: SalesMetrics;
}

export function OverviewView({ marketing, sales, trends, prevMarketing, prevSales }: OverviewViewProps) {
  const mkt = marketing;
  const mktPrev = prevMarketing;
  const sls = sales;
  const slsPrev = prevSales;

  const kpis: KPIData[] = [
    {
      id: 'adSpend', label: 'Ad Spend', value: mkt.adSpend, format: 'currency',
      trendDirection: 'down',
      changePercent: mktPrev ? calcChange(mkt.adSpend, mktPrev.adSpend).percent : null,
    },
    {
      id: 'totalLeads', label: 'Total Leads', value: mkt.totalLeads, format: 'integer',
      trendDirection: 'up',
      changePercent: mktPrev ? calcChange(mkt.totalLeads, mktPrev.totalLeads).percent : null,
    },
    {
      id: 'cpl', label: 'Cost Per Lead', value: mkt.cpl, format: 'currency',
      trendDirection: 'down',
      changePercent: mktPrev ? calcChange(mkt.cpl, mktPrev.cpl).percent : null,
    },
    {
      id: 'demosBooked', label: 'Demos Booked', value: mkt.demosBooked, format: 'integer',
      trendDirection: 'up',
      changePercent: mktPrev ? calcChange(mkt.demosBooked, mktPrev.demosBooked).percent : null,
    },
    {
      id: 'closes', label: 'Total Closes', value: sls.totalCloses, format: 'integer',
      trendDirection: 'up',
      changePercent: slsPrev ? calcChange(sls.totalCloses, slsPrev.totalCloses).percent : null,
    },
    {
      id: 'cashCollected', label: 'Cash Collected', value: sls.cashCollected, format: 'currency_whole',
      trendDirection: 'up',
      changePercent: slsPrev ? calcChange(sls.cashCollected, slsPrev.cashCollected).percent : null,
    },
    {
      id: 'costPerPurchase', label: 'Cost Per Purchase', value: mkt.costPerPurchase, format: 'currency',
      trendDirection: 'down',
      changePercent: mktPrev ? calcChange(mkt.costPerPurchase, mktPrev.costPerPurchase).percent : null,
    },
    {
      id: 'closeRate', label: 'Close Rate (Showed)', value: sls.closeRateDemosShowed, format: 'percent',
      trendDirection: 'up',
      changePercent: slsPrev ? calcChange(sls.closeRateDemosShowed, slsPrev.closeRateDemosShowed).percent : null,
    },
  ];

  const funnelSteps: FunnelStep[] = [
    { label: 'Link Clicks', value: mkt.linkClicks },
    { label: 'Leads', value: mkt.totalLeads, conversionRate: mkt.linkClicks > 0 ? (mkt.totalLeads / mkt.linkClicks) * 100 : 0 },
    { label: 'Demos Booked', value: mkt.demosBooked, conversionRate: mkt.totalLeads > 0 ? (mkt.demosBooked / mkt.totalLeads) * 100 : 0 },
    { label: 'Demos Showed', value: mkt.demosShowed, conversionRate: mkt.demosBooked > 0 ? (mkt.demosShowed / mkt.demosBooked) * 100 : 0 },
    { label: 'Closes', value: sls.totalCloses, conversionRate: mkt.demosShowed > 0 ? (sls.totalCloses / mkt.demosShowed) * 100 : 0 },
  ];

  const sourceData = [
    { name: 'Demos', value: sls.closesFromDemos, color: '#14b8a6' },
    { name: 'Ads', value: sls.closesFromAds, color: '#3b82f6' },
    { name: 'Emails', value: sls.closesFromEmails, color: '#a855f7' },
    { name: 'Affiliate', value: sls.closesFromAffiliate, color: '#f59e0b' },
    { name: 'Other', value: sls.closesFromOther, color: '#64748b' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <Section title="Performance Snapshot" subtitle="Key metrics for the selected period">
        <KPIGrid items={kpis} columns={4} />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Marketing Funnel">
          <FunnelChart steps={funnelSteps} height={240} />
        </Section>

        <Section title="Closes by Source">
          <DonutChart data={sourceData} height={240} format="integer" />
        </Section>
      </div>

      <Section title="Trends" subtitle="Period-over-period direction">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Sparkline
            data={trends.marketing.cpl || []}
            label="Cost Per Lead"
            value={formatValue(mkt.cpl, 'currency')}
            color="#14b8a6"
            change={mktPrev ? calcChange(mkt.cpl, mktPrev.cpl).percent : null}
            isPositiveGood={false}
          />
          <Sparkline
            data={trends.marketing.showRate || []}
            label="Demo Show Rate"
            value={formatValue(mkt.showRate, 'percent')}
            color="#3b82f6"
            change={mktPrev ? calcChange(mkt.showRate, mktPrev.showRate).percent : null}
            isPositiveGood={true}
          />
          <Sparkline
            data={trends.sales.closeRate || []}
            label="Close Rate"
            value={formatValue(sls.closeRateDemosShowed, 'percent')}
            color="#a855f7"
            change={slsPrev ? calcChange(sls.closeRateDemosShowed, slsPrev.closeRateDemosShowed).percent : null}
            isPositiveGood={true}
          />
          <Sparkline
            data={trends.sales.cashCollected || []}
            label="Cash Collected"
            value={formatValue(sls.cashCollected, 'currency_whole')}
            color="#22c55e"
            change={slsPrev ? calcChange(sls.cashCollected, slsPrev.cashCollected).percent : null}
            isPositiveGood={true}
          />
        </div>
      </Section>
    </div>
  );
}
