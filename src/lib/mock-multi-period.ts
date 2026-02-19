// ============================================================
// MULTI-PERIOD DATA ENGINE — 4 Monthly Snapshots
// Generates time-filtered views of the enriched data
// ============================================================

import type { EnrichedAccount, UnifiedTouchpoint, EnrichedChannel } from './enriched-data';
import { ENRICHED_DATA } from './mock-enriched-data';
import type { ReportingPeriod } from './period-context';
import { PERIODS, getPeriodMeta } from './period-context';

// ---- Types ----

export interface PeriodKPIs {
  totalPipeline: number;
  closedWonRevenue: number;
  closedWonCount: number;
  closedLostCount: number;
  winRate: number;
  openDeals: number;
  avgDealSize: number;
  avgTouchesPerDeal: number;
  totalTouchpoints: number;
  avgDaysToClose: number;
  channelMix: Record<string, number>;
}

export interface PeriodSnapshot {
  period: ReportingPeriod;
  cutoffDate: string;
  label: string;
  accounts: EnrichedAccount[];
  touchpoints: UnifiedTouchpoint[];
  kpis: PeriodKPIs;
}

export interface TrendPoint {
  period: string;
  label: string;
  value: number;
}

export interface TrendData {
  pipeline: TrendPoint[];
  closedWon: TrendPoint[];
  winRate: TrendPoint[];
  avgTouches: TrendPoint[];
  avgDealSize: TrendPoint[];
  avgDaysToClose: TrendPoint[];
  channelTrends: Record<string, TrendPoint[]>;
}

// ---- Stage progression for period-aware snapshots ----

const STAGE_ORDER = ['disco_set', 'disco_completed', 'solution_accepted', 'eval_planning', 'negotiation', 'closed_won', 'closed_lost'];

function getStageAtDate(account: EnrichedAccount, cutoffDate: string): string {
  // Walk through stage_history and find the last stage entered before cutoff
  let currentStage = account.stage_history[0]?.stage || 'disco_set';
  for (const entry of account.stage_history) {
    if (entry.entered_date <= cutoffDate) {
      currentStage = entry.stage;
    } else {
      break;
    }
  }
  return currentStage;
}

function filterTouchpointsToDate(touchpoints: UnifiedTouchpoint[], cutoffDate: string): UnifiedTouchpoint[] {
  return touchpoints.filter(tp => tp.date <= cutoffDate);
}

// Scale deal amounts progressively across periods for realistic growth
const DEAL_SCALE_FACTORS: Record<ReportingPeriod, number> = {
  'oct-2025': 0.82,
  'nov-2025': 0.89,
  'dec-2025': 0.95,
  'jan-2026': 1.0,
};

// Some accounts only appear in later periods (new pipeline)
const LATE_ACCOUNTS: Record<string, ReportingPeriod> = {
  'Schneider Electric': 'nov-2025',
  'Bayer AG': 'nov-2025',
  'General Mills': 'dec-2025',
  'Rio Tinto': 'dec-2025',
  'Daimler Truck': 'oct-2025',
  'Medtronic': 'nov-2025',
};

function isAccountVisibleInPeriod(accountName: string, period: ReportingPeriod): boolean {
  const firstAppears = LATE_ACCOUNTS[accountName];
  if (!firstAppears) return true; // Original accounts visible in all periods
  const periodOrder = PERIODS;
  return periodOrder.indexOf(period) >= periodOrder.indexOf(firstAppears);
}

// ---- Snapshot Generation ----

function generateSnapshot(period: ReportingPeriod): PeriodSnapshot {
  const meta = getPeriodMeta(period);
  const cutoff = meta.endDate;
  const scaleFactor = DEAL_SCALE_FACTORS[period];

  const accounts: EnrichedAccount[] = [];

  for (const acc of ENRICHED_DATA) {
    // Skip accounts not yet visible in this period
    if (!isAccountVisibleInPeriod(acc.account_name, period)) continue;

    // Skip accounts created after cutoff
    if (acc.created_date > cutoff) continue;

    const stageAtDate = getStageAtDate(acc, cutoff);
    const filteredTouchpoints = filterTouchpointsToDate(acc.touchpoints, cutoff);

    // Skip if no touchpoints yet
    if (filteredTouchpoints.length === 0 && stageAtDate === 'disco_set') continue;

    // For earlier periods, some closed deals are still open
    const isStillOpen = (acc.stage === 'closed_won' || acc.stage === 'closed_lost') &&
      stageAtDate !== 'closed_won' && stageAtDate !== 'closed_lost';

    accounts.push({
      ...acc,
      stage: stageAtDate,
      deal_amount: isStillOpen ? Math.round(acc.deal_amount * scaleFactor) : acc.deal_amount,
      touchpoints: filteredTouchpoints,
      stage_history: acc.stage_history.filter(sh => sh.entered_date <= cutoff),
    });
  }

  const touchpoints = accounts.flatMap(a => a.touchpoints);
  const kpis = computeKPIs(accounts, touchpoints);

  return {
    period,
    cutoffDate: cutoff,
    label: meta.label,
    accounts,
    touchpoints,
    kpis,
  };
}

