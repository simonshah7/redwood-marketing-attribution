// ============================================================
// COHORT ANALYSIS ENGINE — Marketing Attribution Dashboard
// ============================================================

import { DATA, CHANNEL_KEYS, STAGES } from './data';
import type { Account, Channel } from './data';

// ---------------------------------------------------------------------------
// Stage ordering helpers
// ---------------------------------------------------------------------------

const STAGE_ORDER: string[] = [
  'disco_set',
  'disco_completed',
  'solution_accepted',
  'eval_planning',
  'negotiation',
  'closed_won',
  'closed_lost',
];

/**
 * Returns the ordinal index of a stage in the pipeline.
 * closed_lost is treated as a terminal branch and gets index -1 so it
 * never counts as "having reached" a later stage.
 */
function stageIndex(stage: string): number {
  if (stage === 'closed_lost') return -1;
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? -1 : idx;
}

/**
 * An account "reached" a stage if its current stage is that stage or any
 * stage later in the pipeline (excluding closed_lost which is terminal).
 */
function accountReachedStage(account: Account, targetStage: string): boolean {
  if (targetStage === 'closed_lost') {
    return account.stage === 'closed_lost';
  }
  const currentIdx = stageIndex(account.stage);
  const targetIdx = stageIndex(targetStage);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return currentIdx >= targetIdx;
}

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface CohortRow {
  label: string;
  accountCount: number;
  pipeline: number;
  revenue: number;
  winRate: number;
  avgTouches: number;
  avgDealSize: number;
  avgVelocityDays: number;
}

export interface TimeCohort extends CohortRow {
  month: string; // YYYY-MM
  stageConversion: Record<string, number>; // stage key -> % of cohort that reached it
}

export interface ChannelCohort extends CohortRow {
  channel: Channel;
  subsequentChannelMix: Record<Channel, number>; // % of subsequent touches from each channel
}

export interface DensityCohort extends CohortRow {
  bucket: string;
  channelMix: Record<Channel, number>; // % of touches from each channel
}

export interface IndustryCohort extends CohortRow {
  industry: string;
  topFirstTouchChannel: Channel;
}

export interface CohortAnalysis {
  timeCohorts: TimeCohort[];
  channelCohorts: ChannelCohort[];
  densityCohorts: DensityCohort[];
  industryCohorts: IndustryCohort[];
}

// ---------------------------------------------------------------------------
// Shared metric helpers
// ---------------------------------------------------------------------------

function computePipeline(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.deal, 0);
}

function computeRevenue(accounts: Account[]): number {
  return accounts
    .filter((a) => a.stage === 'closed_won')
    .reduce((sum, a) => sum + a.deal, 0);
}

function computeWinRate(accounts: Account[]): number {
  if (accounts.length === 0) return 0;
  const closed = accounts.filter(
    (a) => a.stage === 'closed_won' || a.stage === 'closed_lost',
  );
  if (closed.length === 0) return 0;
  const won = closed.filter((a) => a.stage === 'closed_won').length;
  return won / closed.length;
}

function computeAvgTouches(accounts: Account[]): number {
  if (accounts.length === 0) return 0;
  const total = accounts.reduce((sum, a) => sum + a.touches.length, 0);
  return total / accounts.length;
}

function computeAvgDealSize(accounts: Account[]): number {
  if (accounts.length === 0) return 0;
  return computePipeline(accounts) / accounts.length;
}

/**
 * Average velocity in days from first touch to last touch per account.
 * If an account has only one touch the velocity is 0.
 */
function computeAvgVelocityDays(accounts: Account[]): number {
  if (accounts.length === 0) return 0;
  let totalDays = 0;
  let counted = 0;
  for (const a of accounts) {
    if (a.touches.length < 2) continue;
    const sorted = [...a.touches].sort((x, y) => x.date.localeCompare(y.date));
    const first = new Date(sorted[0].date);
    const last = new Date(sorted[sorted.length - 1].date);
    const diffMs = last.getTime() - first.getTime();
    totalDays += diffMs / (1000 * 60 * 60 * 24);
    counted++;
  }
  return counted === 0 ? 0 : totalDays / counted;
}

function baseCohortRow(label: string, accounts: Account[]): CohortRow {
  return {
    label,
    accountCount: accounts.length,
    pipeline: computePipeline(accounts),
    revenue: computeRevenue(accounts),
    winRate: computeWinRate(accounts),
    avgTouches: computeAvgTouches(accounts),
    avgDealSize: computeAvgDealSize(accounts),
    avgVelocityDays: computeAvgVelocityDays(accounts),
  };
}

// ---------------------------------------------------------------------------
// 1. Time-based cohorts
// ---------------------------------------------------------------------------

function buildTimeCohorts(data: Account[]): TimeCohort[] {
  // Group accounts by month of first touchpoint
  const groups = new Map<string, Account[]>();

  for (const account of data) {
    if (account.touches.length === 0) continue;
    const sorted = [...account.touches].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const firstDate = sorted[0].date; // YYYY-MM-DD
    const month = firstDate.substring(0, 7); // YYYY-MM
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month)!.push(account);
  }

  // Non-terminal stages for conversion tracking (exclude closed_lost)
  const conversionStages = STAGE_ORDER.filter((s) => s !== 'closed_lost');

  const cohorts: TimeCohort[] = [];

  // Sort months chronologically
  const sortedMonths = Array.from(groups.keys()).sort();

  for (const month of sortedMonths) {
    const accounts = groups.get(month)!;
    const base = baseCohortRow(month, accounts);

    // Stage conversion: what % of cohort reached each stage
    const stageConversion: Record<string, number> = {};
    for (const stage of conversionStages) {
      const reached = accounts.filter((a) => accountReachedStage(a, stage));
      stageConversion[stage] = accounts.length > 0 ? reached.length / accounts.length : 0;
    }

    cohorts.push({
      ...base,
      month,
      stageConversion,
    });
  }

  return cohorts;
}

