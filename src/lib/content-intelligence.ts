// ============================================================
// CONTENT PERFORMANCE INTELLIGENCE
// Content × stage heatmap, gap analysis, acceleration scoring
// ============================================================

import type { EnrichedAccount, UnifiedTouchpoint, AssetType } from './enriched-data';

const STAGE_ORDER = ['disco_set', 'disco_completed', 'solution_accepted', 'eval_planning', 'negotiation'];

const STAGE_LABELS: Record<string, string> = {
  disco_set: 'Discovery Set',
  disco_completed: 'Discovery Done',
  solution_accepted: 'Solution Accepted',
  eval_planning: 'Evaluation',
  negotiation: 'Negotiation',
};

export interface ContentStageCell {
  stage: string;
  stageLabel: string;
  count: number;
  intensity: number; // 0-1 for heatmap color
}

export interface ContentPerformance {
  content_asset: string;
  asset_type: AssetType;
  total_engagements: number;
  pipeline_influenced: number;
  appears_in_won_pct: number;
  appears_in_lost_pct: number;
  acceleration_days: number; // avg days saved when consumed
  stage_distribution: ContentStageCell[];
}

export interface ContentGap {
  stage: string;
  stageLabel: string;
  gap_type: 'low_density' | 'missing_asset_type' | 'stale_content';
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
  avg_days_stalled: number;
}

