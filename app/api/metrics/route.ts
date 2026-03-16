// ============================================================================
// API Route: /api/metrics
// Fetches data from Google Sheets and returns aggregated metrics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, parseSheetRows } from '@/lib/sheets';
import {
  extractPeriods,
  aggregateMarketing,
  aggregateSales,
  aggregateAttribution,
  aggregateSalesReps,
  getRepDailyActivity,
  buildTrends,
  countTotalLeads,
} from '@/lib/aggregation';
import type {
  Segment,
  ViewMode,
  ConfigRow,
  MarketingDailyRow,
  SalesDailyRow,
  AttributionDailyRow,
  SalesRepDailyRow,
  PaidSocialLeadsRow,
} from '@/types';

// Cache configuration
const CACHE_DURATION = parseInt(process.env.CACHE_DURATION_SECONDS || '30') * 1000;
let cache: {
  data: {
    config: ConfigRow[];
    marketing: MarketingDailyRow[];
    sales: SalesDailyRow[];
    attribution: AttributionDailyRow[];
    paidSocial: PaidSocialLeadsRow[];
    repDaily: SalesRepDailyRow[];
  } | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

async function fetchAllData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
    return cache.data;
  }

  // Fetch all sheets in parallel
  const [
    configRaw,
    marketingRaw,
    salesRaw,
    attributionRaw,
    paidSocialRaw,
    repDailyRaw,
  ] = await Promise.all([
    getSheetData('Config'),
    getSheetData('Marketing_Daily'),
    getSheetData('Sales_Daily'),
    getSheetData('Attribution_Daily'),
    getSheetData('PaidSocial_Leads'),
    getSheetData('Sales_Rep_Daily'),
  ]);

  // Parse into typed objects
  const config = parseSheetRows<ConfigRow>(configRaw, {
    setting_key: 'setting_key',
    setting_value: 'setting_value',
    description: 'description',
  });

  const marketing = parseSheetRows<MarketingDailyRow>(marketingRaw, {
    date: 'date',
    month: 'month',
    quarter: 'quarter',
    segment: 'segment',
    campaigns: 'campaigns',
    spend: 'spend',
    impressions: 'impressions',
    cpm: 'cpm',
    link_clicks: 'link_clicks',
    cpc: 'cpc',
    fb_leads: 'fb_leads',
    cpl: 'cpl',
    demos_booked: 'demos_booked',
    demos_showed: 'demos_showed',
    show_rate: 'show_rate',
    closes: 'closes',
    cost_per_close: 'cost_per_close',
  });

  const sales = parseSheetRows<SalesDailyRow>(salesRaw, {
    date: 'date',
    month: 'month',
    quarter: 'quarter',
    segment: 'segment',
    total_closes: 'total_closes',
    from_demo: 'from_demo',
    from_ads: 'from_ads',
    from_email: 'from_email',
    from_affiliate: 'from_affiliate',
    from_referral: 'from_referral',
    from_organic: 'from_organic',
    from_direct: 'from_direct',
    from_other: 'from_other',
  });

  const attribution = parseSheetRows<AttributionDailyRow>(attributionRaw, {
    date: 'date',
    month: 'month',
    quarter: 'quarter',
    segment: 'segment',
    attribution_type: 'attribution_type',
    source: 'source',
    count: 'count',
    percentage: 'percentage',
  });

  const paidSocial = parseSheetRows<PaidSocialLeadsRow>(paidSocialRaw, {
    date_added: 'date_added',
    email: 'email',
    name: 'name',
    contact_source: 'contact_source',
    first_click_url: 'first_click_url',
    attribution_source: 'attribution_source',
    campaign: 'campaign',
    medium: 'medium',
    ad_content: 'ad_content',
    placement: 'placement',
    segment: 'segment',
  });

  const repDaily = parseSheetRows<SalesRepDailyRow>(repDailyRaw, {
    date: 'date',
    month: 'month',
    quarter: 'quarter',
    rep_name: 'rep_name',
    calls_made: 'calls_made',
    demos_booked: 'demos_booked',
    demos_showed: 'demos_showed',
    demos_no_showed: 'demos_no_showed',
    sales_closed: 'sales_closed',
    close_rate: 'close_rate',
    cash_collected: 'cash_collected',
    commission_earned: 'commission_earned',
    attribution_source: 'attribution_source',
  });

  // Update cache
  const result = { config, marketing, sales, attribution, paidSocial, repDaily };
  cache = {
    data: result,
    timestamp: now,
  };

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segment = (searchParams.get('segment') || 'company') as Segment;
    const viewMode = (searchParams.get('viewMode') || 'weekly') as ViewMode;
    const selectedPeriod = searchParams.get('period') || '';
    const comparePeriod = searchParams.get('comparePeriod') || '';

    const data = await fetchAllData();
    
    // Extract available periods
    const periods = extractPeriods(data.marketing);
    
    // Use first available period if none selected
    let period = selectedPeriod;
    if (!period) {
      if (viewMode === 'daily' && periods.days.length > 0) {
        period = periods.days[0].value;
      } else if (viewMode === 'weekly' && periods.weeks.length > 0) {
        period = periods.weeks[0].value;
      } else if (viewMode === 'monthly' && periods.months.length > 0) {
        period = periods.months[0].value;
      } else if (viewMode === 'quarterly' && periods.quarters.length > 0) {
        period = periods.quarters[0].value;
      }
    }

    // Aggregate data for current period
    const marketing = aggregateMarketing(data.marketing, segment, viewMode, period);
    const totalLeads = countTotalLeads(data.paidSocial, segment, viewMode, period);
    marketing.totalLeads = totalLeads;

    const sales = aggregateSales(data.sales, data.repDaily, marketing.demosShowed, segment, viewMode, period);
    const attribution = aggregateAttribution(data.attribution, segment, viewMode, period);
    const reps = aggregateSalesReps(data.repDaily, viewMode, period);
    const repDaily = getRepDailyActivity(data.repDaily, viewMode, period);

    // Build trends
    const trends = buildTrends(data.marketing, data.sales, data.repDaily, segment, viewMode);

    // Comparison data if requested
    let prevMarketing = null;
    let prevSales = null;
    
    if (comparePeriod) {
      prevMarketing = aggregateMarketing(data.marketing, segment, viewMode, comparePeriod);
      prevMarketing.totalLeads = countTotalLeads(data.paidSocial, segment, viewMode, comparePeriod);
      prevSales = aggregateSales(data.sales, data.repDaily, prevMarketing.demosShowed, segment, viewMode, comparePeriod);
    }

    return NextResponse.json({
      marketing,
      sales,
      attribution,
      reps,
      repDaily,
      periods,
      trends,
      prevMarketing,
      prevSales,
      selectedPeriod: period,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
