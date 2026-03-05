'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, ComparisonPanel } from '@/components';
import { OverviewView } from './views/OverviewView';
import { MarketingView } from './views/MarketingView';
import { SalesView } from './views/SalesView';
import { RepsView } from './views/RepsView';
import { calcChange } from '@/lib/utils';
import type {
  DashboardView,
  Segment,
  ViewMode,
  PeriodOption,
  MarketingMetrics,
  SalesMetrics,
  AttributionRow,
  SalesRepMetrics,
  SalesRepDaily,
  TrendPoint,
  ComparisonData,
} from '@/types';

interface ApiResponse {
  success: boolean;
  data: {
    marketing: MarketingMetrics;
    sales: SalesMetrics;
    attribution: AttributionRow[];
    reps: SalesRepMetrics[];
    repDaily: SalesRepDaily[];
    periods: {
      weeks: PeriodOption[];
      months: PeriodOption[];
      quarters: PeriodOption[];
    };
    trends: {
      marketing: Record<string, TrendPoint[]>;
      sales: Record<string, TrendPoint[]>;
    };
    comparison: {
      marketing: MarketingMetrics;
      sales: SalesMetrics;
    } | null;
    config: {
      commissionRate: number;
      repNames: string[];
    };
    meta: {
      segment: Segment;
      viewMode: ViewMode;
      selectedPeriod: string;
      comparePeriod: string | null;
      timestamp: string;
    };
  };
  error?: string;
}

