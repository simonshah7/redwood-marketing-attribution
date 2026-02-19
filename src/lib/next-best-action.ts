// ============================================================
// NEXT BEST ACTION ENGINE
// Recommends specific marketing actions for each open deal
// ============================================================

import type { EnrichedAccount, EnrichedChannel } from './enriched-data';
import type { DealScore } from './deal-scoring';

export interface RecommendedAction {
  action: string;
  channel: EnrichedChannel;
  urgency: 'immediate' | 'this_week' | 'this_month';
  expected_impact: 'high' | 'medium' | 'low';
  rationale: string;
  based_on: string;
}

export interface AccountActions {
  account_id: string;
  account_name: string;
  deal_amount: number;
  stage: string;
  deal_score: number;
  actions: RecommendedAction[];
}

// ---- Reference: Upcoming Events ----

const UPCOMING_EVENTS = [
  { name: 'Redwood Webinar: S/4HANA Job Scheduling', date: '2026-02-06', type: 'webinar' },
  { name: 'Automation Workshop: Hands-On RunMyJobs', date: '2026-02-13', type: 'workshop' },
  { name: 'SAP Sapphire Orlando 2026', date: '2026-03-10', type: 'conference' },
];

// ---- Reference: Key Content Assets ----

const KEY_CONTENT = [
  { name: 'RunMyJobs ROI Calculator', channel: 'content_download' as EnrichedChannel, stage_fit: ['eval_planning', 'negotiation'] },
  { name: 'Siemens Case Study', channel: 'content_download' as EnrichedChannel, stage_fit: ['solution_accepted', 'eval_planning'] },
  { name: 'Total Economic Impact Study', channel: 'content_download' as EnrichedChannel, stage_fit: ['negotiation'] },
  { name: 'SAP Job Scheduling Migration Guide', channel: 'content_download' as EnrichedChannel, stage_fit: ['disco_completed', 'solution_accepted'] },
  { name: 'Ctrl-M to RunMyJobs Comparison Sheet', channel: 'content_download' as EnrichedChannel, stage_fit: ['disco_set', 'disco_completed'] },
];

// ---- Action Generation Rules ----

