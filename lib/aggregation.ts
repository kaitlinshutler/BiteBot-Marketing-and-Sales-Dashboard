// ============================================================================
// Data Aggregation & Transformation - Daily-based
// ============================================================================

import type {
  Segment,
  ViewMode,
  MarketingMetrics,
  SalesMetrics,
  AttributionRow,
  SalesRepMetrics,
  SalesRepDaily,
  TrendPoint,
  PeriodOption,
  MarketingDailyRow,
  SalesDailyRow,
  AttributionDailyRow,
  SalesRepDailyRow,
  PaidSocialLeadsRow,
} from '@/types';

// ============================================================================
// Segment filtering helpers
// ============================================================================

export function includeInSegment(rowSegment: string, filterSegment: Segment): boolean {
  const seg = rowSegment?.toLowerCase().trim() || '';
  
  if (filterSegment === 'company') {
    return true; // Company includes everything
  }
  
  if (filterSegment === 'bitebot') {
    return seg === 'bitebot';
  }
  
  if (filterSegment === 'smilegen') {
    return seg === 'smilegen';
  }
  
  return false;
}

export function normalizeSegment(raw: string): string {
  const s = raw?.toLowerCase().trim() || '';
  if (s === 'bitebot') return 'bitebot';
  if (s === 'smilegen') return 'smilegen';
  return 'other';
}

// ============================================================================
// Date helpers
// ============================================================================

