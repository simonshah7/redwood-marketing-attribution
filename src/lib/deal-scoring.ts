// ============================================================
// PREDICTIVE DEAL SCORING ENGINE
// Scores open deals based on touchpoint pattern similarity to won/lost deals
// ============================================================

import type { EnrichedAccount, UnifiedTouchpoint, EnrichedChannel } from './enriched-data';
import { calculateWinLossSignals } from './explorer-analysis';

export interface ScoreComponent {
  factor: string;
  weight: number;
  score: number; // 0-100
  detail: string;
}

export interface RiskFactor {
  label: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface DealScore {
  account_id: string;
  account_name: string;
  opportunity_id: string;
  deal_amount: number;
  stage: string;
  product_line: string;
  probability: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  score_components: ScoreComponent[];
  risk_factors: RiskFactor[];
  matching_won_patterns: string[];
  matching_lost_patterns: string[];
  trend: 'improving' | 'stable' | 'declining';
  days_since_last_touch: number;
}

// ---- Scoring Algorithms ----

function channelDiversityScore(
  dealChannels: Set<EnrichedChannel>,
  wonChannelProfile: Map<EnrichedChannel, number>,
): number {
  // Jaccard similarity between deal's channel set and top won-deal channels
  const topWonChannels = new Set(
    [...wonChannelProfile.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ch]) => ch)
  );

  const intersection = new Set([...dealChannels].filter(ch => topWonChannels.has(ch)));
  const union = new Set([...dealChannels, ...topWonChannels]);

  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

function touchpointCountScore(
  dealTouchCount: number,
  wonAvgTouches: number,
): number {
  // Score based on how close the deal's touch count is to the won average
  if (wonAvgTouches === 0) return 50;
  const ratio = dealTouchCount / wonAvgTouches;
  if (ratio >= 0.8 && ratio <= 1.5) return 100;
  if (ratio >= 0.5 && ratio <= 2.0) return 70;
  if (ratio >= 0.3) return 40;
  return 15;
}

function winSignalScore(
  dealTouchpoints: UnifiedTouchpoint[],
  winSignals: { touchpoint_descriptor: string; touchpoint_type: string; lift_ratio: number }[],
): number {
  const topSignals = winSignals.slice(0, 10);
  if (topSignals.length === 0) return 50;

  let matchCount = 0;
  for (const signal of topSignals) {
    const hasSignal = dealTouchpoints.some(
      tp => `${tp.channel}:${tp.activity_type}` === signal.touchpoint_descriptor ||
            tp.channel === signal.touchpoint_type
    );
    if (hasSignal) matchCount++;
  }

  return (matchCount / topSignals.length) * 100;
}

function velocityScore(
  account: EnrichedAccount,
  wonMedianDaysPerStage: Map<string, number>,
): number {
  const currentStage = account.stage;
  const stageEntry = account.stage_history.find(sh => sh.stage === currentStage);
  if (!stageEntry) return 50;

  const daysInStage = stageEntry.days_in_stage;
  const wonMedian = wonMedianDaysPerStage.get(currentStage) || 20;

  // Faster = better score
  const ratio = daysInStage / wonMedian;
  if (ratio <= 0.8) return 95;
  if (ratio <= 1.2) return 80;
  if (ratio <= 1.8) return 55;
  if (ratio <= 2.5) return 30;
  return 10;
}

function recencyScore(daysSinceLastTouch: number): number {
  // Exponential decay - recent engagement scores high
  if (daysSinceLastTouch <= 3) return 100;
  if (daysSinceLastTouch <= 7) return 90;
  if (daysSinceLastTouch <= 14) return 75;
  if (daysSinceLastTouch <= 21) return 55;
  if (daysSinceLastTouch <= 30) return 35;
  return Math.max(5, 35 - (daysSinceLastTouch - 30) * 0.8);
}

function eventContentScore(touchpoints: UnifiedTouchpoint[]): number {
  let score = 0;
  const hasEvent = touchpoints.some(tp => tp.channel === 'event');
  const hasWebinar = touchpoints.some(tp => tp.channel === 'webinar');
  const hasContentDownload = touchpoints.some(tp => tp.channel === 'content_download');
  const hasPricingVisit = touchpoints.some(tp => tp.page_url === '/pricing/');
  const hasROICalc = touchpoints.some(tp =>
    tp.content_asset?.toLowerCase().includes('roi') || tp.page_url === '/roi-calculator/'
  );
  const hasDemoRequest = touchpoints.some(tp =>
    tp.activity_type === 'form_fill' && (tp.page_url?.includes('demo') || tp.interaction_detail?.includes('demo'))
  );

  if (hasEvent) score += 20;
  if (hasWebinar) score += 15;
  if (hasContentDownload) score += 15;
  if (hasPricingVisit) score += 20;
  if (hasROICalc) score += 15;
  if (hasDemoRequest) score += 15;

  return Math.min(100, score);
}