// ---------------------------------------------------------------------------
// 2. Channel-of-origin cohorts
// ---------------------------------------------------------------------------

function buildChannelCohorts(data: Account[]): ChannelCohort[] {
  const groups = new Map<Channel, Account[]>();

  for (const ch of CHANNEL_KEYS) {
    groups.set(ch, []);
  }

  for (const account of data) {
    if (account.touches.length === 0) continue;
    const sorted = [...account.touches].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const firstChannel = sorted[0].channel;
    groups.get(firstChannel)!.push(account);
  }

  const cohorts: ChannelCohort[] = [];

  for (const channel of CHANNEL_KEYS) {
    const accounts = groups.get(channel)!;
    if (accounts.length === 0) continue;

    const base = baseCohortRow(channel, accounts);

    // Subsequent channel mix: touches after the first touch
    const subsequentCounts: Record<Channel, number> = {
      linkedin: 0,
      email: 0,
      form: 0,
      events: 0,
    };
    let totalSubsequent = 0;

    for (const account of accounts) {
      const sorted = [...account.touches].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      // Skip the first touch
      for (let i = 1; i < sorted.length; i++) {
        subsequentCounts[sorted[i].channel]++;
        totalSubsequent++;
      }
    }

    const subsequentChannelMix: Record<Channel, number> = {
      linkedin: 0,
      email: 0,
      form: 0,
      events: 0,
    };
    if (totalSubsequent > 0) {
      for (const ch of CHANNEL_KEYS) {
        subsequentChannelMix[ch] = subsequentCounts[ch] / totalSubsequent;
      }
    }

    cohorts.push({
      ...base,
      channel,
      subsequentChannelMix,
    });
  }

  return cohorts;
}

// ---------------------------------------------------------------------------
// 3. Touchpoint-density cohorts
// ---------------------------------------------------------------------------

const DENSITY_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '1-3', min: 1, max: 3 },
  { label: '4-6', min: 4, max: 6 },
  { label: '7-9', min: 7, max: 9 },
  { label: '10+', min: 10, max: Infinity },
];

function getDensityBucket(touchCount: number): string {
  for (const b of DENSITY_BUCKETS) {
    if (touchCount >= b.min && touchCount <= b.max) return b.label;
  }
  return '10+';
}

function buildDensityCohorts(data: Account[]): DensityCohort[] {
  const groups = new Map<string, Account[]>();
  for (const b of DENSITY_BUCKETS) {
    groups.set(b.label, []);
  }

  for (const account of data) {
    const bucket = getDensityBucket(account.touches.length);
    groups.get(bucket)!.push(account);
  }

  const cohorts: DensityCohort[] = [];

  for (const b of DENSITY_BUCKETS) {
    const accounts = groups.get(b.label)!;
    if (accounts.length === 0) continue;

    const base = baseCohortRow(b.label, accounts);

    // Channel distribution across all touches in this bucket
    const channelCounts: Record<Channel, number> = {
      linkedin: 0,
      email: 0,
      form: 0,
      events: 0,
    };
    let totalTouches = 0;

    for (const account of accounts) {
      for (const touch of account.touches) {
        channelCounts[touch.channel]++;
        totalTouches++;
      }
    }

    const channelMix: Record<Channel, number> = {
      linkedin: 0,
      email: 0,
      form: 0,
      events: 0,
    };
    if (totalTouches > 0) {
      for (const ch of CHANNEL_KEYS) {
        channelMix[ch] = channelCounts[ch] / totalTouches;
      }
    }

    cohorts.push({
      ...base,
      bucket: b.label,
      channelMix,
    });
  }

  return cohorts;
}

// ---------------------------------------------------------------------------
// 4. Industry cohorts
// ---------------------------------------------------------------------------

function buildIndustryCohorts(data: Account[]): IndustryCohort[] {
  const groups = new Map<string, Account[]>();

  for (const account of data) {
    const industry = account.industry;
    if (!groups.has(industry)) groups.set(industry, []);
    groups.get(industry)!.push(account);
  }

  const cohorts: IndustryCohort[] = [];

  // Sort industries alphabetically for consistent ordering
  const sortedIndustries = Array.from(groups.keys()).sort();

  for (const industry of sortedIndustries) {
    const accounts = groups.get(industry)!;
    const base = baseCohortRow(industry, accounts);

    // Top channel by first touch
    const firstTouchCounts: Record<Channel, number> = {
      linkedin: 0,
      email: 0,
      form: 0,
      events: 0,
    };

    for (const account of accounts) {
      if (account.touches.length === 0) continue;
      const sorted = [...account.touches].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      firstTouchCounts[sorted[0].channel]++;
    }

    let topChannel: Channel = 'linkedin';
    let topCount = 0;
    for (const ch of CHANNEL_KEYS) {
      if (firstTouchCounts[ch] > topCount) {
        topCount = firstTouchCounts[ch];
        topChannel = ch;
      }
    }

    cohorts.push({
      ...base,
      industry,
      topFirstTouchChannel: topChannel,
    });
  }

  return cohorts;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function analyzeCohorts(data: Account[]): CohortAnalysis {
  return {
    timeCohorts: buildTimeCohorts(data),
    channelCohorts: buildChannelCohorts(data),
    densityCohorts: buildDensityCohorts(data),
    industryCohorts: buildIndustryCohorts(data),
  };
}