function computeKPIs(accounts: EnrichedAccount[], touchpoints: UnifiedTouchpoint[]): PeriodKPIs {
  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');
  const openAccounts = accounts.filter(a => a.stage !== 'closed_won' && a.stage !== 'closed_lost');

  const closedTotal = wonAccounts.length + lostAccounts.length;
  const winRate = closedTotal > 0 ? wonAccounts.length / closedTotal : 0;
  const totalPipeline = openAccounts.reduce((sum, a) => sum + a.deal_amount, 0) +
    wonAccounts.reduce((sum, a) => sum + a.deal_amount, 0);

  const allDeals = accounts.filter(a => a.stage !== 'closed_lost');
  const avgDealSize = allDeals.length > 0
    ? allDeals.reduce((sum, a) => sum + a.deal_amount, 0) / allDeals.length
    : 0;

  const avgTouches = accounts.length > 0
    ? accounts.reduce((sum, a) => sum + a.touchpoints.length, 0) / accounts.length
    : 0;

  // Average days to close for won deals
  const daysToClose = wonAccounts.map(a => {
    const created = new Date(a.created_date).getTime();
    const closed = new Date(a.close_date).getTime();
    return (closed - created) / 86400000;
  });
  const avgDaysToClose = daysToClose.length > 0
    ? daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length
    : 0;

  // Channel mix
  const channelMix: Record<string, number> = {};
  for (const tp of touchpoints) {
    channelMix[tp.channel] = (channelMix[tp.channel] || 0) + 1;
  }

  return {
    totalPipeline,
    closedWonRevenue: wonAccounts.reduce((sum, a) => sum + a.deal_amount, 0),
    closedWonCount: wonAccounts.length,
    closedLostCount: lostAccounts.length,
    winRate,
    openDeals: openAccounts.length,
    avgDealSize: Math.round(avgDealSize),
    avgTouchesPerDeal: Math.round(avgTouches * 10) / 10,
    totalTouchpoints: touchpoints.length,
    avgDaysToClose: Math.round(avgDaysToClose),
    channelMix,
  };
}

// ---- Cached snapshots ----

const snapshotCache: Partial<Record<ReportingPeriod, PeriodSnapshot>> = {};

export function getSnapshot(period: ReportingPeriod): PeriodSnapshot {
  if (!snapshotCache[period]) {
    snapshotCache[period] = generateSnapshot(period);
  }
  return snapshotCache[period]!;
}

export function getAllSnapshots(): PeriodSnapshot[] {
  return PERIODS.map(getSnapshot);
}

// ---- Trend Computation ----

export function computeTrends(): TrendData {
  const snapshots = getAllSnapshots();

  const pipeline: TrendPoint[] = [];
  const closedWon: TrendPoint[] = [];
  const winRate: TrendPoint[] = [];
  const avgTouches: TrendPoint[] = [];
  const avgDealSize: TrendPoint[] = [];
  const avgDaysToClose: TrendPoint[] = [];
  const channelTrends: Record<string, TrendPoint[]> = {};

  for (const snap of snapshots) {
    const base = { period: snap.period, label: snap.label };
    pipeline.push({ ...base, value: snap.kpis.totalPipeline });
    closedWon.push({ ...base, value: snap.kpis.closedWonRevenue });
    winRate.push({ ...base, value: Math.round(snap.kpis.winRate * 1000) / 10 });
    avgTouches.push({ ...base, value: snap.kpis.avgTouchesPerDeal });
    avgDealSize.push({ ...base, value: snap.kpis.avgDealSize });
    avgDaysToClose.push({ ...base, value: snap.kpis.avgDaysToClose });

    // Channel trends
    const totalTp = snap.kpis.totalTouchpoints || 1;
    for (const [ch, count] of Object.entries(snap.kpis.channelMix)) {
      if (!channelTrends[ch]) channelTrends[ch] = [];
      channelTrends[ch].push({ ...base, value: Math.round((count / totalTp) * 1000) / 10 });
    }
  }

  return { pipeline, closedWon, winRate, avgTouches, avgDealSize, avgDaysToClose, channelTrends };
}

// ---- MoM Delta Helpers ----

export function getMoMDelta(current: ReportingPeriod): { kpis: PeriodKPIs; prevKpis: PeriodKPIs | null; deltas: Record<string, number | null> } {
  const currentSnap = getSnapshot(current);
  const idx = PERIODS.indexOf(current);
  const prevSnap = idx > 0 ? getSnapshot(PERIODS[idx - 1]) : null;

  const deltas: Record<string, number | null> = {};

  if (prevSnap) {
    const c = currentSnap.kpis;
    const p = prevSnap.kpis;
    deltas.pipeline = p.totalPipeline > 0 ? ((c.totalPipeline - p.totalPipeline) / p.totalPipeline) * 100 : null;
    deltas.closedWon = p.closedWonRevenue > 0 ? ((c.closedWonRevenue - p.closedWonRevenue) / p.closedWonRevenue) * 100 : null;
    deltas.winRate = c.winRate - p.winRate; // absolute delta
    deltas.avgDealSize = p.avgDealSize > 0 ? ((c.avgDealSize - p.avgDealSize) / p.avgDealSize) * 100 : null;
    deltas.avgTouches = c.avgTouchesPerDeal - p.avgTouchesPerDeal;
    deltas.openDeals = c.openDeals - p.openDeals;
  } else {
    deltas.pipeline = null;
    deltas.closedWon = null;
    deltas.winRate = null;
    deltas.avgDealSize = null;
    deltas.avgTouches = null;
    deltas.openDeals = null;
  }

  return { kpis: currentSnap.kpis, prevKpis: prevSnap?.kpis || null, deltas };
}
