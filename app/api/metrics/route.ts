// ============================================================================
// API Route: /api/metrics
// Fetches all dashboard data from Google Sheets
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
  countTotalLeads,
  buildTrends,
} from '@/lib/aggregation';
import type {
  Segment,
  ViewMode,
  MarketingWeeklyRow,
  SalesWeeklyRow,
  AttributionWeeklyRow,
  PaidSocialLeadsRow,
  SalesRepDailyRow,
  ConfigRow,
} from '@/types';

// Cache for sheet data (30 second TTL)
let cache: {
  data: Record<string, unknown[]> | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = parseInt(process.env.CACHE_DURATION_SECONDS || '30') * 1000;

async function fetchAllSheets() {
  const now = Date.now();
  
  // Return cached data if fresh
  if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
    return cache.data;
  }

  // Fetch all sheets in parallel
  const [
    configRaw,
    marketingRaw,
    attributionRaw,
    salesRaw,
    paidSocialRaw,
    repDailyRaw,
  ] = await Promise.all([
    getSheetData('Config'),
    getSheetData('Marketing_Weekly'),
    getSheetData('Attribution_Weekly'),
    getSheetData('Sales_Weekly'),
    getSheetData('PaidSocial_Leads'),
    getSheetData('Sales_Rep_Daily'),
  ]);

  // Parse into typed objects
  const config = parseSheetRows<ConfigRow>(configRaw, {
    setting_key: 'setting_key',
    setting_value: 'setting_value',
    description: 'description',
  });

  const marketing = parseSheetRows<MarketingWeeklyRow>(marketingRaw, {
    week_start: 'week_start',
    week_end: 'week_end',
    month: 'month',
    quarter: 'quarter',
    campaign_type: 'campaign_type',
    campaigns: 'campaigns',
    spend: 'spend',
    impressions: 'impressions',
    cpm: 'cpm',
    link_clicks: 'link_clicks',
    cpc: 'cpc',
    fb_attributed_leads: 'fb_attributed_leads',
    cpl: 'cpl',
    demos_booked: 'demos_booked',
    demos_showed: 'demos_showed',
    show_rate: 'show_rate',
    cost_per_demo: 'cost_per_demo',
    cost_per_showed: 'cost_per_showed',
    closes: 'closes',
    cost_per_close: 'cost_per_close',
  });

  const attribution = parseSheetRows<AttributionWeeklyRow>(attributionRaw, {
    week_start: 'week_start',
    segment: 'segment',
    attribution_type: 'attribution_type',
    source: 'source',
    count: 'count',
    percentage: 'percentage',
  });

  const sales = parseSheetRows<SalesWeeklyRow>(salesRaw, {
    week_start: 'week_start',
    week_end: 'week_end',
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
    week_start: 'week_start',
    month: 'month',
    quarter: 'quarter',
    rep_name: 'rep_name',
    product: 'product',
    demos_booked: 'demos_booked',
    demos_showed: 'demos_showed',
    demos_no_showed: 'demos_no_showed',
    sales_closed: 'sales_closed',
    cash_collected: 'cash_collected',
    commission_earned: 'commission_earned',
    attribution_source: 'attribution_source',
  });

  // Update cache
  cache = {
    data: { config, marketing, attribution, sales, paidSocial, repDaily },
    timestamp: now,
  };

  return cache.data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segment = (searchParams.get('segment') || 'company') as Segment;
    const viewMode = (searchParams.get('viewMode') || 'weekly') as ViewMode;
    const period = searchParams.get('period') || '';
    const comparePeriod = searchParams.get('comparePeriod') || '';

    // Fetch all sheet data
    const sheets = await fetchAllSheets();
    
    if (!sheets) {
      throw new Error('Failed to fetch sheet data');
    }
    
    const marketing = sheets.marketing as MarketingWeeklyRow[];
    const sales = sheets.sales as SalesWeeklyRow[];
    const attribution = sheets.attribution as AttributionWeeklyRow[];
    const paidSocial = sheets.paidSocial as PaidSocialLeadsRow[];
    const repDaily = sheets.repDaily as SalesRepDailyRow[];
    const config = sheets.config as ConfigRow[];

    // Extract available periods
    const periods = extractPeriods(marketing);

    // Determine selected period (default to most recent)
    const selectedPeriod = period || (
      viewMode === 'weekly' ? periods.weeks[0]?.value :
      viewMode === 'monthly' ? periods.months[0]?.value :
      periods.quarters[0]?.value
    ) || '';

    // Aggregate marketing metrics
    const marketingMetrics = aggregateMarketing(marketing, segment, viewMode, selectedPeriod);
    
    // Add total leads from PaidSocial_Leads
    marketingMetrics.totalLeads = countTotalLeads(paidSocial, segment, viewMode, selectedPeriod);

    // Aggregate sales metrics (needs marketing demos showed for close rate calculation)
    const salesMetrics = aggregateSales(sales, repDaily, marketingMetrics.demosShowed, segment, viewMode, selectedPeriod);

    // Aggregate attribution
    const attributionData = aggregateAttribution(attribution, segment, viewMode, selectedPeriod);

    // Aggregate sales reps
    const repsMetrics = aggregateSalesReps(repDaily, segment, viewMode, selectedPeriod);

    // Get rep daily activity
    const repDailyActivity = getRepDailyActivity(repDaily, segment, viewMode, selectedPeriod);

    // Build trend data
    const trends = buildTrends(marketing, sales, repDaily, segment);

    // Build comparison data if requested
    let comparison = null;
    if (comparePeriod && comparePeriod !== selectedPeriod) {
      const prevMarketing = aggregateMarketing(marketing, segment, viewMode, comparePeriod);
      prevMarketing.totalLeads = countTotalLeads(paidSocial, segment, viewMode, comparePeriod);
      const prevSales = aggregateSales(sales, repDaily, prevMarketing.demosShowed, segment, viewMode, comparePeriod);
      
      comparison = {
        marketing: prevMarketing,
        sales: prevSales,
      };
    }

    // Get config values
    const commissionRate = parseFloat(
      config.find(c => c.setting_key === 'commission_rate')?.setting_value || '0.05'
    );
    const repNames = config
      .filter(c => c.setting_key?.startsWith('rep_'))
      .map(c => c.setting_value)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        marketing: marketingMetrics,
        sales: salesMetrics,
        attribution: attributionData,
        reps: repsMetrics,
        repDaily: repDailyActivity,
        periods,
        trends,
        comparison,
        config: {
          commissionRate,
          repNames,
        },
        meta: {
          segment,
          viewMode,
          selectedPeriod,
          comparePeriod: comparePeriod || null,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
