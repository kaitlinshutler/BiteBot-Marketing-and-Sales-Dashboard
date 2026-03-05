'use client';

import { KPIGrid, Section, TrendChart, BarChartWidget, FunnelChart, DataTable } from '@/components';
import { calcChange } from '@/lib/utils';
import type { MarketingMetrics, AttributionRow, TrendPoint, KPIData, FunnelStep } from '@/types';

interface MarketingViewProps {
  marketing: MarketingMetrics;
  attribution: AttributionRow[];
  trends: {
    marketing: Record<string, TrendPoint[]>;
    sales: Record<string, TrendPoint[]>;
  };
  prevMarketing?: MarketingMetrics;
}

export function MarketingView({ marketing, attribution, trends, prevMarketing }: MarketingViewProps) {
  const mkt = marketing;
  const mktPrev = prevMarketing;
  const trendData = trends.marketing;

  const trafficKpis: KPIData[] = [
    { id: 'adSpend', label: 'Ad Spend', value: mkt.adSpend, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.adSpend, mktPrev.adSpend).percent : null },
    { id: 'uniqueClicks', label: 'Link Clicks', value: mkt.linkClicks, format: 'integer', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.linkClicks, mktPrev.linkClicks).percent : null },
    { id: 'costPerClick', label: 'Cost Per Click', value: mkt.cpc, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.cpc, mktPrev.cpc).percent : null },
    { id: 'cpm', label: 'CPM', value: mkt.cpm, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.cpm, mktPrev.cpm).percent : null },
  ];

  const leadKpis: KPIData[] = [
    { id: 'totalLeads', label: 'Total Leads', value: mkt.totalLeads, format: 'integer', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.totalLeads, mktPrev.totalLeads).percent : null },
    { id: 'fbLeads', label: 'FB-Attributed Leads', value: mkt.fbAttributedLeads, format: 'integer', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.fbAttributedLeads, mktPrev.fbAttributedLeads).percent : null },
    { id: 'cpl', label: 'Cost Per Lead', value: mkt.cpl, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.cpl, mktPrev.cpl).percent : null },
  ];

  const demoKpis: KPIData[] = [
    { id: 'demosBooked', label: 'Demos Booked', value: mkt.demosBooked, format: 'integer', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.demosBooked, mktPrev.demosBooked).percent : null },
    { id: 'demosShowed', label: 'Demos Showed', value: mkt.demosShowed, format: 'integer', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.demosShowed, mktPrev.demosShowed).percent : null },
    { id: 'showRate', label: 'Show Rate', value: mkt.showRate, format: 'percent', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.showRate, mktPrev.showRate).percent : null },
    { id: 'costPerDemo', label: 'Cost Per Demo', value: mkt.costPerDemo, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.costPerDemo, mktPrev.costPerDemo).percent : null },
    { id: 'costPerShowedDemo', label: 'Cost Per Showed', value: mkt.costPerShowedDemo, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.costPerShowedDemo, mktPrev.costPerShowedDemo).percent : null },
  ];

  const convKpis: KPIData[] = [
    { id: 'closes', label: 'Closes', value: mkt.closes, format: 'integer', trendDirection: 'up', changePercent: mktPrev ? calcChange(mkt.closes, mktPrev.closes).percent : null },
    { id: 'costPerPurchase', label: 'Cost Per Purchase', value: mkt.costPerPurchase, format: 'currency', trendDirection: 'down', changePercent: mktPrev ? calcChange(mkt.costPerPurchase, mktPrev.costPerPurchase).percent : null },
  ];

  const funnelSteps: FunnelStep[] = [
    { label: 'Link Clicks', value: mkt.linkClicks },
    { label: 'Total Leads', value: mkt.totalLeads, conversionRate: mkt.linkClicks > 0 ? (mkt.totalLeads / mkt.linkClicks) * 100 : 0 },
    { label: 'Demos Booked', value: mkt.demosBooked, conversionRate: mkt.totalLeads > 0 ? (mkt.demosBooked / mkt.totalLeads) * 100 : 0 },
    { label: 'Demos Showed', value: mkt.demosShowed, conversionRate: mkt.showRate },
    { label: 'Closes', value: mkt.closes, conversionRate: mkt.demosShowed > 0 ? (mkt.closes / mkt.demosShowed) * 100 : 0 },
  ];

  const demoBarData = (trendData.demosBooked || []).map((d, i) => ({
    label: d.label,
    value: d.value,
    secondaryValue: trendData.showRate?.[i] ? Math.round(d.value * (trendData.showRate[i].value / 100)) : 0,
  }));

  const firstTouchData = attribution
    .filter((a) => a.attributionType === 'First Touch')
    .map((a) => ({ source: a.source, count: a.count, percentage: a.percentage }));

  const lastTouchData = attribution
    .filter((a) => a.attributionType === 'Last Touch')
    .map((a) => ({ source: a.source, count: a.count, percentage: a.percentage }));

  const attrColumns = [
    { key: 'source', label: 'Source', sortable: true },
    { key: 'count', label: 'Leads', align: 'right' as const, format: 'integer', sortable: true },
    { key: 'percentage', label: '% Share', align: 'right' as const, format: 'percent', sortable: true },
  ];

  return (
    <div className="space-y-10">
      <Section title="Traffic & Awareness" subtitle="Top of funnel — ad reach and click engagement">
        <KPIGrid items={trafficKpis} columns={4} />
        <div className="mt-4">
          <TrendChart data={trendData.adSpend || []} title="Ad Spend Over Time" color="#14b8a6" format="currency_whole" showArea />
        </div>
      </Section>

      <Section title="Lead Generation" subtitle="Middle of funnel — leads captured and CPL efficiency">
        <KPIGrid items={leadKpis} columns={3} />
        <div className="mt-4">
          <TrendChart data={trendData.cpl || []} title="CPL Trend" color="#f59e0b" format="currency" />
        </div>
      </Section>

      <Section title="Demo Pipeline" subtitle="Bottom of funnel — demo booking and attendance">
        <KPIGrid items={demoKpis} columns={5} />
        <div className="mt-4">
          <BarChartWidget
            data={demoBarData}
            title="Demos Booked vs Showed"
            color="#3b82f6"
            secondaryColor="#14b8a6"
            barLabel="Booked"
            secondaryLabel="Showed"
            format="integer"
          />
        </div>
      </Section>

      <Section title="Conversions" subtitle="Full funnel — from click to close">
        <KPIGrid items={convKpis} columns={2} />
        <div className="mt-4">
          <FunnelChart steps={funnelSteps} title="Marketing Funnel" height={260} />
        </div>
      </Section>

      <Section title="Attribution" subtitle="Lead source breakdown — first and last touch">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DataTable
            columns={attrColumns}
            data={firstTouchData as Record<string, unknown>[]}
            title="First Touch Attribution"
            highlightFirst
            emptyMessage="No first touch attribution data"
          />
          <DataTable
            columns={attrColumns}
            data={lastTouchData as Record<string, unknown>[]}
            title="Last Touch Attribution"
            highlightFirst
            emptyMessage="No last touch attribution data"
          />
        </div>
      </Section>
    </div>
  );
}
