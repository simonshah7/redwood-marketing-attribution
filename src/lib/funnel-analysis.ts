// ============================================================
// FUNNEL ANALYSIS — Stage-to-Stage Conversion Rate Analysis
// RunMyJobs Marketing Attribution Dashboard
// ============================================================

import type { Account } from './data';
import { STAGES } from './data';
import type { EnrichedAccount, StageHistoryEntry } from './enriched-data';

// ---- Interfaces ----

export interface StageMetrics {
  stage: string;
  stageName: string;
  accountCount: number;
  pipeline: number;
  conversionToNext: number; // % that progressed to next stage (0-1)
  dropoffRate: number;      // 1 - conversionToNext
  avgDealSize: number;
  wonDealsAtOrPast: number; // count of won deals that passed through this stage
  lostDealsAtOrPast: number;
}

export interface VelocityByStage {
  stage: string;
  stageName: string;
  wonAvgDays: number;
  lostAvgDays: number;
  openAvgDays: number;
  allAvgDays: number;
}

export interface FunnelAnalysis {
  stageMetrics: StageMetrics[];
  velocityByStage: VelocityByStage[];
  overallConversionRate: number; // % from disco_set to closed_won
  avgTouchesWon: number;
  avgTouchesLost: number;
  topDropoffStage: string;
  bottleneckStage: string; // stage with highest avg days
}

// ---- Constants ----

/** Ordered pipeline stages (excluding closed_lost, which is terminal from any stage). */
const PIPELINE_STAGES = [
  'disco_set',
  'disco_completed',
  'solution_accepted',
  'eval_planning',
  'negotiation',
  'closed_won',
];

/**
 * Returns the index of a stage in the pipeline order.
 * closed_lost is terminal and not in the pipeline order itself,
 * so we return -1 for it.
 */
function pipelineIndex(stage: string): number {
  return PIPELINE_STAGES.indexOf(stage);
}

/**
 * Look up the human-readable name for a stage key from STAGES.
 */
function stageName(stageKey: string): string {
  const found = STAGES.find(s => s.key === stageKey);
  return found ? found.name : stageKey;
}

/**
 * Determine whether an account has "reached or passed" a given pipeline stage.
 *
 * An account reached a stage if:
 *  - Its current stage is that stage, or a later stage in the pipeline, OR
 *  - Its current stage is closed_lost (terminal) and the stage is at or before
 *    the point it exited. Because we don't have exit-stage info on the base
 *    Account type, we infer: closed_lost accounts are modeled as having reached
 *    at least disco_set (the entry point). For richer inference we look at the
 *    closed_lost account's position. Since closed_lost can happen from any stage,
 *    we conservatively count closed_lost accounts as having reached disco_set only
 *    unless we have stage_history (enriched). However, in the base Account model
 *    we have no stage_history, so for closed_lost accounts we count them as
 *    reaching disco_set (the entry). This is the most conservative correct approach.
 *
 *    BUT — a more useful heuristic: we know from the mock data that closed_lost
 *    can happen from any stage. Without stage_history, we count closed_lost as
 *    having reached disco_set (index 0) only, which is always true since every
 *    deal enters the funnel at disco_set.
 */
function accountReachedStage(account: Account, targetStageKey: string): boolean {
  const targetIdx = pipelineIndex(targetStageKey);
  if (targetIdx === -1) return false; // invalid target

  if (account.stage === 'closed_lost') {
    // closed_lost accounts definitely entered at disco_set.
    // Without stage_history, we only know they reached the entry stage.
    // Return true only for disco_set (index 0).
    return targetIdx === 0;
  }

  const accountIdx = pipelineIndex(account.stage);
  if (accountIdx === -1) return false;

  return accountIdx >= targetIdx;
}

/**
 * For enriched accounts (which have stage_history), we can do a much better job
 * determining which stages they actually passed through.
 */
function enrichedAccountReachedStage(account: EnrichedAccount, targetStageKey: string): boolean {
  const targetIdx = pipelineIndex(targetStageKey);
  if (targetIdx === -1) return false;

  // Check stage_history for an explicit record of having been in this stage
  if (account.stage_history.some(sh => sh.stage === targetStageKey)) {
    return true;
  }

  // Fallback: if current stage is at or past target in the pipeline
  if (account.stage === 'closed_lost') {
    // Check the stage_history to find the furthest pipeline stage reached
    let maxIdx = -1;
    for (const sh of account.stage_history) {
      const idx = pipelineIndex(sh.stage);
      if (idx > maxIdx) maxIdx = idx;
    }
    return targetIdx <= maxIdx;
  }

  const accountIdx = pipelineIndex(account.stage);
  return accountIdx >= targetIdx;
}

// ---- Main Analysis Functions ----

/**
 * Analyze the funnel using base Account data.
 * Computes stage metrics, conversion rates, drop-off, and touch analysis.
 */
