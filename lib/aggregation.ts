// ============================================================================
// Data Aggregation & Transformation
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
  MarketingWeeklyRow,
  SalesWeeklyRow,
  AttributionWeeklyRow,
  PaidSocialLeadsRow,
  SalesRepDailyRow,
} from '@/types';

// ============================================================================
// Segment filtering helpers
// ============================================================================

// Check if a campaign_type/segment should be included in a given segment filter
export function includeInSegment(rowSegment: string, filterSegment: Segment): boolean {
  const seg = rowSegment?.toLowerCase().trim() || '';
  
  if (filterSegment === 'company') {
    // Company includes everything
    return true;
  }
  
  if (filterSegment === 'bitebot') {
    // Only exact BiteBot match
    return seg === 'bitebot';
  }
  
  if (filterSegment === 'smilegen') {
    // Only exact SmileGen match
    return seg === 'smilegen';
  }
  
  return false;
}

// Normalize segment names from various sheet formats
export function normalizeSegment(raw: string): string {
  const s = raw?.toLowerCase().trim() || '';
  if (s === 'bitebot') return 'bitebot';
  if (s === 'smilegen') return 'smilegen';
  if (s.includes('bitebot') && s.includes('smilegen')) return 'both'; // company only
  if (s === 'retargeting') return 'retargeting'; // company only
  return 'other';
}

// ============================================================================
// Period helpers
// ============================================================================