// ---- Risk Factor Detection ----

function detectRiskFactors(
  account: EnrichedAccount,
  daysSinceLastTouch: number,
): RiskFactor[] {
  const risks: RiskFactor[] = [];

  if (daysSinceLastTouch > 21) {
    risks.push({
      label: 'Gone dark',
      severity: daysSinceLastTouch > 30 ? 'high' : 'medium',
      description: `No engagement for ${daysSinceLastTouch} days`,
    });
  }

  if (account.touchpoints.length <= 2) {
    risks.push({
      label: 'Low engagement',
      severity: 'high',
      description: `Only ${account.touchpoints.length} touchpoints — well below average`,
    });
  }

  const channels = new Set(account.touchpoints.map(tp => tp.channel));
  if (channels.size <= 1) {
    risks.push({
      label: 'Single channel',
      severity: 'medium',
      description: 'Engagement limited to one channel — no multi-channel reinforcement',
    });
  }

  const hasNoEvent = !account.touchpoints.some(tp => tp.channel === 'event' || tp.channel === 'webinar');
  if (hasNoEvent && account.touchpoints.length >= 3) {
    risks.push({
      label: 'Missing events',
      severity: 'low',
      description: 'No event or webinar attendance — a key conversion signal',
    });
  }

  const hasNoBDR = !account.touchpoints.some(tp =>
    tp.channel === 'bdr_call' || tp.channel === 'bdr_email' || tp.channel === 'bdr_linkedin'
  );
  if (hasNoBDR) {
    risks.push({
      label: 'No outbound',
      severity: 'low',
      description: 'No BDR/SDR engagement — may need human touch',
    });
  }

  return risks;
}

// ---- Pattern Matching ----

function detectMatchingPatterns(
  touchpoints: UnifiedTouchpoint[],
): { wonPatterns: string[]; lostPatterns: string[] } {
  const channels = touchpoints.map(tp => tp.channel);
  const wonPatterns: string[] = [];
  const lostPatterns: string[] = [];

  // Won pattern A indicators: LinkedIn → Event → Pricing → Form
  const hasLinkedIn = channels.includes('linkedin_ads');
  const hasEvent = channels.includes('event');
  const hasPricing = touchpoints.some(tp => tp.page_url === '/pricing/');
  const hasForm = channels.includes('form_submission');
  if (hasLinkedIn && hasEvent && hasPricing) {
    wonPatterns.push('Pattern A: Paid → Event → Pricing');
  }

  // Won pattern B: Content → Webinar → BDR → Pricing
  const hasContent = channels.includes('content_download');
  const hasWebinar = channels.includes('webinar');
  const hasBDR = channels.includes('bdr_email') || channels.includes('bdr_call');
  if (hasContent && hasWebinar && hasBDR) {
    wonPatterns.push('Pattern B: Content → Webinar → BDR');
  }

  // Won pattern C: BDR → Nurture → Event → Form
  const hasNurture = channels.includes('email_nurture');
  if (hasBDR && hasNurture && hasEvent) {
    wonPatterns.push('Pattern C: BDR → Nurture → Event');
  }

  // Lost pattern indicators
  if (channels.length <= 2 && !hasEvent && !hasWebinar) {
    lostPatterns.push('Low engagement — matches lost deal profile');
  }
  const newsletterOnly = channels.every(ch => ch === 'email_newsletter' || ch === 'email_nurture');
  if (newsletterOnly && channels.length >= 2) {
    lostPatterns.push('Newsletter-only — passive engagement');
  }

  return { wonPatterns, lostPatterns };
}

// ---- Main Scoring Function ----