export function analyzeFunnel(accounts: Account[]): FunnelAnalysis {
  // -- Stage Metrics --
  const stageMetrics: StageMetrics[] = [];

  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stageKey = PIPELINE_STAGES[i];

    // Accounts that reached or passed this stage
    const reachedAccounts = accounts.filter(a => accountReachedStage(a, stageKey));
    const accountCount = reachedAccounts.length;
    const pipeline = reachedAccounts.reduce((sum, a) => sum + a.deal, 0);
    const avgDealSize = accountCount > 0 ? pipeline / accountCount : 0;

    // Conversion to next stage
    let conversionToNext = 0;
    if (i < PIPELINE_STAGES.length - 1 && accountCount > 0) {
      const nextStageKey = PIPELINE_STAGES[i + 1];
      const reachedNext = accounts.filter(a => accountReachedStage(a, nextStageKey));
      conversionToNext = reachedNext.length / accountCount;
    } else if (i === PIPELINE_STAGES.length - 1) {
      // closed_won is the final stage; conversion is 1.0 (they made it)
      conversionToNext = 1;
    }
    const dropoffRate = 1 - conversionToNext;

    // Won deals that passed through this stage
    const wonDeals = accounts.filter(a => a.stage === 'closed_won');
    const wonDealsAtOrPast = wonDeals.filter(a => accountReachedStage(a, stageKey)).length;

    // Lost deals that reached this stage
    const lostDeals = accounts.filter(a => a.stage === 'closed_lost');
    const lostDealsAtOrPast = lostDeals.filter(a => accountReachedStage(a, stageKey)).length;

    stageMetrics.push({
      stage: stageKey,
      stageName: stageName(stageKey),
      accountCount,
      pipeline,
      conversionToNext,
      dropoffRate,
      avgDealSize,
      wonDealsAtOrPast,
      lostDealsAtOrPast,
    });
  }

  // -- Overall Conversion Rate (disco_set -> closed_won) --
  const discoSetCount = stageMetrics.find(m => m.stage === 'disco_set')?.accountCount ?? 0;
  const closedWonCount = stageMetrics.find(m => m.stage === 'closed_won')?.accountCount ?? 0;
  const overallConversionRate = discoSetCount > 0 ? closedWonCount / discoSetCount : 0;

  // -- Average Touches for Won vs Lost --
  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');

  const avgTouchesWon = wonAccounts.length > 0
    ? wonAccounts.reduce((sum, a) => sum + a.touches.length, 0) / wonAccounts.length
    : 0;

  const avgTouchesLost = lostAccounts.length > 0
    ? lostAccounts.reduce((sum, a) => sum + a.touches.length, 0) / lostAccounts.length
    : 0;

  // -- Top Drop-off Stage (highest dropoffRate among non-terminal stages) --
  const nonTerminalMetrics = stageMetrics.filter(
    m => m.stage !== 'closed_won'
  );
  const topDropoffStage = nonTerminalMetrics.length > 0
    ? nonTerminalMetrics.reduce((max, m) => m.dropoffRate > max.dropoffRate ? m : max).stage
    : '';

  // -- Velocity (placeholder from enriched data; will be populated if enriched accounts provided) --
  // For the base analyzeFunnel, we use empty velocity since we lack stage_history.
  const velocityByStage: VelocityByStage[] = PIPELINE_STAGES.filter(s => s !== 'closed_won').map(stageKey => ({
    stage: stageKey,
    stageName: stageName(stageKey),
    wonAvgDays: 0,
    lostAvgDays: 0,
    openAvgDays: 0,
    allAvgDays: 0,
  }));

  // -- Bottleneck Stage (highest avg days; from velocity data) --
  // With no velocity data from base accounts, we fall back to top drop-off.
  const bottleneckStage = topDropoffStage;

  return {
    stageMetrics,
    velocityByStage,
    overallConversionRate,
    avgTouchesWon,
    avgTouchesLost,
    topDropoffStage,
    bottleneckStage,
  };
}

/**
 * Analyze velocity (average days in each stage) using enriched accounts
 * that have stage_history with days_in_stage.
 */
export function analyzeVelocity(accounts: EnrichedAccount[]): VelocityByStage[] {
  // We analyze velocity for each pipeline stage except closed_won
  // (closed_won has days_in_stage = 0 since it's the terminal win state).
  const activeStages = PIPELINE_STAGES.filter(s => s !== 'closed_won');

  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');
  const openAccounts = accounts.filter(
    a => a.stage !== 'closed_won' && a.stage !== 'closed_lost'
  );

  return activeStages.map(stageKey => {
    // Collect days_in_stage for this stage from each outcome category
    const wonDays = collectDaysForStage(wonAccounts, stageKey);
    const lostDays = collectDaysForStage(lostAccounts, stageKey);
    const openDays = collectDaysForStage(openAccounts, stageKey);
    const allDays = [...wonDays, ...lostDays, ...openDays];

    return {
      stage: stageKey,
      stageName: stageName(stageKey),
      wonAvgDays: average(wonDays),
      lostAvgDays: average(lostDays),
      openAvgDays: average(openDays),
      allAvgDays: average(allDays),
    };
  });
}

// ---- Helpers ----

/**
 * From a list of enriched accounts, collect all days_in_stage values
 * for a given stage key (from their stage_history).
 */
function collectDaysForStage(
  accounts: EnrichedAccount[],
  stageKey: string,
): number[] {
  const days: number[] = [];
  for (const account of accounts) {
    for (const entry of account.stage_history) {
      if (entry.stage === stageKey && entry.days_in_stage > 0) {
        days.push(entry.days_in_stage);
      }
    }
  }
  return days;
}

/**
 * Compute the arithmetic mean of an array of numbers.
 * Returns 0 if the array is empty.
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