export function getWeekStart(dateStr: string): string {
  // Handle various date formats and return Monday of that week as YYYY-MM-DD
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function formatMonthLabel(month: string): string {
  // month format: "YYYY-MM"
  const [year, m] = month.split('-');
  const d = new Date(parseInt(year), parseInt(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getMonthFromWeekStart(weekStart: string): string {
  // Week belongs to month where Monday falls
  return weekStart.substring(0, 7); // "YYYY-MM"
}

export function getQuarterFromMonth(month: string): string {
  const m = parseInt(month.split('-')[1]);
  const year = month.split('-')[0];
  const q = Math.ceil(m / 3);
  return `Q${q} ${year}`;
}

// ============================================================================
// Extract unique periods from data
// ============================================================================

export function extractPeriods(marketingRows: MarketingWeeklyRow[]): {
  weeks: PeriodOption[];
  months: PeriodOption[];
  quarters: PeriodOption[];
} {
  const weekSet = new Set<string>();
  const monthSet = new Set<string>();
  const quarterSet = new Set<string>();

  for (const row of marketingRows) {
    if (row.week_start) {
      const ws = typeof row.week_start === 'string' 
        ? row.week_start.split('T')[0] 
        : row.week_start;
      weekSet.add(ws);
      monthSet.add(row.month || getMonthFromWeekStart(ws));
      quarterSet.add(row.quarter || getQuarterFromMonth(row.month || getMonthFromWeekStart(ws)));
    }
  }

  const weeks = Array.from(weekSet)
    .sort((a, b) => b.localeCompare(a))
    .map(w => ({ value: w, label: formatWeekLabel(w) }));

  const months = Array.from(monthSet)
    .sort((a, b) => b.localeCompare(a))
    .map(m => ({ value: m, label: formatMonthLabel(m) }));

  const quarters = Array.from(quarterSet)
    .sort((a, b) => b.localeCompare(a))
    .map(q => ({ value: q, label: q }));

  return { weeks, months, quarters };
}

// ============================================================================
// Marketing aggregation
// ============================================================================

export function aggregateMarketing(
  rows: MarketingWeeklyRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): MarketingMetrics {
  // Filter rows by segment and period
  const filtered = rows.filter(row => {
    // Segment filter
    if (!includeInSegment(row.campaign_type, segment)) return false;
    
    // Period filter
    const ws = typeof row.week_start === 'string' 
      ? row.week_start.split('T')[0] 
      : String(row.week_start);
    
    if (viewMode === 'weekly') {
      return ws === selectedPeriod;
    } else if (viewMode === 'monthly') {
      const rowMonth = row.month || getMonthFromWeekStart(ws);
      return rowMonth === selectedPeriod;
    } else if (viewMode === 'quarterly') {
      return row.quarter === selectedPeriod;
    }
    return false;
  });

  // Sum flow metrics
  const totals = filtered.reduce((acc, row) => ({
    spend: acc.spend + (row.spend || 0),
    impressions: acc.impressions + (row.impressions || 0),
    linkClicks: acc.linkClicks + (row.link_clicks || 0),
    fbAttributedLeads: acc.fbAttributedLeads + (row.fb_attributed_leads || 0),
    demosBooked: acc.demosBooked + (row.demos_booked || 0),
    demosShowed: acc.demosShowed + (row.demos_showed || 0),
    closes: acc.closes + (row.closes || 0),
  }), {
    spend: 0, impressions: 0, linkClicks: 0, fbAttributedLeads: 0,
    demosBooked: 0, demosShowed: 0, closes: 0,
  });

  // Calculate ratios from aggregated totals (never average)
  return {
    adSpend: totals.spend,
    impressions: totals.impressions,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    linkClicks: totals.linkClicks,
    cpc: totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0,
    totalLeads: 0, // Will be filled from PaidSocial_Leads
    fbAttributedLeads: totals.fbAttributedLeads,
    cpl: totals.fbAttributedLeads > 0 ? totals.spend / totals.fbAttributedLeads : 0,
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
    // Segment filter
    const rowSeg = normalizeSegment(row.segment);
    if (segment === 'bitebot' && rowSeg !== 'bitebot') return false;
    if (segment === 'smilegen' && rowSeg !== 'smilegen') return false;
    // Company includes all
    
    // Period filter
    const dateAdded = typeof row.date_added === 'string' 
      ? row.date_added.split('T')[0] 
      : String(row.date_added);
    const ws = getWeekStart(dateAdded);
    
    if (viewMode === 'weekly') {
      return ws === selectedPeriod;
    } else if (viewMode === 'monthly') {
      return getMonthFromWeekStart(ws) === selectedPeriod;
    } else if (viewMode === 'quarterly') {
      return getQuarterFromMonth(getMonthFromWeekStart(ws)) === selectedPeriod;
    }
    return false;
  }).length;
}

// ============================================================================
// Sales aggregation
// ============================================================================

export function aggregateSales(
  salesRows: SalesWeeklyRow[],
  repDailyRows: SalesRepDailyRow[],
  marketingDemosShowed: number,
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): SalesMetrics {
  // Filter sales rows
  const filtered = salesRows.filter(row => {
    if (!includeInSegment(row.segment, segment)) return false;
    
    const ws = typeof row.week_start === 'string' 
      ? row.week_start.split('T')[0] 
      : String(row.week_start);
    
    if (viewMode === 'weekly') return ws === selectedPeriod;
    if (viewMode === 'monthly') return (row.month || getMonthFromWeekStart(ws)) === selectedPeriod;
    if (viewMode === 'quarterly') return row.quarter === selectedPeriod;
    return false;
  });

  // Sum closes
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

  // Get cash collected from SalesRep_Daily
  const cashCollected = aggregateCashFromReps(repDailyRows, segment, viewMode, selectedPeriod);

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

// ============================================================================
// Cash collected from SalesRep_Daily
// ============================================================================

export function aggregateCashFromReps(
  rows: SalesRepDailyRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): number {
  return rows.filter(row => {
    // Segment filter (product column)
    const prod = row.product?.toLowerCase().trim() || '';
    if (segment === 'bitebot' && prod !== 'bitebot') return false;
    if (segment === 'smilegen' && prod !== 'smilegen') return false;
    // Company includes both
    
    // Period filter
    const ws = typeof row.week_start === 'string' 
      ? row.week_start.split('T')[0] 
      : String(row.week_start);
    
    if (viewMode === 'weekly') return ws === selectedPeriod;
    if (viewMode === 'monthly') return (row.month || getMonthFromWeekStart(ws)) === selectedPeriod;
    if (viewMode === 'quarterly') return row.quarter === selectedPeriod;
    return false;
  }).reduce((sum, row) => sum + (row.cash_collected || 0), 0);
}

// ============================================================================
// Attribution aggregation
// ============================================================================

export function aggregateAttribution(
  rows: AttributionWeeklyRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): AttributionRow[] {
  const filtered = rows.filter(row => {
    if (!includeInSegment(row.segment, segment)) return false;
    
    const ws = typeof row.week_start === 'string' 
      ? row.week_start.split('T')[0] 
      : String(row.week_start);
    
    if (viewMode === 'weekly') return ws === selectedPeriod;
    if (viewMode === 'monthly') return getMonthFromWeekStart(ws) === selectedPeriod;
    if (viewMode === 'quarterly') return getQuarterFromMonth(getMonthFromWeekStart(ws)) === selectedPeriod;
    return false;
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
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string
): SalesRepMetrics[] {
  // Filter by period
  const filtered = rows.filter(row => {
    const ws = typeof row.week_start === 'string' 
      ? row.week_start.split('T')[0] 
      : String(row.week_start);
    
    if (viewMode === 'weekly') return ws === selectedPeriod;
    if (viewMode === 'monthly') return (row.month || getMonthFromWeekStart(ws)) === selectedPeriod;
    if (viewMode === 'quarterly') return row.quarter === selectedPeriod;
    return false;
  });

  // Group by rep_name
  const byRep: Record<string, SalesRepDailyRow[]> = {};
  for (const row of filtered) {
    const rep = row.rep_name || 'Unknown';
    if (!byRep[rep]) byRep[rep] = [];
    byRep[rep].push(row);
  }

  return Object.entries(byRep).map(([repName, repRows]) => {
    const bitebot = repRows.filter(r => r.product?.toLowerCase() === 'bitebot');
    const smilegen = repRows.filter(r => r.product?.toLowerCase() === 'smilegen');
    
    const sumRows = (arr: SalesRepDailyRow[]) => arr.reduce((acc, r) => ({
      demosBooked: acc.demosBooked + (r.demos_booked || 0),
      demosShowed: acc.demosShowed + (r.demos_showed || 0),
      demosNoShowed: acc.demosNoShowed + (r.demos_no_showed || 0),
      salesClosed: acc.salesClosed + (r.sales_closed || 0),
      cashCollected: acc.cashCollected + (r.cash_collected || 0),
      commissionEarned: acc.commissionEarned + (r.commission_earned || 0),
    }), { demosBooked: 0, demosShowed: 0, demosNoShowed: 0, salesClosed: 0, cashCollected: 0, commissionEarned: 0 });

    const bbTotals = sumRows(bitebot);
    const sgTotals = sumRows(smilegen);
    
    // Apply segment filter to totals
    let totalBooked = 0, totalShowed = 0, totalNoShowed = 0, totalClosed = 0, totalCash = 0, totalComm = 0;
    
    if (segment === 'company' || segment === 'bitebot') {
      totalBooked += bbTotals.demosBooked;
      totalShowed += bbTotals.demosShowed;
      totalNoShowed += bbTotals.demosNoShowed;
      totalClosed += bbTotals.salesClosed;
      totalCash += bbTotals.cashCollected;
      totalComm += bbTotals.commissionEarned;
    }
    if (segment === 'company' || segment === 'smilegen') {
      totalBooked += sgTotals.demosBooked;
      totalShowed += sgTotals.demosShowed;
      totalNoShowed += sgTotals.demosNoShowed;
      totalClosed += sgTotals.salesClosed;
      totalCash += sgTotals.cashCollected;
      totalComm += sgTotals.commissionEarned;
    }

    return {
      repName,
      demosBooked: totalBooked,
      demosShowed: totalShowed,
      demosNoShowed: totalNoShowed,
      salesClosed: totalClosed,
      cashCollected: totalCash,
      commissionEarned: totalComm,
      showRate: totalBooked > 0 ? (totalShowed / totalBooked) * 100 : 0,
      closeRate: totalShowed > 0 ? (totalClosed / totalShowed) * 100 : 0,
      bitebot: bbTotals,
      smilegen: sgTotals,
    };
  }).sort((a, b) => b.cashCollected - a.cashCollected);
}

// ============================================================================
// Get daily activity rows for reps view
// ============================================================================

export function getRepDailyActivity(
  rows: SalesRepDailyRow[],
  segment: Segment,
  viewMode: ViewMode,
  selectedPeriod: string,
  repName?: string
): SalesRepDaily[] {
  return rows.filter(row => {
    // Rep filter
    if (repName && repName !== 'all' && row.rep_name !== repName) return false;
    
    // Segment filter
    const prod = row.product?.toLowerCase().trim() || '';
    if (segment === 'bitebot' && prod !== 'bitebot') return false;
    if (segment === 'smilegen' && prod !== 'smilegen') return false;
    
    // Period filter
    const ws = typeof row.week_start === 'string' 
      ? row.week_start.split('T')[0] 
      : String(row.week_start);
    
    if (viewMode === 'weekly') return ws === selectedPeriod;
    if (viewMode === 'monthly') return (row.month || getMonthFromWeekStart(ws)) === selectedPeriod;
    if (viewMode === 'quarterly') return row.quarter === selectedPeriod;
    return false;
  }).map(row => ({
    date: typeof row.date === 'string' ? row.date.split('T')[0] : String(row.date),
    weekStart: typeof row.week_start === 'string' ? row.week_start.split('T')[0] : String(row.week_start),
    repName: row.rep_name || '',
    product: row.product || '',
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
  marketingRows: MarketingWeeklyRow[],
  salesRows: SalesWeeklyRow[],
  repDailyRows: SalesRepDailyRow[],
  segment: Segment
): { marketing: Record<string, TrendPoint[]>; sales: Record<string, TrendPoint[]> } {
  // Get unique weeks sorted desc
  const weekValues = marketingRows.map(r => {
    const ws = typeof r.week_start === 'string' ? r.week_start.split('T')[0] : String(r.week_start);
    return ws;
  });
  const weeks = Array.from(new Set(weekValues)).sort((a, b) => a.localeCompare(b)).slice(-6); // Last 6 weeks

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

  for (const week of weeks) {
    const mkt = aggregateMarketing(marketingRows, segment, 'weekly', week);
    const sls = aggregateSales(salesRows, repDailyRows, mkt.demosShowed, segment, 'weekly', week);
    
    const label = new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    marketing.adSpend.push({ period: week, label, value: mkt.adSpend });
    marketing.cpl.push({ period: week, label, value: mkt.cpl });
    marketing.leads.push({ period: week, label, value: mkt.fbAttributedLeads });
    marketing.demosBooked.push({ period: week, label, value: mkt.demosBooked });
    marketing.showRate.push({ period: week, label, value: mkt.showRate });
    
    sales.cashCollected.push({ period: week, label, value: sls.cashCollected });
    sales.closes.push({ period: week, label, value: sls.totalCloses });
    sales.closeRate.push({ period: week, label, value: sls.closeRateDemosShowed });
  }

  return { marketing, sales };
}
