import type { ActionCardProps } from "@/components/cards/action-card";
import type { AttributionResult } from "@/lib/attribution";
import type { Channel } from "@/lib/data";
import { fmtCurrency, fmtPct } from "@/lib/format";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function topChannel(
  attr: Record<Channel, AttributionResult>,
  keys: Channel[],
  field: "pipeline" | "revenue" | "opps"
): { ch: Channel; value: number } {
  let best: Channel = keys[0];
  for (const ch of keys) {
    if (attr[ch][field] > attr[best][field]) best = ch;
  }
  return { ch: best, value: attr[best][field] };
}

function bottomChannel(
  attr: Record<Channel, AttributionResult>,
  keys: Channel[],
  field: "pipeline" | "revenue" | "opps"
): { ch: Channel; value: number } {
  let worst: Channel = keys[0];
  for (const ch of keys) {
    if (attr[ch][field] < attr[worst][field]) worst = ch;
  }
  return { ch: worst, value: attr[worst][field] };
}

const CHANNEL_NAMES: Record<Channel, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  form: "Web Forms",
  events: "Events",
};

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

interface OverviewParams {
  attribution: Record<Channel, AttributionResult>;
  channelKeys: Channel[];
  model: string;
  kpis: { totalPipeline: number; closedWon: number; winRate: number; opps: number; avgTouches: number };
  momDeltas: { pipeline: number | null; closedWon: number | null; winRate: number | null };
}

interface OverviewInterpretation {
  channelSoWhats: string[];
  funnelSoWhats: string[];
  actions: ActionCardProps[];
}

export function interpretOverview(p: OverviewParams): OverviewInterpretation {
  const totalPipeline = p.channelKeys.reduce((s, ch) => s + p.attribution[ch].pipeline, 0);
  const top = topChannel(p.attribution, p.channelKeys, "pipeline");
  const bottom = bottomChannel(p.attribution, p.channelKeys, "pipeline");
  const topShare = totalPipeline > 0 ? top.value / totalPipeline : 0;
  const bottomShare = totalPipeline > 0 ? bottom.value / totalPipeline : 0;

  const channelSoWhats: string[] = [];
  channelSoWhats.push(
    `Under the ${p.model} model, ${CHANNEL_NAMES[top.ch]} drives ${fmtPct(topShare)} of attributed pipeline (${fmtCurrency(top.value)}), while ${CHANNEL_NAMES[bottom.ch]} accounts for just ${fmtPct(bottomShare)}.`
  );

  if (topShare > 0.4) {
    channelSoWhats.push(
      `Pipeline is heavily concentrated — ${CHANNEL_NAMES[top.ch]} alone exceeds 40%. Switch attribution models to check if this holds or if other channels are under-credited.`
    );
  }

  const funnelSoWhats: string[] = [];
  if (p.kpis.winRate > 0) {
    funnelSoWhats.push(
      `Overall win rate is ${fmtPct(p.kpis.winRate)} across ${p.kpis.opps} opportunities, with ${fmtCurrency(p.kpis.closedWon)} closed-won revenue.`
    );
  }
  if (p.momDeltas.pipeline !== null && Math.abs(p.momDeltas.pipeline) > 3) {
    const dir = p.momDeltas.pipeline > 0 ? "up" : "down";
    funnelSoWhats.push(
      `Pipeline is ${dir} ${Math.abs(p.momDeltas.pipeline).toFixed(1)}% month-over-month — ${dir === "up" ? "momentum is building" : "investigate sourcing slowdowns"}.`
    );
  }

  const actions: ActionCardProps[] = [];

  // Action 1: Concentration risk
  if (topShare > 0.35) {
    actions.push({
      title: "Diversify pipeline sources",
      finding: `${CHANNEL_NAMES[top.ch]} drives ${fmtPct(topShare)} of pipeline. If this channel underperforms next quarter, ${fmtCurrency(top.value * 0.3)} in pipeline is at risk.`,
      action: `Test increasing ${CHANNEL_NAMES[bottom.ch]} investment — it currently accounts for only ${fmtPct(bottomShare)} but may have untapped capacity.`,
      priority: "high",
    });
  }

  // Action 2: Win rate improvement
  if (p.kpis.avgTouches < 5) {
    actions.push({
      title: "Increase touchpoint density",
      finding: `Average touches per deal is ${p.kpis.avgTouches.toFixed(1)}. Won deals typically require 6+ touches — accounts may be under-nurtured.`,
      action: "Add mid-funnel email nurture sequences and event invitations to increase engagement before sales handoff.",
      priority: "medium",
    });
  }

  return { channelSoWhats, funnelSoWhats, actions };
}

