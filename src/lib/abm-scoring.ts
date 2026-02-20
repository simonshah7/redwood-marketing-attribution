// ============================================================
// ABM ENGAGEMENT SCORING ENGINE
// Account-level scoring with buying committee coverage
// ============================================================

import type { EnrichedAccount, EnrichedChannel, BuyingCommitteeMember, ContactRole, UnifiedTouchpoint } from './enriched-data';

export interface ABMAccountScore {
  account_id: string;
  account_name: string;
  opportunity_id: string;
  deal_amount: number;
  stage: string;
  segment: string;
  region: string;
  industry: string;
  product_line: string;

  // Scores
  engagement_score: number; // 0-100
  tier: 'hot' | 'warm' | 'cold';

  // Sub-scores
  recency_score: number;
  frequency_score: number;
  breadth_score: number;
  committee_coverage: number; // 0-100

  // Buying committee
  buying_committee: BuyingCommitteeMember[];
  total_committee_members: number;
  engaged_members: number;
  dark_members: number;

  // Engagement details
  total_touchpoints: number;
  channels_engaged: EnrichedChannel[];
  last_activity_date: string;
  days_since_activity: number;

  // Trend
  trend: 'rising' | 'stable' | 'declining';
  recent_touchpoints_30d: number;
  prior_touchpoints_30d: number;

  // Recommendation
  recommended_play: string;
}

// ---- Scoring Functions ----

function computeRecencyScore(daysSinceActivity: number): number {
  if (daysSinceActivity <= 3) return 100;
  if (daysSinceActivity <= 7) return 90;
  if (daysSinceActivity <= 14) return 75;
  if (daysSinceActivity <= 21) return 55;
  if (daysSinceActivity <= 30) return 35;
  if (daysSinceActivity <= 45) return 20;
  return Math.max(5, 20 - (daysSinceActivity - 45) * 0.3);
}

function computeTimeDecayedCount(
  touchpoints: { date: string }[],
  referenceDate: string,
): number {
  const refDate = new Date(referenceDate);
  return touchpoints.reduce((sum, tp) => {
    const daysSinceTouch = Math.max(
      0,
      Math.floor((refDate.getTime() - new Date(tp.date).getTime()) / 86400000),
    );
    const decayWeight = Math.pow(0.95, daysSinceTouch);
    return sum + decayWeight;
  }, 0);
}

function computeFrequencyScore(touchpointCount: number): number {
  if (touchpointCount >= 12) return 100;
  if (touchpointCount >= 8) return 85;
  if (touchpointCount >= 5) return 65;
  if (touchpointCount >= 3) return 45;
  if (touchpointCount >= 1) return 25;
  return 0;
}

function computeBreadthScore(channelCount: number): number {
  if (channelCount >= 6) return 100;
  if (channelCount >= 4) return 80;
  if (channelCount >= 3) return 60;
  if (channelCount >= 2) return 40;
  if (channelCount >= 1) return 20;
  return 0;
}

const ROLE_WEIGHTS: Record<ContactRole, number> = {
  champion: 2.0,
  economic_buyer: 1.8,
  technical_evaluator: 1.5,
  influencer: 1.0,
  blocker: 0.5,
};

function computeCommitteeCoverage(committee: BuyingCommitteeMember[]): number {
  if (committee.length === 0) return 0;

  const totalWeight = committee.reduce(
    (sum, m) => sum + (ROLE_WEIGHTS[m.role] ?? 1.0),
    0,
  );

  const engagedWeight = committee
    .filter(m => m.touchpoint_count > 0)
    .reduce((sum, m) => sum + (ROLE_WEIGHTS[m.role] ?? 1.0), 0);

  return Math.round((engagedWeight / totalWeight) * 100);
}

