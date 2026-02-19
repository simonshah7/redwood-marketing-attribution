// ============================================================
// MARKETING SPEND OPTIMIZER
// Constrained optimization using marginal ROI equalization
// ============================================================

import { CHANNEL_SPEND_DATA, type ChannelSpendData } from './mock-channel-spend';

export interface ChannelAllocation {
  channel: string;
  channelName: string;
  currentBudget: number;
  recommendedBudget: number;
  change: number;
  changePct: number;
  currentPipeline: number;
  projectedPipeline: number;
  pipelineDelta: number;
  currentROI: number;
  projectedROI: number;
  marginalROI: number;
}

export interface OptimizationResult {
  totalBudget: number;
  currentTotalPipeline: number;
  projectedTotalPipeline: number;
  pipelineDelta: number;
  pipelineDeltaPct: number;
  currentTotalRevenue: number;
  allocations: ChannelAllocation[];
}

// Pipeline = coefficient * sqrt(spend)
// Marginal pipeline = coefficient / (2 * sqrt(spend))
function pipelineFromSpend(coefficient: number, spend: number): number {
  return coefficient * Math.sqrt(spend);
}

function marginalPipeline(coefficient: number, spend: number): number {
  if (spend <= 0) return Infinity;
  return coefficient / (2 * Math.sqrt(spend));
}

// Optimization: equalize marginal ROI across all channels
// subject to: sum of allocations = totalBudget, and min/max constraints
export function optimizeSpend(totalBudget: number, channelData?: ChannelSpendData[]): OptimizationResult {
  const channels = channelData || CHANNEL_SPEND_DATA;

  // Step 1: Start with minimum allocations
  let remaining = totalBudget;
  const allocations: number[] = channels.map(ch => {
    remaining -= ch.minBudget;
    return ch.minBudget;
  });

  if (remaining < 0) {
    // Budget too small for minimums — proportional allocation
    const totalMin = channels.reduce((s, ch) => s + ch.minBudget, 0);
    channels.forEach((ch, i) => {
      allocations[i] = Math.round((ch.minBudget / totalMin) * totalBudget);
    });
  } else {
    // Step 2: Iteratively allocate remaining budget to the channel
    // with highest marginal pipeline, respecting max constraints
    const step = 1000; // $1K increments
    while (remaining >= step) {
      let bestIdx = -1;
      let bestMarginal = -1;

      for (let i = 0; i < channels.length; i++) {
        if (allocations[i] >= channels[i].maxBudget) continue;
        const m = marginalPipeline(channels[i].coefficient, allocations[i]);
        if (m > bestMarginal) {
          bestMarginal = m;
          bestIdx = i;
        }
      }

      if (bestIdx < 0) break; // All at max

      const addAmount = Math.min(step, remaining, channels[bestIdx].maxBudget - allocations[bestIdx]);
      allocations[bestIdx] += addAmount;
      remaining -= addAmount;
    }

    // Distribute any remaining cents
    if (remaining > 0) {
      for (let i = 0; i < channels.length && remaining > 0; i++) {
        const add = Math.min(remaining, channels[i].maxBudget - allocations[i]);
        allocations[i] += add;
        remaining -= add;
      }
    }
  }

  // Step 3: Compute results
  const results: ChannelAllocation[] = channels.map((ch, i) => {
    const recommendedBudget = Math.round(allocations[i]);
    const projectedPipeline = Math.round(pipelineFromSpend(ch.coefficient, recommendedBudget));
    const currentPipeline = ch.currentPipeline;

    return {
      channel: ch.channel,
      channelName: ch.channelName,
      currentBudget: ch.currentBudget,
      recommendedBudget,
      change: recommendedBudget - ch.currentBudget,
      changePct: ch.currentBudget > 0 ? ((recommendedBudget - ch.currentBudget) / ch.currentBudget) * 100 : 0,
      currentPipeline,
      projectedPipeline,
      pipelineDelta: projectedPipeline - currentPipeline,
      currentROI: ch.currentBudget > 0 ? currentPipeline / ch.currentBudget : 0,
      projectedROI: recommendedBudget > 0 ? projectedPipeline / recommendedBudget : 0,
      marginalROI: marginalPipeline(ch.coefficient, recommendedBudget),
    };
  });

  const currentTotalPipeline = channels.reduce((s, ch) => s + ch.currentPipeline, 0);
  const projectedTotalPipeline = results.reduce((s, r) => s + r.projectedPipeline, 0);
  const currentTotalRevenue = channels.reduce((s, ch) => s + ch.currentRevenue, 0);

  return {
    totalBudget,
    currentTotalPipeline,
    projectedTotalPipeline,
    pipelineDelta: projectedTotalPipeline - currentTotalPipeline,
    pipelineDeltaPct: currentTotalPipeline > 0
      ? ((projectedTotalPipeline - currentTotalPipeline) / currentTotalPipeline) * 100
      : 0,
    currentTotalRevenue,
    allocations: results.sort((a, b) => b.recommendedBudget - a.recommendedBudget),
  };
}
