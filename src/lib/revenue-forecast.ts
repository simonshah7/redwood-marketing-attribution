// ============================================================
// REVENUE FORECASTING WITH MARKETING ATTRIBUTION
// Marketing-informed forecast vs traditional stage-based forecast
// ============================================================

import type { EnrichedAccount } from './enriched-data';
import type { DealScore } from './deal-scoring';

export interface ForecastDeal {
  account_id: string;
  account_name: string;
  deal_amount: number;
  stage: string;
  product_line: string;
  deal_score: number;
  stage_probability: number;
  marketing_weighted_amount: number;
  stage_weighted_amount: number;
  forecast_category: 'commit' | 'best_case' | 'pipeline' | 'at_risk';
  risk_reason?: string;
}

export interface ForecastBucket {
  label: string;
  dealCount: number;
  pipeline: number;
  weightedPipeline: number;
}

export interface WeeklyProjection {
  week: string;
  weekLabel: string;
  cumulative_marketing: number;
  cumulative_stage: number;
}

export interface RevenueForecast {
  quarterLabel: string;

  // Marketing-informed
  marketingForecastTotal: number;
  marketingHighConfidence: number;
  marketingAtRisk: number;
  marketingBuckets: ForecastBucket[];

  // Stage-based
  stageForecastTotal: number;
  stageBuckets: ForecastBucket[];

  // Delta between methods
  forecastDelta: number;
  forecastDeltaPct: number;

  // Deal-level detail
  deals: ForecastDeal[];

  // Weekly projection
  weeklyProjection: WeeklyProjection[];
}

// ---- Stage-based probability (traditional) ----

const STAGE_PROBABILITIES: Record<string, number> = {
  disco_set: 0.10,
  disco_completed: 0.20,
  solution_accepted: 0.40,
  eval_planning: 0.60,
  negotiation: 0.80,
  closed_won: 1.0,
  closed_lost: 0.0,
};

// ---- Forecast Category ----

function determineForecastCategory(
  dealScore: number,
  stageProbability: number,
): { category: 'commit' | 'best_case' | 'pipeline' | 'at_risk'; risk?: string } {
  const avgProb = (dealScore / 100 + stageProbability) / 2;

  if (avgProb >= 0.70) return { category: 'commit' };
  if (avgProb >= 0.50) return { category: 'best_case' };
  if (avgProb >= 0.30) return { category: 'pipeline' };

  // Determine risk reason
  let risk = 'Low engagement score';
  if (dealScore < 30) risk = 'Very low deal score — missing key engagement signals';
  else if (stageProbability < 0.20) risk = 'Early stage with limited engagement';

  return { category: 'at_risk', risk };
}

// ---- Weekly Projection ----

function generateWeeklyProjection(
  deals: ForecastDeal[],
  referenceDate: string,
): WeeklyProjection[] {
  const projections: WeeklyProjection[] = [];
  const refDate = new Date(referenceDate);

  // Project 13 weeks (one quarter)
  let cumMarketing = 0;
  let cumStage = 0;

  // Distribute closes across weeks based on probability
  // Higher probability deals close sooner
  for (let week = 1; week <= 13; week++) {
    const weekDate = new Date(refDate.getTime() + week * 7 * 86400000);
    const weekLabel = `W${week}`;

    // Commit deals close early, pipeline deals close late
    for (const deal of deals) {
      const { forecast_category, marketing_weighted_amount, stage_weighted_amount } = deal;

      let weekFraction = 0;
      if (forecast_category === 'commit') {
        weekFraction = week <= 4 ? 0.25 : 0;
      } else if (forecast_category === 'best_case') {
        weekFraction = week >= 4 && week <= 8 ? 0.20 : 0;
      } else if (forecast_category === 'pipeline') {
        weekFraction = week >= 8 && week <= 12 ? 0.20 : 0;
      } else {
        weekFraction = week === 13 ? 0.5 : 0;
      }

      cumMarketing += marketing_weighted_amount * weekFraction;
      cumStage += stage_weighted_amount * weekFraction;
    }

    projections.push({
      week: weekDate.toISOString().split('T')[0],
      weekLabel,
      cumulative_marketing: Math.round(cumMarketing),
      cumulative_stage: Math.round(cumStage),
    });
  }

  return projections;
}