export default function DashboardPage() {
  // UI State
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [segment, setSegment] = useState<Segment>('company');
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod, setComparePeriod] = useState<string>('');

  // Data State
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        segment,
        viewMode,
        ...(selectedPeriod && { period: selectedPeriod }),
        ...(compareMode && comparePeriod && { comparePeriod }),
      });

      const res = await fetch(`/api/metrics?${params}`);
      const json: ApiResponse = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch data');
      }

      setData(json.data);
      
      // Set default period if not set
      if (!selectedPeriod && json.data.periods) {
        const defaultPeriod = viewMode === 'weekly' 
          ? json.data.periods.weeks[0]?.value
          : viewMode === 'monthly'
            ? json.data.periods.months[0]?.value
            : json.data.periods.quarters[0]?.value;
        if (defaultPeriod) {
          setSelectedPeriod(defaultPeriod);
          // Set compare period to second option
          const compareDefault = viewMode === 'weekly'
            ? json.data.periods.weeks[1]?.value
            : viewMode === 'monthly'
              ? json.data.periods.months[1]?.value
              : json.data.periods.quarters[1]?.value;
          if (compareDefault) setComparePeriod(compareDefault);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [segment, viewMode, selectedPeriod, compareMode, comparePeriod]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Get period options based on view mode
  const periodOptions = useMemo(() => {
    if (!data?.periods) return [];
    switch (viewMode) {
      case 'weekly': return data.periods.weeks;
      case 'monthly': return data.periods.months;
      case 'quarterly': return data.periods.quarters;
    }
  }, [data?.periods, viewMode]);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedPeriod(''); // Reset to trigger default selection
    setComparePeriod('');
  };

  // Get labels for comparison panel
  const currentPeriodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label ?? selectedPeriod;
  const comparePeriodLabel = periodOptions.find(p => p.value === comparePeriod)?.label ?? comparePeriod;

  // Build comparison data
  const comparisonData: ComparisonData[] = useMemo(() => {
    if (!data || !data.comparison) return [];

    const mkt = data.marketing;
    const mktPrev = data.comparison.marketing;
    const sales = data.sales;
    const salesPrev = data.comparison.sales;

    function comp(
      id: string,
      label: string,
      a: number | null,
      b: number | null,
      format: ComparisonData['format'],
      isPositiveGood: boolean
    ): ComparisonData {
      const c = calcChange(a, b);
      return { metricId: id, label, periodA: a, periodB: b, change: c.absolute, changePercent: c.percent, format, isPositiveGood };
    }

    if (activeView === 'overview' || activeView === 'marketing') {
      const marketingComps: ComparisonData[] = [
        comp('adSpend', 'Ad Spend', mkt.adSpend, mktPrev.adSpend, 'currency', false),
        comp('totalLeads', 'Total Leads', mkt.totalLeads, mktPrev.totalLeads, 'integer', true),
        comp('cpl', 'CPL', mkt.cpl, mktPrev.cpl, 'currency', false),
        comp('demosBooked', 'Demos Booked', mkt.demosBooked, mktPrev.demosBooked, 'integer', true),
        comp('showRate', 'Show Rate', mkt.showRate, mktPrev.showRate, 'percent', true),
        comp('costPerPurchase', 'Cost Per Purchase', mkt.costPerPurchase, mktPrev.costPerPurchase, 'currency', false),
      ];

      if (activeView === 'marketing') return marketingComps;

      return [
        ...marketingComps,
        comp('closes', 'Total Closes', sales.totalCloses, salesPrev.totalCloses, 'integer', true),
        comp('cashCollected', 'Cash Collected', sales.cashCollected, salesPrev.cashCollected, 'currency_whole', true),
        comp('closeRate', 'Close Rate', sales.closeRateDemosShowed, salesPrev.closeRateDemosShowed, 'percent', true),
      ];
    }

    if (activeView === 'sales') {
      return [
        comp('closes', 'Total Closes', sales.totalCloses, salesPrev.totalCloses, 'integer', true),
        comp('cashCollected', 'Cash Collected', sales.cashCollected, salesPrev.cashCollected, 'currency_whole', true),
        comp('avgDeal', 'Avg Deal Value', sales.avgDealValue, salesPrev.avgDealValue, 'currency', true),
        comp('closeRate', 'Close Rate', sales.closeRateDemosShowed, salesPrev.closeRateDemosShowed, 'percent', true),
        comp('fromDemos', 'Closes from Demos', sales.closesFromDemos, salesPrev.closesFromDemos, 'integer', true),
        comp('fromAds', 'Closes from Ads', sales.closesFromAds, salesPrev.closesFromAds, 'integer', true),
      ];
    }

    return [];
  }, [data, activeView]);

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Failed to Load Data</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        segment={segment}
        onSegmentChange={setSegment}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        periodOptions={periodOptions}
        compareMode={compareMode}
        onCompareModeToggle={() => setCompareMode(!compareMode)}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading indicator for background refreshes */}
        {loading && data && (
          <div className="fixed top-20 right-6 z-50">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-full text-xs text-slate-400">
              <div className="w-3 h-3 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
              Refreshing...
            </div>
          </div>
        )}

        {/* Comparison panel */}
        {compareMode && data?.comparison && (
          <ComparisonPanel
            isOpen={compareMode}
            periodALabel={currentPeriodLabel}
            periodBLabel={comparePeriodLabel}
            periodB={comparePeriod}
            onPeriodBChange={setComparePeriod}
            periodOptions={periodOptions.filter(p => p.value !== selectedPeriod)}
            data={comparisonData}
          />
        )}

        {/* Active view */}
        {data && (
          <>
            {activeView === 'overview' && (
              <OverviewView
                marketing={data.marketing}
                sales={data.sales}
                trends={data.trends}
                prevMarketing={data.comparison?.marketing}
                prevSales={data.comparison?.sales}
              />
            )}
            {activeView === 'marketing' && (
              <MarketingView
                marketing={data.marketing}
                attribution={data.attribution}
                trends={data.trends}
                prevMarketing={data.comparison?.marketing}
              />
            )}
            {activeView === 'sales' && (
              <SalesView
                sales={data.sales}
                trends={data.trends}
                prevSales={data.comparison?.sales}
                segment={segment}
              />
            )}
            {activeView === 'reps' && (
              <RepsView
                reps={data.reps}
                repDaily={data.repDaily}
                segment={segment}
                config={data.config}
              />
            )}
          </>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 border-t border-slate-800/30">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <p>BiteBot Marketing & Sales Dashboard</p>
            <p className="font-mono">
              {data?.meta.timestamp 
                ? `Last updated: ${new Date(data.meta.timestamp).toLocaleTimeString()}`
                : ''}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