// ---------------------------------------------------------------------------
// Multi-Touch
// ---------------------------------------------------------------------------

interface MultiTouchDelta {
  channel: Channel;
  ft: number;
  lt: number;
  mt: number;
  ftDelta: number;
  ltDelta: number;
}

interface WonVsLostEntry {
  channel: Channel;
  wonAvg: number;
  lostAvg: number;
}

interface MultiTouchParams {
  deltas: MultiTouchDelta[];
  wonVsLost: WonVsLostEntry[];
  totalPipeline: number;
}

interface MultiTouchInterpretation {
  comparisonSoWhats: string[];
  wonLostSoWhats: string[];
  actions: ActionCardProps[];
}

export function interpretMultiTouch(p: MultiTouchParams): MultiTouchInterpretation {
  const comparisonSoWhats: string[] = [];
  const wonLostSoWhats: string[] = [];
  const actions: ActionCardProps[] = [];

  // Find biggest gainer and loser from FT to MT
  const sorted = [...p.deltas].sort((a, b) => b.ftDelta - a.ftDelta);
  const gainer = sorted[0];
  const loser = sorted[sorted.length - 1];

  if (gainer && gainer.ftDelta > 5) {
    comparisonSoWhats.push(
      `${CHANNEL_NAMES[gainer.channel]} gains ${gainer.ftDelta > 0 ? "+" : ""}${gainer.ftDelta.toFixed(0)}% pipeline credit when switching from first-touch to multi-touch — it's doing significant mid-funnel work that single-touch misses.`
    );
  }
  if (loser && loser.ftDelta < -5) {
    comparisonSoWhats.push(
      `${CHANNEL_NAMES[loser.channel]} loses ${Math.abs(loser.ftDelta).toFixed(0)}% credit under multi-touch. Its influence is concentrated at first-touch rather than distributed across the journey.`
    );
  }

  // Won vs Lost analysis
  const biggestWonLostGap = [...p.wonVsLost].sort((a, b) => {
    const gapA = a.wonAvg - a.lostAvg;
    const gapB = b.wonAvg - b.lostAvg;
    return gapB - gapA;
  });

  if (biggestWonLostGap[0] && biggestWonLostGap[0].wonAvg > biggestWonLostGap[0].lostAvg) {
    const g = biggestWonLostGap[0];
    const ratio = g.lostAvg > 0 ? (g.wonAvg / g.lostAvg).toFixed(1) : "significantly more";
    wonLostSoWhats.push(
      `Won deals have ${ratio}x more ${CHANNEL_NAMES[g.channel]} touches than lost deals (${g.wonAvg.toFixed(1)} vs ${g.lostAvg.toFixed(1)}) — this channel is the strongest differentiator between wins and losses.`
    );
  }

  // Actions
  if (gainer && gainer.ftDelta > 10) {
    actions.push({
      title: `Increase ${CHANNEL_NAMES[gainer.channel]} investment`,
      finding: `Multi-touch reveals ${CHANNEL_NAMES[gainer.channel]} influences ${fmtCurrency(gainer.mt)} in pipeline — ${gainer.ftDelta.toFixed(0)}% more than first-touch credits it for.`,
      action: `Reallocate budget toward ${CHANNEL_NAMES[gainer.channel]} mid-funnel campaigns. The current allocation undervalues its contribution.`,
      priority: "high",
    });
  }

  if (biggestWonLostGap[0] && biggestWonLostGap[0].wonAvg > biggestWonLostGap[0].lostAvg * 1.5) {
    const g = biggestWonLostGap[0];
    actions.push({
      title: `Boost ${CHANNEL_NAMES[g.channel]} for open deals`,
      finding: `Won deals average ${g.wonAvg.toFixed(1)} ${CHANNEL_NAMES[g.channel]} touches vs ${g.lostAvg.toFixed(1)} for lost. Many open deals may be below the threshold.`,
      action: `Audit open opportunities for ${CHANNEL_NAMES[g.channel]} touch count and trigger targeted outreach for those below ${g.wonAvg.toFixed(0)} touches.`,
      priority: "medium",
    });
  }

  return { comparisonSoWhats, wonLostSoWhats, actions };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

interface PipelineParams {
  stageMetrics: { stage: string; stageName: string; conversionToNext: number; dropoffRate: number; pipeline: number; accountCount: number }[];
  velocityByStage: { stage: string; stageName: string; wonAvgDays: number; lostAvgDays: number; openAvgDays: number }[];
  overallConversionRate: number;
  topDropoffStage: string;
  bottleneckStage: string;
  avgTouchesWon: number;
  avgTouchesLost: number;
}

interface PipelineInterpretation {
  conversionSoWhats: string[];
  velocitySoWhats: string[];
  actions: ActionCardProps[];
}

export function interpretPipeline(p: PipelineParams): PipelineInterpretation {
  const conversionSoWhats: string[] = [];
  const velocitySoWhats: string[] = [];
  const actions: ActionCardProps[] = [];

  // Find the worst dropoff stage
  const dropoffStage = p.stageMetrics.find(s => s.stage === p.topDropoffStage);
  if (dropoffStage) {
    conversionSoWhats.push(
      `The biggest leak is at ${dropoffStage.stageName} where ${(dropoffStage.dropoffRate * 100).toFixed(0)}% of deals drop off. Overall funnel conversion is ${(p.overallConversionRate * 100).toFixed(1)}%.`
    );
  }

  conversionSoWhats.push(
    `Won deals average ${p.avgTouchesWon.toFixed(1)} touches vs ${p.avgTouchesLost.toFixed(1)} for lost — ${(p.avgTouchesWon - p.avgTouchesLost).toFixed(1)} more touches separates winners from losers.`
  );

  // Velocity insight
  const bottleneck = p.velocityByStage.find(s => s.stage === p.bottleneckStage);
  if (bottleneck) {
    velocitySoWhats.push(
      `${bottleneck.stageName} is the slowest stage — won deals spend ${bottleneck.wonAvgDays.toFixed(0)} days here on average. Lost deals linger ${bottleneck.lostAvgDays.toFixed(0)} days before stalling out.`
    );
  }

  // Actions
  if (dropoffStage && dropoffStage.dropoffRate > 0.3) {
    actions.push({
      title: `Fix the ${dropoffStage.stageName} leak`,
      finding: `${(dropoffStage.dropoffRate * 100).toFixed(0)}% of deals die at ${dropoffStage.stageName} — that's ${dropoffStage.accountCount} accounts and ${fmtCurrency(dropoffStage.pipeline)} in pipeline at risk.`,
      action: `Audit lost deals at this stage for missing content or touchpoint gaps. Add targeted case studies and demo offers for accounts stuck here.`,
      priority: "high",
    });
  }

  if (p.avgTouchesLost < p.avgTouchesWon * 0.7) {
    actions.push({
      title: "Close the touchpoint gap on open deals",
      finding: `Lost deals had ${((1 - p.avgTouchesLost / p.avgTouchesWon) * 100).toFixed(0)}% fewer touches than won deals. Under-engaged accounts are likely falling off.`,
      action: "Set up engagement alerts for deals with fewer than " + Math.ceil(p.avgTouchesWon * 0.6) + " touches and trigger automated nurture sequences.",
      priority: "medium",
    });
  }

  return { conversionSoWhats, velocitySoWhats, actions };
}

// ---------------------------------------------------------------------------
// Deal Scoring
// ---------------------------------------------------------------------------

interface DealScoringParams {
  scores: { probability: number; deal_amount: number; trend: string; risk_factors: { label: string; severity: string }[] }[];
  backtest: { auc: number; precision: number; recall: number; scoreSeparation: number; avgScoreWon: number; avgScoreLost: number };
  avgScore: number;
  atRiskCount: number;
  totalWeightedPipeline: number;
}

interface DealScoringInterpretation {
  kpiSoWhats: string[];
  backtestSoWhats: string[];
  actions: ActionCardProps[];
}

export function interpretDealScoring(p: DealScoringParams): DealScoringInterpretation {
  const kpiSoWhats: string[] = [];
  const backtestSoWhats: string[] = [];
  const actions: ActionCardProps[] = [];

  const atRiskPipeline = p.scores
    .filter(s => s.probability < 40)
    .reduce((sum, s) => sum + s.deal_amount, 0);

  kpiSoWhats.push(
    `${p.atRiskCount} deals scoring below 40% represent ${fmtCurrency(atRiskPipeline)} in at-risk pipeline. Weighted pipeline (score-adjusted) is ${fmtCurrency(p.totalWeightedPipeline)}.`
  );

  const improvable = p.scores.filter(s => s.probability >= 30 && s.probability <= 55);
  if (improvable.length > 0) {
    const improvablePipeline = improvable.reduce((s, d) => s + d.deal_amount, 0);
    kpiSoWhats.push(
      `${improvable.length} deals in the 30-55% range (${fmtCurrency(improvablePipeline)}) are most responsive to targeted outreach — they're winnable but need attention.`
    );
  }

  // Backtest interpretation
  const aucLabel = p.backtest.auc >= 0.8 ? "strong" : p.backtest.auc >= 0.7 ? "good" : "moderate";
  backtestSoWhats.push(
    `Model AUC of ${p.backtest.auc.toFixed(2)} shows ${aucLabel} predictive power. Won deals scored ${p.backtest.avgScoreWon.toFixed(0)}% on average vs ${p.backtest.avgScoreLost.toFixed(0)}% for lost — a ${p.backtest.scoreSeparation.toFixed(0)}-point separation.`
  );

  backtestSoWhats.push(
    `Precision is ${(p.backtest.precision * 100).toFixed(0)}% (of predicted wins, that many actually won) and recall is ${(p.backtest.recall * 100).toFixed(0)}% (of actual wins, that many were predicted). ${p.backtest.precision > p.backtest.recall ? "The model is conservative — it misses some wins but rarely gives false confidence." : "The model catches most wins but occasionally over-predicts."}`
  );

  // Actions
  if (p.atRiskCount > 0) {
    actions.push({
      title: `Rescue ${p.atRiskCount} at-risk deals`,
      finding: `${p.atRiskCount} open deals score below 40%, representing ${fmtCurrency(atRiskPipeline)} in pipeline. Common risk factors include declining engagement and missing touchpoint types.`,
      action: "Schedule immediate outreach for deals scoring 25-40% — they're still salvageable. Below 25%, consider deprioritizing to focus rep time on higher-probability opportunities.",
      priority: "high",
    });
  }

  if (improvable.length > 2) {
    actions.push({
      title: "Accelerate improvable deals",
      finding: `${improvable.length} deals in the 30-55% range have the highest lift potential. A few more touchpoints could push them above the 50% threshold.`,
      action: "Trigger targeted event invitations and personalized content for this cohort — they need 2-3 more quality touches to shift into high-probability territory.",
      priority: "medium",
    });
  }

  return { kpiSoWhats, backtestSoWhats, actions };
}

// ---------------------------------------------------------------------------
// Spend Optimizer
// ---------------------------------------------------------------------------

interface SpendOptimizerParams {
  totalBudget: number;
  projectedPipelineDelta: number;
  projectedPipelineDeltaPct: number;
  allocations: {
    channel: string;
    channelName: string;
    currentBudget: number;
    recommendedBudget: number;
    changePct: number;
    projectedPipeline: number;
    currentPipeline: number;
    marginalROI: number;
  }[];
}

interface SpendOptimizerInterpretation {
  allocationSoWhats: string[];
  actions: ActionCardProps[];
}

export function interpretSpendOptimizer(p: SpendOptimizerParams): SpendOptimizerInterpretation {
  const allocationSoWhats: string[] = [];
  const actions: ActionCardProps[] = [];

  // Find biggest increase and decrease
  const sorted = [...p.allocations].sort((a, b) => b.changePct - a.changePct);
  const increase = sorted[0];
  const decrease = sorted[sorted.length - 1];

  if (increase && decrease) {
    allocationSoWhats.push(
      `The optimizer recommends shifting budget from ${decrease.channelName} (${decrease.changePct > 0 ? "+" : ""}${decrease.changePct.toFixed(0)}%) to ${increase.channelName} (+${increase.changePct.toFixed(0)}%) — projected to add ${fmtCurrency(p.projectedPipelineDelta)} in pipeline (+${p.projectedPipelineDeltaPct.toFixed(1)}%).`
    );
  }

  // Marginal ROI insight
  const bestMarginal = [...p.allocations].sort((a, b) => b.marginalROI - a.marginalROI)[0];
  if (bestMarginal && bestMarginal.marginalROI > 1) {
    allocationSoWhats.push(
      `${bestMarginal.channelName} has the highest marginal ROI at ${bestMarginal.marginalROI.toFixed(1)}x — every additional dollar here produces ${bestMarginal.marginalROI.toFixed(1)}x in pipeline.`
    );
  }

  // Actions
  if (increase && increase.changePct > 10) {
    const shift = increase.recommendedBudget - increase.currentBudget;
    actions.push({
      title: `Shift ${fmtCurrency(shift)} to ${increase.channelName}`,
      finding: `${increase.channelName} has the highest marginal return. Increasing its budget by ${increase.changePct.toFixed(0)}% is projected to generate ${fmtCurrency(increase.projectedPipeline - increase.currentPipeline)} in additional pipeline.`,
      action: `Start with a 2-week test at the recommended budget level. Measure incremental pipeline generated before committing to the full quarter.`,
      priority: "high",
    });
  }

  if (decrease && decrease.changePct < -10) {
    actions.push({
      title: `Reduce ${decrease.channelName} spend`,
      finding: `${decrease.channelName} shows diminishing returns at current spend levels. The optimizer suggests reducing by ${Math.abs(decrease.changePct).toFixed(0)}% with minimal pipeline impact.`,
      action: "Gradually reduce spend over 4 weeks while monitoring pipeline metrics. Reallocate savings to higher-marginal-return channels.",
      priority: "medium",
    });
  }

  return { allocationSoWhats, actions };
}

// ---------------------------------------------------------------------------
// First-Touch / Last-Touch (shared)
// ---------------------------------------------------------------------------

interface SingleTouchParams {
  attribution: Record<Channel, AttributionResult>;
  channelKeys: Channel[];
  modelName: string; // "first-touch" | "last-touch"
}

interface SingleTouchInterpretation {
  soWhats: string[];
  actions: ActionCardProps[];
}

export function interpretSingleTouch(p: SingleTouchParams): SingleTouchInterpretation {
  const soWhats: string[] = [];
  const actions: ActionCardProps[] = [];
  const totalPipeline = p.channelKeys.reduce((s, ch) => s + p.attribution[ch].pipeline, 0);
  const top = topChannel(p.attribution, p.channelKeys, "pipeline");
  const topShare = totalPipeline > 0 ? top.value / totalPipeline : 0;

  const isFirst = p.modelName.includes("first");
  const verb = isFirst ? "sources" : "closes";

  soWhats.push(
    `${CHANNEL_NAMES[top.ch]} ${verb} ${fmtPct(topShare)} of all attributed pipeline (${fmtCurrency(top.value)}) — it's the dominant ${isFirst ? "demand generation" : "conversion"} channel.`
  );

  // Compare top 2
  const sorted = p.channelKeys
    .map(ch => ({ ch, pipe: p.attribution[ch].pipeline }))
    .sort((a, b) => b.pipe - a.pipe);

  if (sorted.length >= 2 && sorted[0].pipe > 0) {
    const ratio = sorted[1].pipe > 0 ? (sorted[0].pipe / sorted[1].pipe).toFixed(1) : "far";
    soWhats.push(
      `${CHANNEL_NAMES[sorted[0].ch]} generates ${ratio}x the pipeline of the next channel (${CHANNEL_NAMES[sorted[1].ch]}). ${isFirst ? "Top-of-funnel is concentrated." : "Final conversion is heavily skewed."}`
    );
  }

  if (topShare > 0.4) {
    actions.push({
      title: `Diversify ${isFirst ? "sourcing" : "closing"} channels`,
      finding: `${CHANNEL_NAMES[top.ch]} dominates with ${fmtPct(topShare)} of ${p.modelName} attribution. This creates single-channel risk.`,
      action: `Experiment with ${isFirst ? "awareness campaigns" : "bottom-of-funnel content"} on your #2 and #3 channels to reduce dependency.`,
      priority: "medium",
    });
  }

  return { soWhats, actions };
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

interface ChannelStatsEntry {
  channel: Channel;
  touches: number;
  pipeline: number;
  revenue: number;
  winRate: number;
  avgDealSize: number;
}

interface ChannelInterpretation {
  soWhats: string[];
  actions: ActionCardProps[];
}

export function interpretChannels(p: { stats: ChannelStatsEntry[] }): ChannelInterpretation {
  const soWhats: string[] = [];
  const actions: ActionCardProps[] = [];

  const sorted = [...p.stats].sort((a, b) => b.pipeline - a.pipeline);
  if (sorted.length >= 2) {
    const top = sorted[0];
    const second = sorted[1];
    soWhats.push(
      `${CHANNEL_NAMES[top.channel]} leads with ${fmtCurrency(top.pipeline)} in influenced pipeline (${top.touches} touches), followed by ${CHANNEL_NAMES[second.channel]} at ${fmtCurrency(second.pipeline)}.`
    );
  }

  // Efficiency comparison
  const byWinRate = [...p.stats].sort((a, b) => b.winRate - a.winRate);
  const byVolume = [...p.stats].sort((a, b) => b.touches - a.touches);
  if (byWinRate[0]?.channel !== byVolume[0]?.channel) {
    soWhats.push(
      `${CHANNEL_NAMES[byVolume[0].channel]} has the most touches but ${CHANNEL_NAMES[byWinRate[0].channel]} has the highest win rate (${(byWinRate[0].winRate * 100).toFixed(0)}%) — volume doesn't equal effectiveness.`
    );
  }

  // Action: underperforming high-volume channel
  if (byVolume[0] && byWinRate[0] && byVolume[0].channel !== byWinRate[0].channel) {
    actions.push({
      title: `Improve ${CHANNEL_NAMES[byVolume[0].channel]} conversion`,
      finding: `${CHANNEL_NAMES[byVolume[0].channel]} generates the most activity but converts at ${(byVolume[0].winRate * 100).toFixed(0)}%, below ${CHANNEL_NAMES[byWinRate[0].channel]}'s ${(byWinRate[0].winRate * 100).toFixed(0)}%.`,
      action: "Review the quality of leads from this channel. Better targeting or qualification could improve conversion without increasing spend.",
      priority: "medium",
    });
  }

  return { soWhats, actions };
}

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

interface CohortParams {
  activeTab: "time" | "channel" | "density" | "industry";
  topCohortLabel: string;
  topCohortWinRate: number;
  bottomCohortLabel: string;
  bottomCohortWinRate: number;
  avgWinRate: number;
  densityThreshold?: string;
  densityWinRateAbove?: number;
  densityWinRateBelow?: number;
}

interface CohortInterpretation {
  soWhats: string[];
  actions: ActionCardProps[];
}

export function interpretCohorts(p: CohortParams): CohortInterpretation {
  const soWhats: string[] = [];
  const actions: ActionCardProps[] = [];

  const spread = p.topCohortWinRate - p.bottomCohortWinRate;
  soWhats.push(
    `${p.topCohortLabel} has a ${(p.topCohortWinRate * 100).toFixed(0)}% win rate vs ${(p.bottomCohortWinRate * 100).toFixed(0)}% for ${p.bottomCohortLabel} — a ${(spread * 100).toFixed(0)}-point spread that reveals which segments convert best.`
  );

  if (p.activeTab === "density" && p.densityThreshold && p.densityWinRateAbove !== undefined && p.densityWinRateBelow !== undefined) {
    const ratio = p.densityWinRateBelow > 0
      ? (p.densityWinRateAbove / p.densityWinRateBelow).toFixed(1)
      : "significantly";
    soWhats.push(
      `Accounts with ${p.densityThreshold}+ touches win at ${ratio}x the rate of those below — this is your engagement activation threshold.`
    );
  }

  if (spread > 0.15) {
    actions.push({
      title: `Double down on ${p.topCohortLabel}`,
      finding: `${p.topCohortLabel} converts at ${(p.topCohortWinRate * 100).toFixed(0)}% — ${(spread * 100).toFixed(0)} percentage points above ${p.bottomCohortLabel}. This is a high-confidence ICP signal.`,
      action: "Increase targeting and budget allocation toward this segment. Create dedicated campaigns that mirror the touchpoint patterns of winning accounts in this cohort.",
      priority: "high",
    });
  }

  return { soWhats, actions };
}
