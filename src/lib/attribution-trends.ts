// ============================================================
// ATTRIBUTION TREND ANALYSIS ENGINE
// Runs attribution models across multiple periods to track
// how channel credit shifts over time
// ============================================================

import { type Account, type Channel, CHANNEL_KEYS, DATA } from './data';
import {
  type AttributionModel,
  type AttributionResult,
  runAttribution,
} from './attribution';
import { type ReportingPeriod, PERIODS, getPeriodMeta } from './period-context';
import type { TrendPoint } from './mock-multi-period';

// ---- Types ----

export interface ChannelAttributionTrend {
  channel: Channel;
  /** Attributed pipeline per period */
  pipeline: TrendPoint[];
  /** Attributed pipeline share (%) per period */
  share: TrendPoint[];
  /** Attributed opps (fractional) per period */
  opps: TrendPoint[];
  /** Attributed revenue per period */
  revenue: TrendPoint[];
  /** MoM change in share (pp) from penultimate to last period */
  shareDeltaPp: number;
  /** MoM change in pipeline ($) from penultimate to last period */
  pipelineDelta: number;
  /** MoM change in pipeline (%) from penultimate to last period */
  pipelineDeltaPct: number;
  /** Overall momentum: 'rising' | 'stable' | 'declining' */
  momentum: 'rising' | 'stable' | 'declining';
}

export interface PeriodAttribution {
  period: ReportingPeriod;
  label: string;
  results: Record<Channel, AttributionResult>;
  totalPipeline: number;
  totalRevenue: number;
  totalOpps: number;
}

export interface ModelDivergence {
  channel: Channel;
  /** Spread between highest and lowest model share for latest period */
  spreadPp: number;
  /** Which model gives this channel the most credit */
  highestModel: AttributionModel;
  /** Which model gives this channel the least credit */
  lowestModel: AttributionModel;
  highestSharePct: number;
  lowestSharePct: number;
}

export interface AttributionTrendInsight {
  severity: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
}

// ---- Period-Filtered Data ----

function getAccountsForPeriod(period: ReportingPeriod): Account[] {
  const meta = getPeriodMeta(period);
  const cutoff = meta.endDate;

  return DATA.map(account => {
    const filteredTouches = account.touches.filter(t => t.date <= cutoff);
    if (filteredTouches.length === 0) return null;
    return {
      ...account,
      touches: filteredTouches,
    };
  }).filter((a): a is Account => a !== null);
}

// ---- Core Computation ----

const attributionCache: Partial<Record<string, PeriodAttribution>> = {};

export function getAttributionForPeriod(
  model: AttributionModel,
  period: ReportingPeriod,
): PeriodAttribution {
  const key = `${model}:${period}`;
  if (attributionCache[key]) return attributionCache[key]!;

  const accounts = getAccountsForPeriod(period);
  const results = runAttribution(model, accounts);
  const meta = getPeriodMeta(period);

  const totalPipeline = CHANNEL_KEYS.reduce((s, ch) => s + results[ch].pipeline, 0);
  const totalRevenue = CHANNEL_KEYS.reduce((s, ch) => s + results[ch].revenue, 0);
  const totalOpps = CHANNEL_KEYS.reduce((s, ch) => s + results[ch].opps, 0);

  const result: PeriodAttribution = {
    period,
    label: meta.label,
    results,
    totalPipeline,
    totalRevenue,
    totalOpps,
  };

  attributionCache[key] = result;
  return result;
}

export function getAllPeriodAttributions(model: AttributionModel): PeriodAttribution[] {
  return PERIODS.map(p => getAttributionForPeriod(model, p));
}

// ---- Channel Trend Computation ----