export function toDateString(value: unknown): string {
  if (!value) return '';
  
  if (typeof value === 'string') {
    if (value.includes('T')) return value.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return value;
  }
  
  if (typeof value === 'number') {
    // Google Sheets serial date
    const d = new Date((value - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  return String(value);
}

export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getMonthFromDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return '';
  return dateStr.substring(0, 7); // "YYYY-MM"
}

export function getQuarterFromDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return '';
  const month = parseInt(dateStr.substring(5, 7));
  const year = dateStr.substring(0, 4);
  const q = Math.ceil(month / 3);
  return `Q${q} ${year}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatWeekLabel(weekStart: string): string {
  if (!weekStart) return '';
  const d = new Date(weekStart);
  if (isNaN(d.getTime())) return weekStart;
  return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function formatMonthLabel(month: string | unknown): string {
  if (!month) return '';
  const monthStr = String(month);
  if (!monthStr.includes('-')) return monthStr;
  const [year, m] = monthStr.split('-');
  const d = new Date(parseInt(year), parseInt(m) - 1, 1);
  if (isNaN(d.getTime())) return monthStr;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ============================================================================
// Period matching
// ============================================================================

function matchesPeriod(
  date: string,
  month: string,
  quarter: string,
  viewMode: ViewMode,
  selectedPeriod: string
): boolean {
  const dateStr = toDateString(date);
  
  switch (viewMode) {
    case 'daily':
      return dateStr === selectedPeriod;
    case 'weekly':
      return getWeekStart(dateStr) === selectedPeriod;
    case 'monthly':
      return (month || getMonthFromDate(dateStr)) === selectedPeriod;
    case 'quarterly':
      return (quarter || getQuarterFromDate(dateStr)) === selectedPeriod;
    default:
      return false;
  }
}

// ============================================================================
// Extract unique periods from data
// ============================================================================

export function extractPeriods(marketingRows: MarketingDailyRow[]): {
  days: PeriodOption[];
  weeks: PeriodOption[];
  months: PeriodOption[];
  quarters: PeriodOption[];
} {
  const daySet = new Set<string>();
  const weekSet = new Set<string>();
  const monthSet = new Set<string>();
  const quarterSet = new Set<string>();

  for (const row of marketingRows) {
    if (row.date) {
      const dateStr = toDateString(row.date);
      if (dateStr) {
        daySet.add(dateStr);
        weekSet.add(getWeekStart(dateStr));
        monthSet.add(row.month || getMonthFromDate(dateStr));
        quarterSet.add(row.quarter || getQuarterFromDate(dateStr));
      }
    }
  }

  const days = Array.from(daySet)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map(d => ({ value: d, label: formatDateLabel(d) }));

  const weeks = Array.from(weekSet)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map(w => ({ value: w, label: formatWeekLabel(w) }));

  const months = Array.from(monthSet)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map(m => ({ value: m, label: formatMonthLabel(m) }));

  const quarters = Array.from(quarterSet)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map(q => ({ value: q, label: q }));

  return { days, weeks, months, quarters };
}

// ============================================================================
// Marketing aggregation
// ============================================================================

export function aggregateMarketing(
  rows: MarketingDailyRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): MarketingMetrics {
  const filtered = rows.filter(row => {
    if (!includeInSegment(row.segment, segment)) return false;
    return matchesPeriod(row.date, row.month, row.quarter, viewMode, selectedPeriod);
  });

  const totals = filtered.reduce((acc, row) => ({
    spend: acc.spend + (row.spend || 0),
    impressions: acc.impressions + (row.impressions || 0),
    linkClicks: acc.linkClicks + (row.link_clicks || 0),
    fbLeads: acc.fbLeads + (row.fb_leads || 0),
    demosBooked: acc.demosBooked + (row.demos_booked || 0),
    demosShowed: acc.demosShowed + (row.demos_showed || 0),
    closes: acc.closes + (row.closes || 0),
  }), {
    spend: 0, impressions: 0, linkClicks: 0, fbLeads: 0,
    demosBooked: 0, demosShowed: 0, closes: 0,
  });

  return {
    adSpend: totals.spend,
    impressions: totals.impressions,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    linkClicks: totals.linkClicks,
    cpc: totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0,
    totalLeads: 0, // Filled from PaidSocial_Leads
    fbAttributedLeads: totals.fbLeads,
    cpl: totals.fbLeads > 0 ? totals.spend / totals.fbLeads : 0,
    demosBooked: totals.demosBooked,
    demosShowed: totals.demosShowed,
    showRate: totals.demosBooked > 0 ? (totals.demosShowed / totals.demosBooked) * 100 : 0,
    costPerDemo: totals.demosBooked > 0 ? totals.spend / totals.demosBooked : 0,
    costPerShowedDemo: totals.demosShowed > 0 ? totals.spend / totals.demosShowed : 0,
    closes: totals.closes,
    costPerPurchase: totals.closes > 0 ? totals.spend / totals.closes : 0,
  };
}

// ============================================================================
// Total leads from PaidSocial_Leads
// ============================================================================

export function countTotalLeads(
  rows: PaidSocialLeadsRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): number {
  return rows.filter(row => {
    const rowSeg = normalizeSegment(row.segment);
    if (segment === 'bitebot' && rowSeg !== 'bitebot') return false;
    if (segment === 'smilegen' && rowSeg !== 'smilegen') return false;
    
    const dateAdded = toDateString(row.date_added);
    return matchesPeriod(dateAdded, getMonthFromDate(dateAdded), getQuarterFromDate(dateAdded), viewMode, selectedPeriod);
  }).length;
}

// ============================================================================
// Sales aggregation
// ============================================================================

export function aggregateSales(
  salesRows: SalesDailyRow[],
  repDailyRows: SalesRepDailyRow[],
  marketingDemosShowed: number,
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): SalesMetrics {
  const filtered = salesRows.filter(row => {
    if (!includeInSegment(row.segment, segment)) return false;
    return matchesPeriod(row.date, row.month, row.quarter, viewMode, selectedPeriod);
  });

  const closeTotals = filtered.reduce((acc, row) => ({
    totalCloses: acc.totalCloses + (row.total_closes || 0),
    fromDemos: acc.fromDemos + (row.from_demo || 0),
    fromAds: acc.fromAds + (row.from_ads || 0),
    fromEmails: acc.fromEmails + (row.from_email || 0),
    fromAffiliate: acc.fromAffiliate + (row.from_affiliate || 0),
    fromOther: acc.fromOther + (row.from_other || 0) + (row.from_referral || 0) + (row.from_organic || 0) + (row.from_direct || 0),
  }), {
    totalCloses: 0, fromDemos: 0, fromAds: 0, fromEmails: 0, fromAffiliate: 0, fromOther: 0,
  });

  // Get cash collected from Sales_Rep_Daily
  const cashCollected = aggregateCashFromReps(repDailyRows, viewMode, selectedPeriod);

  return {
    totalCloses: closeTotals.totalCloses,
    cashCollected,
    avgDealValue: closeTotals.totalCloses > 0 ? cashCollected / closeTotals.totalCloses : 0,
    closeRateDemosShowed: marketingDemosShowed > 0 ? (closeTotals.fromDemos / marketingDemosShowed) * 100 : 0,
    closesFromDemos: closeTotals.fromDemos,
    closesFromAds: closeTotals.fromAds,
    closesFromEmails: closeTotals.fromEmails,
    closesFromAffiliate: closeTotals.fromAffiliate,
    closesFromOther: closeTotals.fromOther,
  };
}

export function aggregateCashFromReps(
  rows: SalesRepDailyRow[],
  viewMode: ViewMode,
  selectedPeriod: string
): number {
  return rows.filter(row => {
    return matchesPeriod(row.date, row.month, row.quarter, viewMode, selectedPeriod);
  }).reduce((sum, row) => sum + (row.cash_collected || 0), 0);
}

// ============================================================================
// Attribution aggregation
// ============================================================================

export function aggregateAttribution(
  rows: AttributionDailyRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): AttributionRow[] {
  const filtered = rows.filter(row => {
    if (!includeInSegment(row.segment, segment)) return false;
    return matchesPeriod(row.date, row.month, row.quarter, viewMode, selectedPeriod);
  });

  // Group by attribution_type + source and sum counts
  const grouped: Record<string, { type: string; source: string; count: number }> = {};
  
  for (const row of filtered) {
    const key = `${row.attribution_type}|${row.source}`;
    if (!grouped[key]) {
      grouped[key] = { type: row.attribution_type, source: row.source, count: 0 };
    }
    grouped[key].count += row.count || 0;
  }

  // Calculate percentages by type
  const firstTouchTotal = Object.values(grouped)
    .filter(g => g.type === 'First Touch')
    .reduce((sum, g) => sum + g.count, 0);
  
  const lastTouchTotal = Object.values(grouped)
    .filter(g => g.type === 'Last Touch')
    .reduce((sum, g) => sum + g.count, 0);

  return Object.values(grouped).map(g => ({
    attributionType: g.type as 'First Touch' | 'Last Touch',
    source: g.source,
    count: g.count,
    percentage: g.type === 'First Touch' 
      ? (firstTouchTotal > 0 ? (g.count / firstTouchTotal) * 100 : 0)
      : (lastTouchTotal > 0 ? (g.count / lastTouchTotal) * 100 : 0),
  })).sort((a, b) => b.count - a.count);
}

// ============================================================================
// Sales Rep aggregation
// ============================================================================

export function aggregateSalesReps(
  rows: SalesRepDailyRow[],
  viewMode: ViewMode,
  selectedPeriod: string
): SalesRepMetrics[] {
  const filtered = rows.filter(row => {
    return matchesPeriod(row.date, row.month, row.quarter, viewMode, selectedPeriod);
  });

  // Group by rep_name
  const byRep: Record<string, SalesRepDailyRow[]> = {};
  for (const row of filtered) {
    const rep = row.rep_name || 'Unknown';
    if (!byRep[rep]) byRep[rep] = [];
    byRep[rep].push(row);
  }

  return Object.entries(byRep).map(([repName, repRows]) => {
    const totals = repRows.reduce((acc, r) => ({
      callsMade: acc.callsMade + (r.calls_made || 0),
      demosBooked: acc.demosBooked + (r.demos_booked || 0),
      demosShowed: acc.demosShowed + (r.demos_showed || 0),
      demosNoShowed: acc.demosNoShowed + (r.demos_no_showed || 0),
      salesClosed: acc.salesClosed + (r.sales_closed || 0),
      cashCollected: acc.cashCollected + (r.cash_collected || 0),
      commissionEarned: acc.commissionEarned + (r.commission_earned || 0),
    }), { 
      callsMade: 0, demosBooked: 0, demosShowed: 0, demosNoShowed: 0, 
      salesClosed: 0, cashCollected: 0, commissionEarned: 0 
    });

    return {
      repName,
      callsMade: totals.callsMade,
      demosBooked: totals.demosBooked,
      demosShowed: totals.demosShowed,
      demosNoShowed: totals.demosNoShowed,
      salesClosed: totals.salesClosed,
      cashCollected: totals.cashCollected,
      commissionEarned: totals.commissionEarned,
      showRate: totals.demosBooked > 0 ? (totals.demosShowed / totals.demosBooked) * 100 : 0,
      closeRate: totals.demosShowed > 0 ? (totals.salesClosed / totals.demosShowed) * 100 : 0,
    };
  }).sort((a, b) => b.cashCollected - a.cashCollected);
}

// ============================================================================
// Get daily activity rows for reps view
// ============================================================================

export function getRepDailyActivity(
  rows: SalesRepDailyRow[],
  viewMode: ViewMode,
  selectedPeriod: string,
  repName?: string
): SalesRepDaily[] {
  return rows.filter(row => {
    if (repName && repName !== 'all' && row.rep_name !== repName) return false;
    return matchesPeriod(row.date, row.month, row.quarter, viewMode, selectedPeriod);
  }).map(row => ({
    date: toDateString(row.date),
    repName: row.rep_name || '',
    callsMade: row.calls_made || 0,
    demosBooked: row.demos_booked || 0,
    demosShowed: row.demos_showed || 0,
    demosNoShowed: row.demos_no_showed || 0,
    salesClosed: row.sales_closed || 0,
    cashCollected: row.cash_collected || 0,
    commissionEarned: row.commission_earned || 0,
    attributionSource: row.attribution_source || '',
  })).sort((a, b) => b.date.localeCompare(a.date));
}

// ============================================================================
// Build trend data for charts
// ============================================================================

export function buildTrends(
  marketingRows: MarketingDailyRow[],
  salesRows: SalesDailyRow[],
  repDailyRows: SalesRepDailyRow[],
  segment: Segment,
  viewMode: ViewMode
): { marketing: Record<string, TrendPoint[]>; sales: Record<string, TrendPoint[]> } {
  // Get unique periods based on view mode
  let periods: string[] = [];
  
  if (viewMode === 'daily') {
    const dateSet = new Set<string>();
    marketingRows.forEach(r => {
      const d = toDateString(r.date);
      if (d) dateSet.add(d);
    });
    periods = Array.from(dateSet).sort().slice(-14); // Last 14 days
  } else if (viewMode === 'weekly') {
    const weekSet = new Set<string>();
    marketingRows.forEach(r => {
      const ws = getWeekStart(toDateString(r.date));
      if (ws) weekSet.add(ws);
    });
    periods = Array.from(weekSet).sort().slice(-8); // Last 8 weeks
  } else if (viewMode === 'monthly') {
    const monthSet = new Set<string>();
    marketingRows.forEach(r => {
      const m = r.month || getMonthFromDate(toDateString(r.date));
      if (m) monthSet.add(m);
    });
    periods = Array.from(monthSet).sort().slice(-6); // Last 6 months
  } else {
    const qSet = new Set<string>();
    marketingRows.forEach(r => {
      const q = r.quarter || getQuarterFromDate(toDateString(r.date));
      if (q) qSet.add(q);
    });
    periods = Array.from(qSet).sort().slice(-4); // Last 4 quarters
  }

  const marketing: Record<string, TrendPoint[]> = {
    adSpend: [],
    cpl: [],
    leads: [],
    demosBooked: [],
    showRate: [],
  };

  const sales: Record<string, TrendPoint[]> = {
    cashCollected: [],
    closes: [],
    closeRate: [],
  };

  for (const period of periods) {
    const mkt = aggregateMarketing(marketingRows, segment, viewMode, period);
    const sls = aggregateSales(salesRows, repDailyRows, mkt.demosShowed, segment, viewMode, period);
    
    let label = period;
    if (viewMode === 'daily') {
      label = new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (viewMode === 'weekly') {
      label = new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (viewMode === 'monthly') {
      const [year, month] = period.split('-');
      label = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    }
    
    marketing.adSpend.push({ period, label, value: mkt.adSpend });
    marketing.cpl.push({ period, label, value: mkt.cpl });
    marketing.leads.push({ period, label, value: mkt.fbAttributedLeads });
    marketing.demosBooked.push({ period, label, value: mkt.demosBooked });
    marketing.showRate.push({ period, label, value: mkt.showRate });
    
    sales.cashCollected.push({ period, label, value: sls.cashCollected });
    sales.closes.push({ period, label, value: sls.totalCloses });
    sales.closeRate.push({ period, label, value: sls.closeRateDemosShowed });
  }

  return { marketing, sales };
}