export function scoreAllOpenDeals(
  accounts: EnrichedAccount[],
  referenceDate: string = '2026-01-31',
): DealScore[] {
  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');
  const openAccounts = accounts.filter(a => a.stage !== 'closed_won' && a.stage !== 'closed_lost');

  if (openAccounts.length === 0) return [];

  // Build reference profiles from won deals
  const wonChannelProfile = new Map<EnrichedChannel, number>();
  let wonTotalTouches = 0;
  for (const acc of wonAccounts) {
    wonTotalTouches += acc.touchpoints.length;
    for (const tp of acc.touchpoints) {
      wonChannelProfile.set(tp.channel, (wonChannelProfile.get(tp.channel) || 0) + 1);
    }
  }
  const wonAvgTouches = wonAccounts.length > 0 ? wonTotalTouches / wonAccounts.length : 8;

  // Median days per stage for won deals
  const wonDaysPerStage = new Map<string, number[]>();
  for (const acc of wonAccounts) {
    for (const sh of acc.stage_history) {
      if (!wonDaysPerStage.has(sh.stage)) wonDaysPerStage.set(sh.stage, []);
      wonDaysPerStage.get(sh.stage)!.push(sh.days_in_stage);
    }
  }
  const wonMedianDaysPerStage = new Map<string, number>();
  for (const [stage, days] of wonDaysPerStage) {
    const sorted = [...days].sort((a, b) => a - b);
    wonMedianDaysPerStage.set(stage, sorted[Math.floor(sorted.length / 2)]);
  }

  // Win/loss signals
  const winLossSignals = calculateWinLossSignals(accounts);
  const topWinSignals = winLossSignals
    .filter(s => s.lift_ratio > 1)
    .sort((a, b) => b.lift_ratio - a.lift_ratio)
    .map(s => ({
      touchpoint_descriptor: s.touchpoint_descriptor,
      touchpoint_type: s.touchpoint_type,
      lift_ratio: s.lift_ratio,
    }));

  const refDate = new Date(referenceDate);

  return openAccounts.map(account => {
    const touchpoints = account.touchpoints;
    const dealChannels = new Set(touchpoints.map(tp => tp.channel));

    // Days since last touch
    const lastTouchDate = touchpoints.length > 0
      ? new Date(touchpoints[touchpoints.length - 1].date)
      : new Date(account.created_date);
    const daysSinceLastTouch = Math.floor((refDate.getTime() - lastTouchDate.getTime()) / 86400000);

    // Score components
    const components: ScoreComponent[] = [
      {
        factor: 'Channel Diversity',
        weight: 0.20,
        score: Math.round(channelDiversityScore(dealChannels, wonChannelProfile)),
        detail: `${dealChannels.size} channels engaged (won avg: ${Math.round(wonChannelProfile.size * 0.6)})`,
      },
      {
        factor: 'Touchpoint Volume',
        weight: 0.15,
        score: Math.round(touchpointCountScore(touchpoints.length, wonAvgTouches)),
        detail: `${touchpoints.length} touches (won avg: ${Math.round(wonAvgTouches)})`,
      },
      {
        factor: 'Win Signals',
        weight: 0.25,
        score: Math.round(winSignalScore(touchpoints, topWinSignals)),
        detail: `Matches ${Math.round(winSignalScore(touchpoints, topWinSignals) / 10)}/10 top signals`,
      },
      {
        factor: 'Velocity',
        weight: 0.15,
        score: Math.round(velocityScore(account, wonMedianDaysPerStage)),
        detail: `Stage progression vs won deal median`,
      },
      {
        factor: 'Recency',
        weight: 0.10,
        score: Math.round(recencyScore(daysSinceLastTouch)),
        detail: `Last touch ${daysSinceLastTouch}d ago`,
      },
      {
        factor: 'Event & Content',
        weight: 0.15,
        score: Math.round(eventContentScore(touchpoints)),
        detail: `High-value engagement signals`,
      },
    ];

    const probability = Math.round(
      components.reduce((sum, c) => sum + c.score * c.weight, 0)
    );

    // Confidence based on data quality
    const confidence: 'high' | 'medium' | 'low' =
      touchpoints.length >= 6 ? 'high' :
      touchpoints.length >= 3 ? 'medium' : 'low';

    // Risk factors
    const riskFactors = detectRiskFactors(account, daysSinceLastTouch);

    // Pattern matching
    const { wonPatterns, lostPatterns } = detectMatchingPatterns(touchpoints);

    // Trend (simplified: based on recent vs older touchpoint density)
    const midpoint = touchpoints.length > 1
      ? new Date(touchpoints[Math.floor(touchpoints.length / 2)].date)
      : refDate;
    const recentTouches = touchpoints.filter(tp => new Date(tp.date) > midpoint).length;
    const olderTouches = touchpoints.length - recentTouches;
    const trend = recentTouches > olderTouches + 1 ? 'improving' as const :
                  recentTouches < olderTouches - 1 ? 'declining' as const : 'stable' as const;

    return {
      account_id: account.account_id,
      account_name: account.account_name,
      opportunity_id: account.opportunity_id,
      deal_amount: account.deal_amount,
      stage: account.stage,
      product_line: account.product_line,
      probability,
      confidence,
      score_components: components,
      risk_factors: riskFactors,
      matching_won_patterns: wonPatterns,
      matching_lost_patterns: lostPatterns,
      trend,
      days_since_last_touch: daysSinceLastTouch,
    };
  }).sort((a, b) => b.probability - a.probability);
}