export function computeChannelAttributionTrends(model: AttributionModel): ChannelAttributionTrend[] {
  const periodData = getAllPeriodAttributions(model);

  return CHANNEL_KEYS.map(ch => {
    const pipeline: TrendPoint[] = [];
    const share: TrendPoint[] = [];
    const opps: TrendPoint[] = [];
    const revenue: TrendPoint[] = [];

    for (const pd of periodData) {
      const base = { period: pd.period, label: pd.label };
      pipeline.push({ ...base, value: pd.results[ch].pipeline });
      share.push({
        ...base,
        value: pd.totalPipeline > 0
          ? Math.round((pd.results[ch].pipeline / pd.totalPipeline) * 1000) / 10
          : 0,
      });
      opps.push({ ...base, value: Math.round(pd.results[ch].opps * 10) / 10 });
      revenue.push({ ...base, value: pd.results[ch].revenue });
    }

    // MoM deltas (last two periods)
    const lastShare = share[share.length - 1]?.value ?? 0;
    const prevShare = share.length >= 2 ? share[share.length - 2].value : lastShare;
    const shareDeltaPp = Math.round((lastShare - prevShare) * 10) / 10;

    const lastPipeline = pipeline[pipeline.length - 1]?.value ?? 0;
    const prevPipeline = pipeline.length >= 2 ? pipeline[pipeline.length - 2].value : lastPipeline;
    const pipelineDelta = lastPipeline - prevPipeline;
    const pipelineDeltaPct = prevPipeline > 0
      ? Math.round(((lastPipeline - prevPipeline) / prevPipeline) * 1000) / 10
      : 0;

    // Momentum: look at overall direction across all periods
    let momentum: 'rising' | 'stable' | 'declining' = 'stable';
    if (share.length >= 3) {
      const firstShare = share[0].value;
      const midShare = share[Math.floor(share.length / 2)].value;
      const trend1 = midShare - firstShare;
      const trend2 = lastShare - midShare;
      // Rising if both halves go up or net positive > 1pp
      if (trend1 + trend2 > 1.5) momentum = 'rising';
      else if (trend1 + trend2 < -1.5) momentum = 'declining';
    } else if (share.length >= 2) {
      if (shareDeltaPp > 1) momentum = 'rising';
      else if (shareDeltaPp < -1) momentum = 'declining';
    }

    return {
      channel: ch,
      pipeline,
      share,
      opps,
      revenue,
      shareDeltaPp,
      pipelineDelta,
      pipelineDeltaPct,
      momentum,
    };
  });
}

// ---- Model Divergence Analysis ----

const ALL_MODELS: AttributionModel[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];

const MODEL_LABELS: Record<AttributionModel, string> = {
  first_touch: 'First Touch',
  last_touch: 'Last Touch',
  linear: 'Linear',
  time_decay: 'Time-Decay',
  position_based: 'Position-Based',
};

export function computeModelDivergence(period: ReportingPeriod): ModelDivergence[] {
  const modelResults = ALL_MODELS.map(m => ({
    model: m,
    data: getAttributionForPeriod(m, period),
  }));

  return CHANNEL_KEYS.map(ch => {
    let highestModel: AttributionModel = 'linear';
    let lowestModel: AttributionModel = 'linear';
    let highestShare = -Infinity;
    let lowestShare = Infinity;

    for (const mr of modelResults) {
      const share = mr.data.totalPipeline > 0
        ? (mr.data.results[ch].pipeline / mr.data.totalPipeline) * 100
        : 0;

      if (share > highestShare) {
        highestShare = share;
        highestModel = mr.model;
      }
      if (share < lowestShare) {
        lowestShare = share;
        lowestModel = mr.model;
      }
    }

    return {
      channel: ch,
      spreadPp: Math.round((highestShare - lowestShare) * 10) / 10,
      highestModel,
      lowestModel,
      highestSharePct: Math.round(highestShare * 10) / 10,
      lowestSharePct: Math.round(lowestShare * 10) / 10,
    };
  });
}

// ---- Model Stability Over Time ----

export interface ModelStabilityPoint {
  period: string;
  label: string;
  /** Average spread (pp) across all channels for this period */
  avgSpread: number;
  /** Max spread across channels for this period */
  maxSpread: number;
}

export function computeModelStability(): ModelStabilityPoint[] {
  return PERIODS.map(p => {
    const divergences = computeModelDivergence(p);
    const meta = getPeriodMeta(p);
    const avgSpread = divergences.reduce((s, d) => s + d.spreadPp, 0) / divergences.length;
    const maxSpread = Math.max(...divergences.map(d => d.spreadPp));
    return {
      period: p,
      label: meta.label,
      avgSpread: Math.round(avgSpread * 10) / 10,
      maxSpread: Math.round(maxSpread * 10) / 10,
    };
  });
}