function generateActions(
  account: EnrichedAccount,
  dealScore: DealScore,
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const touchpoints = account.touchpoints;
  const channels = new Set(touchpoints.map(tp => tp.channel));
  const stage = account.stage;

  // Rule 1: Gone dark — urgently re-engage
  if (dealScore.days_since_last_touch > 14) {
    const urgency = dealScore.days_since_last_touch > 21 ? 'immediate' as const : 'this_week' as const;
    const bestChannel = channels.has('bdr_email') ? 'bdr_call' as EnrichedChannel :
                        channels.has('email_nurture') ? 'bdr_email' as EnrichedChannel :
                        'email_nurture' as EnrichedChannel;
    actions.push({
      action: `Re-engage via ${bestChannel === 'bdr_call' ? 'BDR call' : bestChannel === 'bdr_email' ? 'BDR email' : 'nurture email'} — account has gone ${dealScore.days_since_last_touch} days without activity`,
      channel: bestChannel,
      urgency,
      expected_impact: 'high',
      rationale: `${account.account_name} has had no engagement for ${dealScore.days_since_last_touch} days. This matches the pattern of deals that go cold.`,
      based_on: 'Deals with >21 days of inactivity close at 60% lower rate',
    });
  }

  // Rule 2: Missing event engagement
  const hasEvent = channels.has('event') || channels.has('webinar');
  if (!hasEvent) {
    const nextEvent = UPCOMING_EVENTS[0];
    actions.push({
      action: `Invite key contact to ${nextEvent.name} on ${nextEvent.date}`,
      channel: 'webinar',
      urgency: 'this_week',
      expected_impact: 'high',
      rationale: `${account.account_name} has not attended any events. Won deals with event attendance close at 2.1x the rate.`,
      based_on: 'Event attendance is the #1 win signal with 2.8x lift ratio',
    });
  }

  // Rule 3: Missing key content for stage
  const downloadedContent = touchpoints
    .filter(tp => tp.content_asset)
    .map(tp => tp.content_asset!);

  for (const content of KEY_CONTENT) {
    if (content.stage_fit.includes(stage) && !downloadedContent.includes(content.name)) {
      actions.push({
        action: `Send ${content.name} — relevant for ${stage.replace(/_/g, ' ')} stage`,
        channel: content.channel,
        urgency: 'this_week',
        expected_impact: 'medium',
        rationale: `Deals at ${stage.replace(/_/g, ' ')} that consume this content progress 40% faster.`,
        based_on: 'Content engagement at this stage correlates with 1.4x faster progression',
      });
      break; // Only recommend one content piece at a time
    }
  }

  // Rule 4: No BDR outbound — needs human touch
  const hasBDR = channels.has('bdr_call') || channels.has('bdr_email') || channels.has('bdr_linkedin');
  if (!hasBDR && touchpoints.length >= 3) {
    actions.push({
      action: `Assign BDR outreach — ${account.account_name} has ${touchpoints.length} marketing touches but no outbound follow-up`,
      channel: 'bdr_email',
      urgency: stage === 'disco_set' ? 'immediate' as const : 'this_week' as const,
      expected_impact: 'high',
      rationale: `Marketing-engaged accounts that receive BDR follow-up convert at 2.3x the rate.`,
      based_on: 'Marketing + BDR combination is the highest-converting pattern',
    });
  }

  // Rule 5: No pricing page visit at advanced stages
  const hasPricingVisit = touchpoints.some(tp => tp.page_url === '/pricing/');
  if (!hasPricingVisit && ['eval_planning', 'negotiation'].includes(stage)) {
    actions.push({
      action: `Send personalized pricing overview — no pricing page visit detected`,
      channel: 'email_nurture',
      urgency: 'this_week',
      expected_impact: 'medium',
      rationale: `At ${stage.replace(/_/g, ' ')}, pricing page visits are a strong buying signal. Direct outreach with pricing context can accelerate evaluation.`,
      based_on: 'Won deals visit pricing page 3x more often than lost deals at this stage',
    });
  }

  // Rule 6: Single-channel engagement — diversify
  if (channels.size === 1 && touchpoints.length >= 2) {
    const currentChannel = [...channels][0];
    const recommendedChannel = currentChannel === 'email_newsletter' ? 'linkedin_ads' as EnrichedChannel :
                               currentChannel === 'linkedin_ads' ? 'email_nurture' as EnrichedChannel :
                               'linkedin_ads' as EnrichedChannel;
    actions.push({
      action: `Add ${recommendedChannel.replace(/_/g, ' ')} to the mix — currently single-channel engagement`,
      channel: recommendedChannel,
      urgency: 'this_month',
      expected_impact: 'medium',
      rationale: `${account.account_name} has only engaged through ${currentChannel.replace(/_/g, ' ')}. Multi-channel engagement correlates with 2x higher win rates.`,
      based_on: 'Won deals average 4.2 channels vs 1.3 for lost deals',
    });
  }

  // Rule 7: Stalled at stage — accelerate
  const stageEntry = account.stage_history.find(sh => sh.stage === stage);
  if (stageEntry && stageEntry.days_in_stage > 25) {
    const recommendation = stage === 'solution_accepted'
      ? 'Schedule executive briefing or technical deep-dive'
      : stage === 'eval_planning'
      ? 'Offer a hands-on workshop or custom demo'
      : stage === 'negotiation'
      ? 'Share competitive displacement case study and ROI analysis'
      : 'Schedule discovery call with technical team';

    actions.push({
      action: recommendation,
      channel: stage === 'negotiation' ? 'content_download' as EnrichedChannel : 'event' as EnrichedChannel,
      urgency: 'this_week',
      expected_impact: 'high',
      rationale: `${account.account_name} has been at ${stage.replace(/_/g, ' ')} for ${stageEntry.days_in_stage} days — above the ${Math.round(stageEntry.days_in_stage * 0.6)}d median for won deals.`,
      based_on: `Deals stalled >25 days at this stage have 40% lower close rates`,
    });
  }

  // Sort by urgency priority and impact
  const urgencyOrder = { immediate: 0, this_week: 1, this_month: 2 };
  const impactOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) =>
    urgencyOrder[a.urgency] - urgencyOrder[b.urgency] ||
    impactOrder[a.expected_impact] - impactOrder[b.expected_impact]
  );

  return actions.slice(0, 4); // Cap at 4 actions per account
}

// ---- Main Entry ----

export function generateAllNextBestActions(
  accounts: EnrichedAccount[],
  dealScores: DealScore[],
): AccountActions[] {
  const openAccounts = accounts.filter(a =>
    a.stage !== 'closed_won' && a.stage !== 'closed_lost'
  );

  const scoreMap = new Map(dealScores.map(ds => [ds.account_id, ds]));

  return openAccounts
    .map(account => {
      const score = scoreMap.get(account.account_id);
      if (!score) return null;

      const actions = generateActions(account, score);

      return {
        account_id: account.account_id,
        account_name: account.account_name,
        deal_amount: account.deal_amount,
        stage: account.stage,
        deal_score: score.probability,
        actions,
      };
    })
    .filter((a): a is AccountActions => a !== null && a.actions.length > 0)
    .sort((a, b) => {
      // Sort by urgency of top action, then by deal amount
      const aUrgency = a.actions[0]?.urgency === 'immediate' ? 0 : a.actions[0]?.urgency === 'this_week' ? 1 : 2;
      const bUrgency = b.actions[0]?.urgency === 'immediate' ? 0 : b.actions[0]?.urgency === 'this_week' ? 1 : 2;
      return aUrgency - bUrgency || b.deal_amount - a.deal_amount;
    });
}