// ---- Main Forecast ----

export function generateForecast(
  accounts: EnrichedAccount[],
  dealScores: DealScore[],
  referenceDate: string = '2026-01-31',
): RevenueForecast {
  const scoreMap = new Map(dealScores.map(ds => [ds.account_id, ds]));

  const openAccounts = accounts.filter(a =>
    a.stage !== 'closed_won' && a.stage !== 'closed_lost'
  );

  const deals: ForecastDeal[] = openAccounts.map(account => {
    const score = scoreMap.get(account.account_id);
    const dealScore = score?.probability || 30;
    const stageProbability = STAGE_PROBABILITIES[account.stage] || 0.10;

    const marketingWeighted = Math.round(account.deal_amount * (dealScore / 100));
    const stageWeighted = Math.round(account.deal_amount * stageProbability);

    const { category, risk } = determineForecastCategory(dealScore, stageProbability);

    return {
      account_id: account.account_id,
      account_name: account.account_name,
      deal_amount: account.deal_amount,
      stage: account.stage,
      product_line: account.product_line,
      deal_score: dealScore,
      stage_probability: stageProbability,
      marketing_weighted_amount: marketingWeighted,
      stage_weighted_amount: stageWeighted,
      forecast_category: category,
      risk_reason: risk,
    };
  });

  // Buckets
  const categories: Array<'commit' | 'best_case' | 'pipeline' | 'at_risk'> = ['commit', 'best_case', 'pipeline', 'at_risk'];
  const categoryLabels: Record<string, string> = {
    commit: 'Commit',
    best_case: 'Best Case',
    pipeline: 'Pipeline',
    at_risk: 'At Risk',
  };

  const marketingBuckets: ForecastBucket[] = categories.map(cat => {
    const catDeals = deals.filter(d => d.forecast_category === cat);
    return {
      label: categoryLabels[cat],
      dealCount: catDeals.length,
      pipeline: catDeals.reduce((s, d) => s + d.deal_amount, 0),
      weightedPipeline: catDeals.reduce((s, d) => s + d.marketing_weighted_amount, 0),
    };
  });

  const stageBuckets: ForecastBucket[] = categories.map(cat => {
    const catDeals = deals.filter(d => d.forecast_category === cat);
    return {
      label: categoryLabels[cat],
      dealCount: catDeals.length,
      pipeline: catDeals.reduce((s, d) => s + d.deal_amount, 0),
      weightedPipeline: catDeals.reduce((s, d) => s + d.stage_weighted_amount, 0),
    };
  });

  const marketingTotal = deals.reduce((s, d) => s + d.marketing_weighted_amount, 0);
  const stageTotal = deals.reduce((s, d) => s + d.stage_weighted_amount, 0);
  const highConfidence = deals
    .filter(d => d.forecast_category === 'commit' || d.forecast_category === 'best_case')
    .reduce((s, d) => s + d.marketing_weighted_amount, 0);
  const atRisk = deals
    .filter(d => d.forecast_category === 'at_risk')
    .reduce((s, d) => s + d.marketing_weighted_amount, 0);

  const weeklyProjection = generateWeeklyProjection(deals, referenceDate);

  return {
    quarterLabel: 'Q1 2026',
    marketingForecastTotal: marketingTotal,
    marketingHighConfidence: highConfidence,
    marketingAtRisk: atRisk,
    marketingBuckets,
    stageForecastTotal: stageTotal,
    stageBuckets,
    forecastDelta: marketingTotal - stageTotal,
    forecastDeltaPct: stageTotal > 0 ? ((marketingTotal - stageTotal) / stageTotal) * 100 : 0,
    deals: deals.sort((a, b) => b.marketing_weighted_amount - a.marketing_weighted_amount),
    weeklyProjection,
  };
}