function determineTrend(
  touchpoints: { date: string }[],
  referenceDate: string,
): { trend: 'rising' | 'stable' | 'declining'; recent: number; prior: number } {
  const refDate = new Date(referenceDate);
  const thirtyDaysAgo = new Date(refDate.getTime() - 30 * 86400000);
  const sixtyDaysAgo = new Date(refDate.getTime() - 60 * 86400000);

  const recent = touchpoints.filter(tp => {
    const d = new Date(tp.date);
    return d >= thirtyDaysAgo && d <= refDate;
  }).length;

  const prior = touchpoints.filter(tp => {
    const d = new Date(tp.date);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;

  const trend = recent > prior + 1 ? 'rising' as const :
                recent < prior - 1 ? 'declining' as const : 'stable' as const;

  return { trend, recent, prior };
}

function recommendPlay(
  score: number,
  tier: 'hot' | 'warm' | 'cold',
  stage: string,
  daysSince: number,
  committeeCoverage: number,
  channelCount: number,
): string {
  // High engagement, advanced stage
  if (tier === 'hot' && ['eval_planning', 'negotiation'].includes(stage)) {
    if (committeeCoverage < 60) {
      return 'Expand buying committee — engage the economic buyer with an executive briefing';
    }
    return 'Maintain momentum — schedule technical deep-dive and share competitive proof points';
  }

  // High engagement, early stage
  if (tier === 'hot' && ['disco_set', 'disco_completed'].includes(stage)) {
    return 'Accelerate to next stage — offer a custom demo or discovery workshop';
  }

  // Warm but going dark
  if (tier === 'warm' && daysSince > 14) {
    return 'Re-engage urgently — BDR outreach with new content relevant to current stage';
  }

  // Warm, low channel diversity
  if (tier === 'warm' && channelCount <= 2) {
    return 'Diversify touchpoints — add event invitation or content offer to supplement current engagement';
  }

  // Warm general
  if (tier === 'warm') {
    return 'Nurture with stage-appropriate content and prepare for BDR follow-up';
  }

  // Cold with some activity
  if (tier === 'cold' && daysSince <= 30) {
    return 'Low engagement detected — trigger targeted LinkedIn ABM campaign and BDR cold outreach';
  }

  // Cold and dark
  return 'Account dark — initiate multi-touch re-engagement sequence across BDR + digital channels';
}

// ---- Main Scoring ----

export function scoreABMAccounts(
  accounts: EnrichedAccount[],
  referenceDate: string = '2026-01-31',
): ABMAccountScore[] {
  const refDate = new Date(referenceDate);

  // Only score open deals
  const openAccounts = accounts.filter(a =>
    a.stage !== 'closed_won' && a.stage !== 'closed_lost'
  );

  return openAccounts.map(account => {
    const touchpoints = account.touchpoints;
    const committee = account.buying_committee || [];

    // Days since last activity
    const lastActivity = touchpoints.length > 0
      ? touchpoints[touchpoints.length - 1].date
      : account.created_date;
    const daysSinceActivity = Math.floor(
      (refDate.getTime() - new Date(lastActivity).getTime()) / 86400000
    );

    // Channels engaged
    const channels = [...new Set(touchpoints.map(tp => tp.channel))] as EnrichedChannel[];

    // Sub-scores (frequency uses time-decayed touchpoint weight)
    const recency = computeRecencyScore(daysSinceActivity);
    const decayedCount = computeTimeDecayedCount(touchpoints, referenceDate);
    const frequency = computeFrequencyScore(decayedCount);
    const breadth = computeBreadthScore(channels.length);
    const coverage = computeCommitteeCoverage(committee);

    // Weighted composite
    const score = Math.round(
      recency * 0.30 +
      frequency * 0.25 +
      breadth * 0.25 +
      coverage * 0.20
    );

    const tier = score >= 65 ? 'hot' as const :
                 score >= 35 ? 'warm' as const : 'cold' as const;

    // Trend
    const { trend, recent, prior } = determineTrend(touchpoints, referenceDate);

    // Buying committee details
    const engagedMembers = committee.filter(m => m.touchpoint_count > 0).length;
    const darkMembers = committee.filter(m => m.touchpoint_count === 0).length;

    // Recommended play
    const play = recommendPlay(score, tier, account.stage, daysSinceActivity, coverage, channels.length);

    return {
      account_id: account.account_id,
      account_name: account.account_name,
      opportunity_id: account.opportunity_id,
      deal_amount: account.deal_amount,
      stage: account.stage,
      segment: account.segment,
      region: account.region,
      industry: account.industry,
      product_line: account.product_line,
      engagement_score: score,
      tier,
      recency_score: recency,
      frequency_score: frequency,
      breadth_score: breadth,
      committee_coverage: coverage,
      buying_committee: committee,
      total_committee_members: committee.length,
      engaged_members: engagedMembers,
      dark_members: darkMembers,
      total_touchpoints: touchpoints.length,
      channels_engaged: channels,
      last_activity_date: lastActivity,
      days_since_activity: daysSinceActivity,
      trend,
      recent_touchpoints_30d: recent,
      prior_touchpoints_30d: prior,
      recommended_play: play,
    };
  }).sort((a, b) => b.engagement_score - a.engagement_score);
}

// ---- Competitive Signal Detection ----

export interface CompetitiveSignal {
  account_id: string;
  account_name: string;
  signal_type: 'competitive_content' | 'competitor_campaign' | 'evaluation_stage';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

const COMPETITOR_CAMPAIGN_KEYWORDS = /conquest|competitive|displacement|ctrl-m|tws/i;
const COMPETITIVE_CONTENT_KEYWORDS = /comparison|vs|migration/i;

function touchpointHasCompetitorCampaign(tp: UnifiedTouchpoint): boolean {
  return !!(tp.campaign_name && COMPETITOR_CAMPAIGN_KEYWORDS.test(tp.campaign_name));
}

function touchpointHasCompetitiveContent(tp: UnifiedTouchpoint): boolean {
  return !!(tp.content_asset && COMPETITIVE_CONTENT_KEYWORDS.test(tp.content_asset));
}

export function detectCompetitiveSignals(
  accounts: EnrichedAccount[],
  referenceDate: string = '2026-01-31',
): CompetitiveSignal[] {
  const signals: CompetitiveSignal[] = [];

  for (const account of accounts) {
    const touchpoints = account.touchpoints;
    let hasCompetitorTouch = false;

    // Scan for competitor campaign signals
    for (const tp of touchpoints) {
      if (touchpointHasCompetitorCampaign(tp)) {
        hasCompetitorTouch = true;
        signals.push({
          account_id: account.account_id,
          account_name: account.account_name,
          signal_type: 'competitor_campaign',
          description: `Campaign "${tp.campaign_name}" on ${tp.date} indicates competitor activity`,
          severity: 'medium',
        });
      }
    }

    // Scan for competitive content signals
    for (const tp of touchpoints) {
      if (touchpointHasCompetitiveContent(tp)) {
        hasCompetitorTouch = true;
        signals.push({
          account_id: account.account_id,
          account_name: account.account_name,
          signal_type: 'competitive_content',
          description: `Content "${tp.content_asset}" accessed on ${tp.date} suggests competitive evaluation`,
          severity: 'medium',
        });
      }
    }

    // Evaluation stage + competitor touches → high severity
    if (
      hasCompetitorTouch &&
      (account.stage === 'eval_planning' || account.stage === 'negotiation')
    ) {
      signals.push({
        account_id: account.account_id,
        account_name: account.account_name,
        signal_type: 'evaluation_stage',
        description: `Account at ${account.stage} stage with competitor-related touches — competitive deal risk`,
        severity: 'high',
      });
    }
  }

  return signals;
}