export interface ContentRecommendation {
  title: string;
  type: AssetType;
  target_stage: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

// ---- Build Content × Stage Heatmap ----

export function buildContentHeatmap(accounts: EnrichedAccount[]): ContentPerformance[] {
  const contentMap = new Map<string, {
    asset_type: AssetType;
    engagements: number;
    pipeline: number;
    wonCount: number;
    lostCount: number;
    totalAccounts: number;
    stageCounts: Record<string, number>;
    dealDays: number[];
  }>();

  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');

  for (const account of accounts) {
    const contentTouches = account.touchpoints.filter(
      tp => tp.channel === 'content_download' && tp.content_asset
    );

    for (const tp of contentTouches) {
      const key = tp.content_asset!;
      if (!contentMap.has(key)) {
        contentMap.set(key, {
          asset_type: tp.asset_type || 'whitepaper',
          engagements: 0,
          pipeline: 0,
          wonCount: 0,
          lostCount: 0,
          totalAccounts: 0,
          stageCounts: {},
          dealDays: [],
        });
      }

      const entry = contentMap.get(key)!;
      entry.engagements++;
      entry.pipeline += account.deal_amount;
      entry.totalAccounts++;

      if (account.stage === 'closed_won') entry.wonCount++;
      if (account.stage === 'closed_lost') entry.lostCount++;

      // Map touchpoint to the stage at time of engagement
      const touchStage = tp.stage || account.stage;
      const relevantStage = STAGE_ORDER.includes(touchStage) ? touchStage : 'disco_set';
      entry.stageCounts[relevantStage] = (entry.stageCounts[relevantStage] || 0) + 1;

      // Estimate acceleration by looking at stage velocity
      if (account.stage === 'closed_won') {
        const totalDays = account.stage_history.reduce((s, sh) => s + sh.days_in_stage, 0);
        entry.dealDays.push(totalDays);
      }
    }
  }

  // Also scan web page visits for content-like pages
  for (const account of accounts) {
    const webContentTouches = account.touchpoints.filter(
      tp => tp.channel === 'web_visit' && (
        tp.page_url?.includes('whitepaper') ||
        tp.page_url?.includes('case-study') ||
        tp.page_url?.includes('datasheet') ||
        tp.page_url?.includes('roi-calculator')
      )
    );

    for (const tp of webContentTouches) {
      const key = tp.page_title || tp.page_url || 'Unknown Page';
      if (!contentMap.has(key)) {
        contentMap.set(key, {
          asset_type: tp.page_url?.includes('case-study') ? 'case_study' :
                      tp.page_url?.includes('roi-calculator') ? 'roi_calculator' :
                      tp.page_url?.includes('datasheet') ? 'datasheet' : 'whitepaper',
          engagements: 0,
          pipeline: 0,
          wonCount: 0,
          lostCount: 0,
          totalAccounts: 0,
          stageCounts: {},
          dealDays: [],
        });
      }
      const entry = contentMap.get(key)!;
      entry.engagements++;
      const touchStage = tp.stage || account.stage;
      const relevantStage = STAGE_ORDER.includes(touchStage) ? touchStage : 'disco_set';
      entry.stageCounts[relevantStage] = (entry.stageCounts[relevantStage] || 0) + 1;
    }
  }

  // Find max engagement for normalization
  const maxEngagement = Math.max(1, ...[...contentMap.values()].flatMap(c =>
    Object.values(c.stageCounts)
  ));

  const wonCount = wonAccounts.length || 1;
  const lostCount = lostAccounts.length || 1;

  // Average days for all won deals (baseline for acceleration)
  const allWonDays = wonAccounts.map(a =>
    a.stage_history.reduce((s, sh) => s + sh.days_in_stage, 0)
  );
  const avgWonDays = allWonDays.length > 0
    ? allWonDays.reduce((a, b) => a + b, 0) / allWonDays.length
    : 120;

  return [...contentMap.entries()]
    .map(([name, data]) => {
      const avgDealDays = data.dealDays.length > 0
        ? data.dealDays.reduce((a, b) => a + b, 0) / data.dealDays.length
        : avgWonDays;

      return {
        content_asset: name,
        asset_type: data.asset_type,
        total_engagements: data.engagements,
        pipeline_influenced: data.pipeline,
        appears_in_won_pct: Math.round((data.wonCount / wonCount) * 100),
        appears_in_lost_pct: Math.round((data.lostCount / lostCount) * 100),
        acceleration_days: Math.round(avgWonDays - avgDealDays),
        stage_distribution: STAGE_ORDER.map(stage => ({
          stage,
          stageLabel: STAGE_LABELS[stage] || stage,
          count: data.stageCounts[stage] || 0,
          intensity: (data.stageCounts[stage] || 0) / maxEngagement,
        })),
      };
    })
    .sort((a, b) => b.total_engagements - a.total_engagements);
}

// ---- Gap Analysis ----

export function identifyContentGaps(
  heatmap: ContentPerformance[],
  accounts: EnrichedAccount[],
): ContentGap[] {
  const gaps: ContentGap[] = [];

  // Aggregate content density per stage
  const stageDensity: Record<string, number> = {};
  const stageAssetTypes: Record<string, Set<string>> = {};

  for (const content of heatmap) {
    for (const cell of content.stage_distribution) {
      stageDensity[cell.stage] = (stageDensity[cell.stage] || 0) + cell.count;
      if (!stageAssetTypes[cell.stage]) stageAssetTypes[cell.stage] = new Set();
      if (cell.count > 0) stageAssetTypes[cell.stage].add(content.asset_type);
    }
  }

  const maxDensity = Math.max(1, ...Object.values(stageDensity));

  // Compute average days stalled per stage
  const stageDays: Record<string, number[]> = {};
  for (const acc of accounts) {
    for (const sh of acc.stage_history) {
      if (!stageDays[sh.stage]) stageDays[sh.stage] = [];
      stageDays[sh.stage].push(sh.days_in_stage);
    }
  }
  const avgStageDays: Record<string, number> = {};
  for (const [stage, days] of Object.entries(stageDays)) {
    avgStageDays[stage] = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }

  for (const stage of STAGE_ORDER) {
    const density = stageDensity[stage] || 0;
    const relDensity = density / maxDensity;
    const types = stageAssetTypes[stage] || new Set();
    const avgDays = avgStageDays[stage] || 15;

    // Low density gap
    if (relDensity < 0.15) {
      gaps.push({
        stage,
        stageLabel: STAGE_LABELS[stage] || stage,
        gap_type: 'low_density',
        severity: avgDays > 20 ? 'critical' : 'moderate',
        description: `Very low content engagement at ${STAGE_LABELS[stage] || stage} — only ${density} interactions across all deals.`,
        recommendation: stage === 'eval_planning'
          ? 'Create an ROI calculator or technical comparison guide — deals stall here for ' + avgDays + ' days on average'
          : stage === 'negotiation'
          ? 'Develop a Total Economic Impact study or competitive displacement case study'
          : stage === 'solution_accepted'
          ? 'Build a customer success video or implementation guide showcasing quick time-to-value'
          : 'Produce stage-appropriate content (guide, datasheet, or case study)',
        avg_days_stalled: avgDays,
      });
    }

    // Missing asset type gap
    const idealTypes: AssetType[] =
      stage === 'disco_set' ? ['whitepaper', 'infographic', 'guide'] :
      stage === 'disco_completed' ? ['datasheet', 'case_study', 'guide'] :
      stage === 'solution_accepted' ? ['case_study', 'video', 'guide'] :
      stage === 'eval_planning' ? ['roi_calculator', 'datasheet', 'case_study'] :
      ['case_study', 'whitepaper', 'roi_calculator'];

    const missingTypes = idealTypes.filter(t => !types.has(t));
    if (missingTypes.length >= 2) {
      gaps.push({
        stage,
        stageLabel: STAGE_LABELS[stage] || stage,
        gap_type: 'missing_asset_type',
        severity: 'moderate',
        description: `Missing ${missingTypes.join(', ')} content at ${STAGE_LABELS[stage] || stage}`,
        recommendation: `Create a ${missingTypes[0]} for this stage to fill the gap`,
        avg_days_stalled: avgDays,
      });
    }
  }

  return gaps.sort((a, b) => {
    const sevOrder = { critical: 0, moderate: 1, minor: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

// ---- Content Recommendations ----

export function generateContentRecommendations(
  gaps: ContentGap[],
  heatmap: ContentPerformance[],
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  for (const gap of gaps) {
    if (gap.gap_type === 'low_density') {
      const rec = gap.stage === 'eval_planning' ? {
        title: 'ROI Calculator: RunMyJobs vs Manual Scheduling',
        type: 'roi_calculator' as AssetType,
      } : gap.stage === 'negotiation' ? {
        title: 'Total Economic Impact: RunMyJobs Enterprise',
        type: 'whitepaper' as AssetType,
      } : gap.stage === 'solution_accepted' ? {
        title: 'Customer Success Video: Enterprise Migration Story',
        type: 'video' as AssetType,
      } : gap.stage === 'disco_completed' ? {
        title: 'Technical Comparison Guide: RunMyJobs vs Legacy Schedulers',
        type: 'datasheet' as AssetType,
      } : {
        title: 'Industry Guide: Workload Automation Best Practices',
        type: 'guide' as AssetType,
      };

      recommendations.push({
        ...rec,
        target_stage: gap.stage,
        rationale: `${gap.description} Deals stall ${gap.avg_days_stalled}d at this stage.`,
        priority: gap.severity === 'critical' ? 'high' : 'medium',
      });
    }
  }

  // Also recommend based on high performers
  const topContent = heatmap.filter(c => c.appears_in_won_pct > 30);
  if (topContent.length > 0) {
    const topType = topContent[0].asset_type;
    recommendations.push({
      title: `Create more ${topType} content — top performing format`,
      type: topType,
      target_stage: topContent[0].stage_distribution
        .sort((a, b) => b.count - a.count)[0]?.stage || 'disco_set',
      rationale: `${topType} content appears in ${topContent[0].appears_in_won_pct}% of won deals.`,
      priority: 'medium',
    });
  }

  return recommendations.slice(0, 6);
}
