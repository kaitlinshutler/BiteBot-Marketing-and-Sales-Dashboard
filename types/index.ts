// ============================================================================
// BiteBot Marketing & Sales Dashboard — Type Definitions
// ============================================================================

export type Segment = 'company' | 'bitebot' | 'smilegen';
export type ViewMode = 'weekly' | 'monthly' | 'quarterly';
export type DashboardView = 'overview' | 'marketing' | 'sales' | 'reps';

export interface PeriodOption {
  value: string;
  label: string;
}

export interface KPIData {
  id: string;
  label: string;
  value: number | null;
  format: 'currency' | 'integer' | 'percent' | 'decimal' | 'currency_whole';
  changePercent?: number | null;
  trendDirection?: 'up' | 'down'; // which direction is "good"
}

export interface MarketingMetrics {
  adSpend: number;
  impressions: number;
  cpm: number;
  linkClicks: number;
  cpc: number;
  totalLeads: number;
  fbAttributedLeads: number;
  cpl: number;
  demosBooked: number;
  demosShowed: number;
  showRate: number;
  costPerDemo: number;
  costPerShowedDemo: number;
  closes: number;
  costPerPurchase: number;
}

export interface SalesMetrics {
  totalCloses: number;
  cashCollected: number;
  avgDealValue: number;
  closeRateDemosShowed: number;
  closesFromDemos: number;
  closesFromAds: number;
  closesFromEmails: number;
  closesFromAffiliate: number;
  closesFromOther: number;
}

export interface AttributionRow {
  source: string;
  attributionType: 'First Touch' | 'Last Touch';
  count: number;
  percentage: number;
}

export interface SalesRepMetrics {
  repName: string;
  demosBooked: number;
  demosShowed: number;
  demosNoShowed: number;
  salesClosed: number;
  cashCollected: number;
  commissionEarned: number;
  showRate: number;
  closeRate: number;
  bitebot: {
    demosBooked: number;
    demosShowed: number;
    demosNoShowed: number;
    salesClosed: number;
    cashCollected: number;
    commissionEarned: number;
  };
  smilegen: {
    demosBooked: number;
    demosShowed: number;
    demosNoShowed: number;
    salesClosed: number;
    cashCollected: number;
    commissionEarned: number;
  };
}

export interface SalesRepDaily {
  date: string;
  weekStart: string;
  repName: string;
  product: string;
  demosBooked: number;
  demosShowed: number;
  demosNoShowed: number;
  salesClosed: number;
  cashCollected: number;
  commissionEarned: number;
  attributionSource: string;
}

export interface TrendPoint {
  period: string;
  label: string;
  value: number;
}

export interface FunnelStep {
  label: string;
  value: number;
  conversionRate?: number;
}

export interface ComparisonData {
  metricId: string;
  label: string;
  periodA: number | null;
  periodB: number | null;
  change: number | null;
  changePercent: number | null;
  format: 'currency' | 'integer' | 'percent' | 'decimal' | 'currency_whole';
  isPositiveGood: boolean;
}

export interface DashboardData {
  marketing: Record<Segment, MarketingMetrics>;
  sales: Record<Segment, SalesMetrics>;
  attribution: Record<Segment, AttributionRow[]>;
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
}

// Raw sheet row types
export interface MarketingWeeklyRow {
  week_start: string;
  week_end: string;
  month: string;
  quarter: string;
  campaign_type: string;
  campaigns: string;
  spend: number;
  impressions: number;
  cpm: number;
  link_clicks: number;
  cpc: number;
  fb_attributed_leads: number;
  cpl: number;
  demos_booked: number;
  demos_showed: number;
  show_rate: number;
  cost_per_demo: number;
  cost_per_showed: number;
  closes: number;
  cost_per_close: number;
}

export interface SalesWeeklyRow {
  week_start: string;
  week_end: string;
  month: string;
  quarter: string;
  segment: string;
  total_closes: number;
  from_demo: number;
  from_ads: number;
  from_email: number;
  from_affiliate: number;
  from_referral: number;
  from_organic: number;
  from_direct: number;
  from_other: number;
}

export interface AttributionWeeklyRow {
  week_start: string;
  segment: string;
  attribution_type: string;
  source: string;
  count: number;
  percentage: number;
}

export interface PaidSocialLeadsRow {
  date_added: string;
  email: string;
  name: string;
  contact_source: string;
  first_click_url: string;
  attribution_source: string;
  campaign: string;
  medium: string;
  ad_content: string;
  placement: string;
  segment: string;
}

export interface SalesRepDailyRow {
  date: string;
  week_start: string;
  month: string;
  quarter: string;
  rep_name: string;
  product: string;
  demos_booked: number;
  demos_showed: number;
  demos_no_showed: number;
  sales_closed: number;
  cash_collected: number;
  commission_earned: number;
  attribution_source: string;
}

export interface ConfigRow {
  setting_key: string;
  setting_value: string;
  description?: string;
}