// ---- Automated Trend Insights ----

export function generateTrendInsights(model: AttributionModel): AttributionTrendInsight[] {
  const trends = computeChannelAttributionTrends(model);
  const latestPeriod = PERIODS[PERIODS.length - 1];
  const divergences = computeModelDivergence(latestPeriod);
  const insights: AttributionTrendInsight[] = [];

  // Find biggest riser and decliner
  const sorted = [...trends].sort((a, b) => b.shareDeltaPp - a.shareDeltaPp);
  const topRiser = sorted[0];
  const topDecliner = sorted[sorted.length - 1];

  const channelNames: Record<Channel, string> = {
    linkedin: 'LinkedIn Ads',
    email: 'Marketo Email',
    form: 'Form Submissions',
    events: 'Events & Webinars',
  };

  // Rising channel insight
  if (topRiser && topRiser.shareDeltaPp > 0.5) {
    const currentShare = topRiser.share[topRiser.share.length - 1]?.value ?? 0;
    insights.push({
      severity: 'info',
      title: `${channelNames[topRiser.channel]} gaining attribution share`,
      description: `${channelNames[topRiser.channel]} rose +${topRiser.shareDeltaPp.toFixed(1)}pp MoM to ${currentShare.toFixed(1)}% of attributed pipeline. ${topRiser.momentum === 'rising' ? 'This is a sustained multi-month trend.' : 'Watch whether this holds next month.'}`,
    });
  }

  // Declining channel insight
  if (topDecliner && topDecliner.shareDeltaPp < -0.5) {
    const currentShare = topDecliner.share[topDecliner.share.length - 1]?.value ?? 0;
    insights.push({
      severity: topDecliner.momentum === 'declining' ? 'danger' : 'warning',
      title: `${channelNames[topDecliner.channel]} losing attribution share`,
      description: `${channelNames[topDecliner.channel]} dropped ${topDecliner.shareDeltaPp.toFixed(1)}pp MoM to ${currentShare.toFixed(1)}% of attributed pipeline. ${topDecliner.momentum === 'declining' ? 'This is a sustained decline — consider investigating root cause.' : 'This may be a one-month fluctuation.'}`,
    });
  }

  // Model divergence insight
  const highDivergence = divergences.filter(d => d.spreadPp > 15);
  if (highDivergence.length > 0) {
    const worst = highDivergence.sort((a, b) => b.spreadPp - a.spreadPp)[0];
    insights.push({
      severity: 'warning',
      title: `High model disagreement on ${channelNames[worst.channel]}`,
      description: `Attribution models diverge by ${worst.spreadPp.toFixed(1)}pp for ${channelNames[worst.channel]} — ${MODEL_LABELS[worst.highestModel]} credits ${worst.highestSharePct.toFixed(1)}% while ${MODEL_LABELS[worst.lowestModel]} credits only ${worst.lowestSharePct.toFixed(1)}%. Consider which model best reflects your go-to-market motion.`,
    });
  }

  // Pipeline growth insight
  const totalPipelineTrend = trends.reduce((acc, t) => {
    t.pipeline.forEach((p, i) => {
      acc[i] = (acc[i] || 0) + p.value;
    });
    return acc;
  }, [] as number[]);

  if (totalPipelineTrend.length >= 2) {
    const lastTotal = totalPipelineTrend[totalPipelineTrend.length - 1];
    const prevTotal = totalPipelineTrend[totalPipelineTrend.length - 2];
    const growthPct = prevTotal > 0 ? ((lastTotal - prevTotal) / prevTotal) * 100 : 0;
    if (Math.abs(growthPct) > 5) {
      insights.push({
        severity: growthPct > 0 ? 'info' : 'danger',
        title: `Total attributed pipeline ${growthPct > 0 ? 'grew' : 'declined'} ${Math.abs(growthPct).toFixed(1)}% MoM`,
        description: growthPct > 0
          ? `Total pipeline under ${MODEL_LABELS[model]} attribution increased, driven primarily by ${channelNames[topRiser?.channel ?? 'linkedin']}. The marketing engine is scaling.`
          : `Total attributed pipeline contracted month-over-month. Review channel investments and campaign performance to identify what changed.`,
      });
    }
  }

  return insights;
}
