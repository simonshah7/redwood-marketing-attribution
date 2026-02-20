// ============================================================
// ATTRIBUTION EXPLORER — Analysis Logic
// Implements the 6 business questions from spec2
// ============================================================

import type { UnifiedTouchpoint, EnrichedAccount } from './enriched-data';

// ---- Q1: Page Influence ----

export interface PageInfluence {
  page_url: string;
  page_title: string;
  visit_count: number;
  unique_opps: number;
  pipeline_influenced: number;
  revenue_influenced: number;
  influence_score: number;
  avg_position_in_journey: number;
  conversion_rate: number;
}

export function calculatePageInfluence(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
): PageInfluence[] {
  const pageVisits = touchpoints.filter(t => t.activity_type === 'page_visit' && t.page_url);
  const totalOpps = new Set(accounts.map(a => a.opportunity_id)).size;

  const grouped = new Map<string, {
    page_title: string;
    visits: number;
    opp_ids: Set<string>;
    positions: number[];
  }>();

  for (const t of pageVisits) {
    const url = t.page_url!;
    if (!grouped.has(url)) {
      grouped.set(url, { page_title: t.page_title || url, visits: 0, opp_ids: new Set(), positions: [] });
    }
    const g = grouped.get(url)!;
    g.visits++;
    g.opp_ids.add(t.opportunity_id);

    // Calculate position in journey
    const acc = accounts.find(a => a.opportunity_id === t.opportunity_id);
    if (acc && acc.touchpoints.length > 1) {
      const idx = acc.touchpoints.findIndex(tp => tp.touchpoint_id === t.touchpoint_id);
      if (idx >= 0) g.positions.push(idx / (acc.touchpoints.length - 1));
    }
  }

  const results: PageInfluence[] = [];

  for (const [url, g] of grouped) {
    const oppIds = Array.from(g.opp_ids);
    const matchedAccounts = accounts.filter(a => oppIds.includes(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const revenue = matchedAccounts.filter(a => a.stage === 'closed_won').reduce((s, a) => s + a.deal_amount, 0);
    const passedDisco = matchedAccounts.filter(a =>
      ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'].includes(a.stage),
    ).length;

    results.push({
      page_url: url,
      page_title: g.page_title,
      visit_count: g.visits,
      unique_opps: g.opp_ids.size,
      pipeline_influenced: pipeline,
      revenue_influenced: revenue,
      influence_score: pipeline * (g.opp_ids.size / Math.max(totalOpps, 1)),
      avg_position_in_journey: g.positions.length > 0
        ? g.positions.reduce((a, b) => a + b, 0) / g.positions.length
        : 0.5,
      conversion_rate: g.opp_ids.size > 0 ? passedDisco / g.opp_ids.size : 0,
    });
  }

  return results.sort((a, b) => b.influence_score - a.influence_score);
}

// ---- Q2: Content Impact ----

export interface ContentImpact {
  content_asset: string;
  asset_type: string;
  interaction_count: number;
  unique_opps: number;
  pipeline_influenced: number;
  revenue_influenced: number;
  influence_score: number;
  avg_position_in_journey: number;
  appears_in_won_pct: number;
  appears_in_lost_pct: number;
}

export function calculateContentImpact(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
): ContentImpact[] {
  const contentTouches = touchpoints.filter(t => t.content_asset);
  const totalOpps = new Set(accounts.map(a => a.opportunity_id)).size;
  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');

  const grouped = new Map<string, {
    asset_type: string;
    count: number;
    opp_ids: Set<string>;
    positions: number[];
  }>();

  for (const t of contentTouches) {
    const asset = t.content_asset!;
    if (!grouped.has(asset)) {
      grouped.set(asset, { asset_type: t.asset_type || 'unknown', count: 0, opp_ids: new Set(), positions: [] });
    }
    const g = grouped.get(asset)!;
    g.count++;
    g.opp_ids.add(t.opportunity_id);

    const acc = accounts.find(a => a.opportunity_id === t.opportunity_id);
    if (acc && acc.touchpoints.length > 1) {
      const idx = acc.touchpoints.findIndex(tp => tp.touchpoint_id === t.touchpoint_id);
      if (idx >= 0) g.positions.push(idx / (acc.touchpoints.length - 1));
    }
  }

  const results: ContentImpact[] = [];

  for (const [asset, g] of grouped) {
    const oppIds = Array.from(g.opp_ids);
    const matchedAccounts = accounts.filter(a => oppIds.includes(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const revenue = matchedAccounts.filter(a => a.stage === 'closed_won').reduce((s, a) => s + a.deal_amount, 0);
    const wonWith = wonAccounts.filter(a => oppIds.includes(a.opportunity_id)).length;
    const lostWith = lostAccounts.filter(a => oppIds.includes(a.opportunity_id)).length;

    results.push({
      content_asset: asset,
      asset_type: g.asset_type,
      interaction_count: g.count,
      unique_opps: g.opp_ids.size,
      pipeline_influenced: pipeline,
      revenue_influenced: revenue,
      influence_score: pipeline * (g.opp_ids.size / Math.max(totalOpps, 1)),
      avg_position_in_journey: g.positions.length > 0
        ? g.positions.reduce((a, b) => a + b, 0) / g.positions.length
        : 0.5,
      appears_in_won_pct: wonAccounts.length > 0 ? wonWith / wonAccounts.length : 0,
      appears_in_lost_pct: lostAccounts.length > 0 ? lostWith / lostAccounts.length : 0,
    });
  }

  return results.sort((a, b) => b.influence_score - a.influence_score);
}

// ---- Q3: Win/Loss Signals ----

export interface WinLossSignal {
  touchpoint_descriptor: string;
  touchpoint_type: string;
  won_deals_with: number;
  won_deals_total: number;
  won_pct: number;
  lost_deals_with: number;
  lost_deals_total: number;
  lost_pct: number;
  lift_ratio: number;
  statistical_significance: boolean;
  confidence_level: 'high' | 'moderate' | 'low';
}

/**
 * Chi-squared test for a 2x2 contingency table (approximation of Fisher's exact test).
 *
 *                | Has touchpoint | Doesn't have |
 *   Won deals    | a              | b            |
 *   Lost deals   | c              | d            |
 *
 * Returns { chi2, pValue, significant, confidenceLevel }.
 */
function chiSquared2x2(
  a: number, b: number, c: number, d: number,
): { chi2: number; pValue: number; significant: boolean; confidenceLevel: 'high' | 'moderate' | 'low' } {
  const n = a + b + c + d;
  const rowA = a + b;
  const rowB = c + d;
  const colA = a + c;
  const colB = b + d;

  // Guard against division by zero (any marginal total is 0)
  if (n === 0 || rowA === 0 || rowB === 0 || colA === 0 || colB === 0) {
    return { chi2: 0, pValue: 1, significant: false, confidenceLevel: 'low' };
  }

  const chi2 = (n * (a * d - b * c) ** 2) / (rowA * rowB * colA * colB);

  // Approximate p-value from chi-squared with 1 degree of freedom
  let pValue: number;
  if (chi2 >= 6.64) {
    pValue = 0.009; // p < 0.01
  } else if (chi2 >= 3.84) {
    pValue = 0.04; // p < 0.05
  } else if (chi2 >= 2.71) {
    pValue = 0.09; // p < 0.10
  } else {
    pValue = 0.5; // p >= 0.10 (not significant)
  }

  const significant = pValue < 0.1;
  const confidenceLevel: 'high' | 'moderate' | 'low' =
    pValue < 0.05 ? 'high' : pValue < 0.1 ? 'moderate' : 'low';

  return { chi2, pValue, significant, confidenceLevel };
}

export function calculateWinLossSignals(accounts: EnrichedAccount[]): WinLossSignal[] {
  const wonAccounts = accounts.filter(a => a.stage === 'closed_won');
  const lostAccounts = accounts.filter(a => a.stage === 'closed_lost');

  if (wonAccounts.length === 0 || lostAccounts.length === 0) return [];

  // Build descriptor → account presence map
  function getDescriptors(acc: EnrichedAccount): Map<string, string> {
    const descriptors = new Map<string, string>();
    for (const t of acc.touchpoints) {
      // By campaign
      if (t.campaign_name) descriptors.set(`Campaign: ${t.campaign_name}`, 'campaign');
      // By event
      if (t.event_name) descriptors.set(`Event: ${t.event_name}`, 'event');
      // By content
      if (t.content_asset) descriptors.set(`Content: ${t.content_asset}`, 'content');
      // By page
      if (t.page_url) descriptors.set(`Page: ${t.page_url}`, 'page');
      // By BDR sequence
      if (t.bdr_sequence) descriptors.set(`Sequence: ${t.bdr_sequence}`, 'bdr_sequence');
      // By channel
      descriptors.set(`Channel: ${t.channel}`, 'channel');
      // By activity type
      descriptors.set(`Activity: ${t.activity_type}`, 'activity');
    }
    return descriptors;
  }

  // Collect all unique descriptors
  const allDescriptors = new Map<string, string>();
  [...wonAccounts, ...lostAccounts].forEach(acc => {
    const d = getDescriptors(acc);
    d.forEach((type, key) => allDescriptors.set(key, type));
  });

  const results: WinLossSignal[] = [];

  for (const [descriptor, type] of allDescriptors) {
    const wonWith = wonAccounts.filter(a => {
      const d = getDescriptors(a);
      return d.has(descriptor);
    }).length;
    const lostWith = lostAccounts.filter(a => {
      const d = getDescriptors(a);
      return d.has(descriptor);
    }).length;

    const wonPct = wonWith / wonAccounts.length;
    const lostPct = lostWith / lostAccounts.length;
    const liftRatio = lostPct > 0 ? wonPct / lostPct : wonPct > 0 ? 10 : 1;

    const a = wonWith;
    const b = wonAccounts.length - wonWith;
    const c = lostWith;
    const d = lostAccounts.length - lostWith;
    const { significant, confidenceLevel } = chiSquared2x2(a, b, c, d);

    results.push({
      touchpoint_descriptor: descriptor,
      touchpoint_type: type,
      won_deals_with: wonWith,
      won_deals_total: wonAccounts.length,
      won_pct: wonPct,
      lost_deals_with: lostWith,
      lost_deals_total: lostAccounts.length,
      lost_pct: lostPct,
      lift_ratio: liftRatio,
      statistical_significance: significant,
      confidence_level: confidenceLevel,
    });
  }

  return results.sort((a, b) => b.lift_ratio - a.lift_ratio);
}

// ---- Q4: First Touch Origins ----

export interface FirstTouchOrigin {
  first_touchpoint: string;
  touchpoint_type: string;
  channel: string;
  specific_detail: string;
  opp_count: number;
  pipeline_generated: number;
  revenue_generated: number;
  avg_time_to_pipeline: number;
  conversion_rate: number;
}

export function calculateFirstTouchOrigins(accounts: EnrichedAccount[]): FirstTouchOrigin[] {
  const grouped = new Map<string, {
    touchpoint_type: string;
    channel: string;
    specific_detail: string;
    opps: EnrichedAccount[];
  }>();

  for (const acc of accounts) {
    if (acc.touchpoints.length === 0) continue;
    const first = acc.touchpoints[0];

    // Build a specific descriptor for this first touch
    let descriptor: string;
    let detail: string;
    if (first.campaign_name) {
      descriptor = `Ad: ${first.ad_creative || first.campaign_name}`;
      detail = first.ad_creative || first.campaign_name;
    } else if (first.event_name) {
      descriptor = `Event: ${first.event_name}`;
      detail = first.event_name;
    } else if (first.content_asset) {
      descriptor = `Content: ${first.content_asset}`;
      detail = first.content_asset;
    } else if (first.bdr_sequence) {
      descriptor = `BDR: ${first.bdr_sequence}`;
      detail = first.bdr_sequence;
    } else if (first.page_url) {
      descriptor = `Page: ${first.page_url}`;
      detail = first.page_title || first.page_url;
    } else if (first.email_name) {
      descriptor = `Email: ${first.email_name}`;
      detail = first.email_name;
    } else {
      descriptor = `${first.channel}: ${first.interaction_detail}`;
      detail = first.interaction_detail;
    }

    if (!grouped.has(descriptor)) {
      grouped.set(descriptor, {
        touchpoint_type: first.activity_type,
        channel: first.channel,
        specific_detail: detail,
        opps: [],
      });
    }
    grouped.get(descriptor)!.opps.push(acc);
  }

  const results: FirstTouchOrigin[] = [];

  for (const [key, g] of grouped) {
    const pipeline = g.opps.reduce((s, a) => s + a.deal_amount, 0);
    const revenue = g.opps.filter(a => a.stage === 'closed_won').reduce((s, a) => s + a.deal_amount, 0);
    const passedDisco = g.opps.filter(a =>
      ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'].includes(a.stage),
    ).length;

    // Avg time from first touch to opp creation
    const timeToPipeline = g.opps.map(a => {
      if (a.touchpoints.length === 0) return 0;
      const firstDate = new Date(a.touchpoints[0].date).getTime();
      const createDate = new Date(a.created_date).getTime();
      return Math.max(0, (createDate - firstDate) / 86400000);
    });

    results.push({
      first_touchpoint: key,
      touchpoint_type: g.touchpoint_type,
      channel: g.channel,
      specific_detail: g.specific_detail,
      opp_count: g.opps.length,
      pipeline_generated: pipeline,
      revenue_generated: revenue,
      avg_time_to_pipeline: timeToPipeline.length > 0
        ? timeToPipeline.reduce((a, b) => a + b, 0) / timeToPipeline.length
        : 0,
      conversion_rate: g.opps.length > 0 ? passedDisco / g.opps.length : 0,
    });
  }

  return results.sort((a, b) => b.pipeline_generated - a.pipeline_generated);
}

// ---- Q5: BDR Effectiveness ----

export interface BDRSequenceEffectiveness {
  sequence_name: string;
  total_prospects_enrolled: number;
  prospects_replied: number;
  prospects_meeting_booked: number;
  prospects_converted_to_opp: number;
  pipeline_generated: number;
  revenue_generated: number;
  reply_rate: number;
  meeting_rate: number;
  opp_conversion_rate: number;
  avg_steps_to_reply: number;
  best_performing_step: {
    step_number: number;
    step_type: string;
    reply_rate: number;
  };
}

export function calculateBDREffectiveness(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
): BDRSequenceEffectiveness[] {
  const bdrTouches = touchpoints.filter(t => t.source_system === 'outreach' && t.bdr_sequence);

  const grouped = new Map<string, UnifiedTouchpoint[]>();
  for (const t of bdrTouches) {
    const seq = t.bdr_sequence!;
    if (!grouped.has(seq)) grouped.set(seq, []);
    grouped.get(seq)!.push(t);
  }

  const results: BDRSequenceEffectiveness[] = [];

  for (const [seqName, touches] of grouped) {
    const uniqueAccounts = new Set(touches.map(t => t.opportunity_id));
    const enrolled = uniqueAccounts.size;

    const replied = new Set(
      touches.filter(t => t.bdr_outcome === 'replied' || t.bdr_outcome === 'connected')
        .map(t => t.opportunity_id),
    ).size;

    // Meeting = connected call or replied email
    const meetingBooked = new Set(
      touches.filter(t => t.bdr_outcome === 'connected' || t.bdr_outcome === 'replied')
        .map(t => t.opportunity_id),
    ).size;

    const convertedOpps = new Set(
      touches.filter(t => {
        const acc = accounts.find(a => a.opportunity_id === t.opportunity_id);
        return acc && ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'].includes(acc.stage);
      }).map(t => t.opportunity_id),
    );

    const matchedAccounts = accounts.filter(a => uniqueAccounts.has(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const revenue = matchedAccounts.filter(a => a.stage === 'closed_won').reduce((s, a) => s + a.deal_amount, 0);

    // Step-level analysis
    const stepStats = new Map<number, { total: number; replies: number; type: string }>();
    for (const t of touches) {
      const step = t.bdr_step_number || 1;
      if (!stepStats.has(step)) stepStats.set(step, { total: 0, replies: 0, type: t.bdr_step_type || 'email' });
      const s = stepStats.get(step)!;
      s.total++;
      if (t.bdr_outcome === 'replied' || t.bdr_outcome === 'connected') s.replies++;
    }

    let bestStep = { step_number: 1, step_type: 'email', reply_rate: 0 };
    for (const [stepNum, stats] of stepStats) {
      const rate = stats.total > 0 ? stats.replies / stats.total : 0;
      if (rate > bestStep.reply_rate) {
        bestStep = { step_number: stepNum, step_type: stats.type, reply_rate: rate };
      }
    }

    // Avg steps to reply
    const replySteps = touches
      .filter(t => t.bdr_outcome === 'replied' || t.bdr_outcome === 'connected')
      .map(t => t.bdr_step_number || 1);
    const avgSteps = replySteps.length > 0 ? replySteps.reduce((a, b) => a + b, 0) / replySteps.length : 0;

    results.push({
      sequence_name: seqName,
      total_prospects_enrolled: enrolled,
      prospects_replied: replied,
      prospects_meeting_booked: meetingBooked,
      prospects_converted_to_opp: convertedOpps.size,
      pipeline_generated: pipeline,
      revenue_generated: revenue,
      reply_rate: enrolled > 0 ? replied / enrolled : 0,
      meeting_rate: enrolled > 0 ? meetingBooked / enrolled : 0,
      opp_conversion_rate: enrolled > 0 ? convertedOpps.size / enrolled : 0,
      avg_steps_to_reply: avgSteps,
      best_performing_step: bestStep,
    });
  }

  return results.sort((a, b) => b.pipeline_generated - a.pipeline_generated);
}

// ---- Q6: Winning Sequences (Pattern Mining) ----

export interface WinningSequence {
  sequence_pattern: string[];
  pattern_label: string;
  occurrence_count: number;
  pipeline_value: number;
  won_count: number;
  lost_count: number;
  win_rate: number;
  avg_journey_duration_days: number;
  avg_touchpoints_total: number;
}

function simplifyChannel(channel: string): string {
  const map: Record<string, string> = {
    linkedin_ads: 'LinkedIn Ad',
    organic_social: 'Organic Social',
    email_nurture: 'Email Nurture',
    email_newsletter: 'Newsletter',
    web_visit: 'Web Visit',
    form_submission: 'Form Fill',
    event: 'Event',
    webinar: 'Webinar',
    bdr_email: 'BDR Email',
    bdr_call: 'BDR Call',
    bdr_linkedin: 'BDR LinkedIn',
    content_download: 'Content DL',
  };
  return map[channel] || channel;
}

export function findWinningSequences(accounts: EnrichedAccount[]): WinningSequence[] {
  // Extract simplified sequences for each account
  const accountSequences = accounts
    .filter(a => a.touchpoints.length >= 2)
    .map(a => ({
      account: a,
      simplified: a.touchpoints.map(t => simplifyChannel(t.channel)),
    }));

  // Find common subsequences of length 2, 3, 4
  const patternCounts = new Map<string, {
    accounts: EnrichedAccount[];
    pattern: string[];
  }>();

  for (const { account, simplified } of accountSequences) {
    const seen = new Set<string>(); // Avoid counting same pattern twice per account
    for (let len = 2; len <= Math.min(4, simplified.length); len++) {
      for (let i = 0; i <= simplified.length - len; i++) {
        const subseq = simplified.slice(i, i + len);
        // Deduplicate consecutive same-channel touches
        const deduped: string[] = [];
        for (const s of subseq) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== s) deduped.push(s);
        }
        if (deduped.length < 2) continue;

        const key = deduped.join(' → ');
        if (seen.has(key)) continue;
        seen.add(key);

        if (!patternCounts.has(key)) {
          patternCounts.set(key, { accounts: [], pattern: deduped });
        }
        patternCounts.get(key)!.accounts.push(account);
      }
    }
  }

  const results: WinningSequence[] = [];

  for (const [label, { accounts: matchedAccounts, pattern }] of patternCounts) {
    if (matchedAccounts.length < 2) continue; // Need at least 2 occurrences

    const wonCount = matchedAccounts.filter(a => a.stage === 'closed_won').length;
    const lostCount = matchedAccounts.filter(a => a.stage === 'closed_lost').length;
    const decidedCount = wonCount + lostCount;
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);

    const durations = matchedAccounts.map(a => {
      if (a.touchpoints.length < 2) return 0;
      const first = new Date(a.touchpoints[0].date).getTime();
      const last = new Date(a.touchpoints[a.touchpoints.length - 1].date).getTime();
      return (last - first) / 86400000;
    });

    const avgTouches = matchedAccounts.reduce((s, a) => s + a.touchpoints.length, 0) / matchedAccounts.length;

    results.push({
      sequence_pattern: pattern,
      pattern_label: label,
      occurrence_count: matchedAccounts.length,
      pipeline_value: pipeline,
      won_count: wonCount,
      lost_count: lostCount,
      win_rate: decidedCount > 0 ? wonCount / decidedCount : 0,
      avg_journey_duration_days: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      avg_touchpoints_total: avgTouches,
    });
  }

  // Rank by combination of occurrence_count * win_rate * pipeline_value
  return results
    .sort((a, b) => {
      const scoreA = a.occurrence_count * a.win_rate * a.pipeline_value;
      const scoreB = b.occurrence_count * b.win_rate * b.pipeline_value;
      return scoreB - scoreA;
    })
    .slice(0, 15);
}

// ---- Q7: Pre-Meeting Influence (14-day window before opp creation) ----

export interface PreMeetingTouchpoint {
  touchpoint_descriptor: string;
  channel: string;
  activity_type: string;
  frequency: number;
  unique_opps: number;
  pipeline_influenced: number;
  conversion_rate: number;
  avg_days_before_meeting: number;
}

export function calculatePreMeetingInfluence(
  accounts: EnrichedAccount[],
  windowDays: number = 14,
): PreMeetingTouchpoint[] {
  const grouped = new Map<string, {
    channel: string;
    activity_type: string;
    count: number;
    opp_ids: Set<string>;
    days_before: number[];
  }>();

  for (const acc of accounts) {
    const createdDate = new Date(acc.created_date).getTime();
    const windowStart = createdDate - windowDays * 86400000;

    const preMeetingTouches = acc.touchpoints.filter(t => {
      const tDate = new Date(t.date).getTime();
      return tDate >= windowStart && tDate <= createdDate;
    });

    for (const t of preMeetingTouches) {
      let descriptor: string;
      if (t.campaign_name) descriptor = `Ad: ${t.ad_creative || t.campaign_name}`;
      else if (t.event_name) descriptor = `Event: ${t.event_name}`;
      else if (t.content_asset) descriptor = `Content: ${t.content_asset}`;
      else if (t.bdr_sequence) descriptor = `BDR: ${t.bdr_step_type} (Step ${t.bdr_step_number})`;
      else if (t.page_url) descriptor = `Page: ${t.page_url}`;
      else if (t.email_name) descriptor = `Email: ${t.email_name}`;
      else descriptor = `${simplifyChannel(t.channel)}: ${t.activity_type}`;

      if (!grouped.has(descriptor)) {
        grouped.set(descriptor, {
          channel: t.channel,
          activity_type: t.activity_type,
          count: 0,
          opp_ids: new Set(),
          days_before: [],
        });
      }
      const g = grouped.get(descriptor)!;
      g.count++;
      g.opp_ids.add(acc.opportunity_id);
      const daysBefore = (createdDate - new Date(t.date).getTime()) / 86400000;
      g.days_before.push(daysBefore);
    }
  }

  const convertedStages = ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'];
  const results: PreMeetingTouchpoint[] = [];

  for (const [desc, g] of grouped) {
    const oppIds = Array.from(g.opp_ids);
    const matchedAccounts = accounts.filter(a => oppIds.includes(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const converted = matchedAccounts.filter(a => convertedStages.includes(a.stage)).length;

    results.push({
      touchpoint_descriptor: desc,
      channel: g.channel,
      activity_type: g.activity_type,
      frequency: g.count,
      unique_opps: g.opp_ids.size,
      pipeline_influenced: pipeline,
      conversion_rate: g.opp_ids.size > 0 ? converted / g.opp_ids.size : 0,
      avg_days_before_meeting: g.days_before.length > 0
        ? g.days_before.reduce((a, b) => a + b, 0) / g.days_before.length
        : 0,
    });
  }

  return results.sort((a, b) => {
    const scoreA = a.frequency * a.pipeline_influenced;
    const scoreB = b.frequency * b.pipeline_influenced;
    return scoreB - scoreA;
  });
}

// ---- Q8: ABM-to-Outbound Pipeline ----

export interface ABMToOutbound {
  abm_touchpoint: string;
  channel: string;
  followed_by_outbound: number;
  total_occurrences: number;
  outbound_success_rate: number;
  pipeline_generated: number;
  avg_days_to_outbound: number;
}

export function calculateABMToOutbound(
  accounts: EnrichedAccount[],
): ABMToOutbound[] {
  const abmChannels = ['linkedin_ads', 'organic_social'];
  const outboundChannels = ['bdr_email', 'bdr_call', 'bdr_linkedin'];
  const successOutcomes = ['connected', 'replied', 'connection_accepted', 'message_replied'];

  const grouped = new Map<string, {
    channel: string;
    total: number;
    followed_by_outbound: number;
    outbound_succeeded: number;
    days_to_outbound: number[];
    opp_ids_succeeded: Set<string>;
  }>();

  for (const acc of accounts) {
    for (let i = 0; i < acc.touchpoints.length; i++) {
      const t = acc.touchpoints[i];
      if (!abmChannels.includes(t.channel)) continue;

      let descriptor: string;
      if (t.ad_creative) descriptor = `Ad: ${t.ad_creative}`;
      else if (t.campaign_name) descriptor = `Campaign: ${t.campaign_name}`;
      else if (t.social_post_type) descriptor = `Organic: ${t.social_post_type}`;
      else descriptor = `${simplifyChannel(t.channel)}: ${t.activity_type}`;

      if (!grouped.has(descriptor)) {
        grouped.set(descriptor, {
          channel: t.channel,
          total: 0,
          followed_by_outbound: 0,
          outbound_succeeded: 0,
          days_to_outbound: [],
          opp_ids_succeeded: new Set(),
        });
      }
      const g = grouped.get(descriptor)!;
      g.total++;

      // Look for outbound touch after this ABM touch
      const nextOutbound = acc.touchpoints.slice(i + 1).find(nt =>
        outboundChannels.includes(nt.channel),
      );
      if (nextOutbound) {
        g.followed_by_outbound++;
        const daysDiff = (new Date(nextOutbound.date).getTime() - new Date(t.date).getTime()) / 86400000;
        g.days_to_outbound.push(daysDiff);

        if (nextOutbound.bdr_outcome && successOutcomes.includes(nextOutbound.bdr_outcome)) {
          g.outbound_succeeded++;
          g.opp_ids_succeeded.add(acc.opportunity_id);
        }
      }
    }
  }

  const results: ABMToOutbound[] = [];
  for (const [desc, g] of grouped) {
    if (g.total < 1) continue;
    const matchedAccounts = accounts.filter(a => g.opp_ids_succeeded.has(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);

    results.push({
      abm_touchpoint: desc,
      channel: g.channel,
      followed_by_outbound: g.followed_by_outbound,
      total_occurrences: g.total,
      outbound_success_rate: g.followed_by_outbound > 0 ? g.outbound_succeeded / g.followed_by_outbound : 0,
      pipeline_generated: pipeline,
      avg_days_to_outbound: g.days_to_outbound.length > 0
        ? g.days_to_outbound.reduce((a, b) => a + b, 0) / g.days_to_outbound.length
        : 0,
    });
  }

  return results.sort((a, b) => b.pipeline_generated - a.pipeline_generated);
}

// ---- Q9: Deal Velocity Paths ----

export interface DealVelocityPath {
  segment: 'fast' | 'slow';
  pattern_label: string;
  sequence_pattern: string[];
  occurrence_count: number;
  pipeline_value: number;
  avg_days_to_close: number;
  avg_touchpoints: number;
}

export interface DealVelocityComparison {
  fast_deals: DealVelocityPath[];
  slow_deals: DealVelocityPath[];
  differentiating_touchpoints: { touchpoint: string; fast_pct: number; slow_pct: number; lift: number }[];
  median_days: number;
}

export function calculateDealVelocityPaths(accounts: EnrichedAccount[]): DealVelocityComparison {
  // Only look at closed or advanced deals
  const closedOrAdvanced = accounts.filter(a =>
    ['closed_won', 'negotiation', 'eval_planning', 'solution_accepted'].includes(a.stage) &&
    a.touchpoints.length >= 2,
  );

  if (closedOrAdvanced.length === 0) {
    return { fast_deals: [], slow_deals: [], differentiating_touchpoints: [], median_days: 0 };
  }

  // Calculate deal velocity (days from first touch to current stage)
  const withVelocity = closedOrAdvanced.map(a => {
    const first = new Date(a.touchpoints[0].date).getTime();
    const lastStage = a.stage_history[a.stage_history.length - 1];
    const stageDate = new Date(lastStage.entered_date).getTime();
    return { account: a, days: Math.max(1, (stageDate - first) / 86400000) };
  });

  withVelocity.sort((a, b) => a.days - b.days);
  const medianIdx = Math.floor(withVelocity.length / 2);
  const medianDays = withVelocity[medianIdx].days;

  const fastDeals = withVelocity.filter(d => d.days <= medianDays).map(d => d.account);
  const slowDeals = withVelocity.filter(d => d.days > medianDays).map(d => d.account);

  function getPatterns(accs: EnrichedAccount[], segment: 'fast' | 'slow'): DealVelocityPath[] {
    const patternMap = new Map<string, { pattern: string[]; accounts: EnrichedAccount[] }>();

    for (const acc of accs) {
      const simplified = acc.touchpoints.map(t => simplifyChannel(t.channel));
      const seen = new Set<string>();
      for (let len = 2; len <= Math.min(4, simplified.length); len++) {
        for (let i = 0; i <= simplified.length - len; i++) {
          const subseq = simplified.slice(i, i + len);
          const deduped: string[] = [];
          for (const s of subseq) {
            if (deduped.length === 0 || deduped[deduped.length - 1] !== s) deduped.push(s);
          }
          if (deduped.length < 2) continue;
          const key = deduped.join(' → ');
          if (seen.has(key)) continue;
          seen.add(key);
          if (!patternMap.has(key)) patternMap.set(key, { pattern: deduped, accounts: [] });
          patternMap.get(key)!.accounts.push(acc);
        }
      }
    }

    const results: DealVelocityPath[] = [];
    for (const [label, { pattern, accounts: matched }] of patternMap) {
      if (matched.length < 2) continue;
      const pipeline = matched.reduce((s, a) => s + a.deal_amount, 0);
      const avgDays = matched.reduce((s, a) => {
        const first = new Date(a.touchpoints[0].date).getTime();
        const lastStage = a.stage_history[a.stage_history.length - 1];
        return s + (new Date(lastStage.entered_date).getTime() - first) / 86400000;
      }, 0) / matched.length;
      const avgTouches = matched.reduce((s, a) => s + a.touchpoints.length, 0) / matched.length;

      results.push({
        segment,
        pattern_label: label,
        sequence_pattern: pattern,
        occurrence_count: matched.length,
        pipeline_value: pipeline,
        avg_days_to_close: avgDays,
        avg_touchpoints: avgTouches,
      });
    }

    return results
      .sort((a, b) => b.occurrence_count * b.pipeline_value - a.occurrence_count * a.pipeline_value)
      .slice(0, 10);
  }

  // Find differentiating touchpoints
  const allChannels = new Set<string>();
  [...fastDeals, ...slowDeals].forEach(a =>
    a.touchpoints.forEach(t => allChannels.add(simplifyChannel(t.channel))),
  );

  const diffs: { touchpoint: string; fast_pct: number; slow_pct: number; lift: number }[] = [];
  for (const ch of allChannels) {
    const fastWith = fastDeals.filter(a => a.touchpoints.some(t => simplifyChannel(t.channel) === ch)).length;
    const slowWith = slowDeals.filter(a => a.touchpoints.some(t => simplifyChannel(t.channel) === ch)).length;
    const fastPct = fastDeals.length > 0 ? fastWith / fastDeals.length : 0;
    const slowPct = slowDeals.length > 0 ? slowWith / slowDeals.length : 0;
    const lift = slowPct > 0 ? fastPct / slowPct : fastPct > 0 ? 5 : 1;
    diffs.push({ touchpoint: ch, fast_pct: fastPct, slow_pct: slowPct, lift });
  }
  diffs.sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1));

  return {
    fast_deals: getPatterns(fastDeals, 'fast'),
    slow_deals: getPatterns(slowDeals, 'slow'),
    differentiating_touchpoints: diffs,
    median_days: medianDays,
  };
}

// ---- Q10: Creative Performance ----

export interface CreativePerformance {
  creative_name: string;
  creative_type: 'paid_social' | 'organic_social' | 'digital_creative';
  channel: string;
  impression_count: number;
  click_count: number;
  unique_opps: number;
  pipeline_influenced: number;
  meeting_conversion_rate: number;
  total_spend: number;
  cost_per_meeting: number;
}

export function calculateCreativePerformance(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
): CreativePerformance[] {
  const socialChannels = ['linkedin_ads', 'organic_social'];
  const socialTouches = touchpoints.filter(t => socialChannels.includes(t.channel));

  const grouped = new Map<string, {
    creative_type: 'paid_social' | 'organic_social' | 'digital_creative';
    channel: string;
    impressions: number;
    clicks: number;
    opp_ids: Set<string>;
    spend: number;
  }>();

  for (const t of socialTouches) {
    let name: string;
    let creativeType: 'paid_social' | 'organic_social' | 'digital_creative';

    if (t.channel === 'organic_social') {
      name = t.social_post_type || 'Organic Post';
      creativeType = 'organic_social';
    } else if (t.ad_creative) {
      name = t.ad_creative;
      creativeType = t.ad_format === 'Video' ? 'digital_creative' : 'paid_social';
    } else if (t.campaign_name) {
      name = t.campaign_name;
      creativeType = 'paid_social';
    } else {
      continue;
    }

    if (!grouped.has(name)) {
      grouped.set(name, {
        creative_type: creativeType,
        channel: t.channel,
        impressions: 0,
        clicks: 0,
        opp_ids: new Set(),
        spend: 0,
      });
    }
    const g = grouped.get(name)!;
    if (t.activity_type === 'ad_impression' || t.activity_type === 'social_engagement') g.impressions++;
    if (t.activity_type === 'ad_click') g.clicks++;
    g.opp_ids.add(t.opportunity_id);
    if (t.spend) g.spend += t.spend;
  }

  const convertedStages = ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'];
  const results: CreativePerformance[] = [];

  for (const [name, g] of grouped) {
    const oppIds = Array.from(g.opp_ids);
    const matchedAccounts = accounts.filter(a => oppIds.includes(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const meetings = matchedAccounts.filter(a => convertedStages.includes(a.stage)).length;

    results.push({
      creative_name: name,
      creative_type: g.creative_type,
      channel: g.channel,
      impression_count: g.impressions,
      click_count: g.clicks,
      unique_opps: g.opp_ids.size,
      pipeline_influenced: pipeline,
      meeting_conversion_rate: g.opp_ids.size > 0 ? meetings / g.opp_ids.size : 0,
      total_spend: g.spend,
      cost_per_meeting: meetings > 0 ? g.spend / meetings : 0,
    });
  }

  return results.sort((a, b) => b.pipeline_influenced - a.pipeline_influenced);
}

// ---- Q11: First Touch by Product (Frequency-focused) ----

export interface FirstTouchByProduct {
  first_touchpoint: string;
  channel: string;
  frequency: number;
  pipeline_generated: number;
  revenue_generated: number;
  conversion_rate: number;
  product_line: string;
}

export function calculateFirstTouchByProduct(accounts: EnrichedAccount[]): FirstTouchByProduct[] {
  const grouped = new Map<string, {
    channel: string;
    opps: EnrichedAccount[];
    product_line: string;
  }>();

  for (const acc of accounts) {
    if (acc.touchpoints.length === 0) continue;
    const first = acc.touchpoints[0];

    let descriptor: string;
    if (first.campaign_name) descriptor = `Ad: ${first.ad_creative || first.campaign_name}`;
    else if (first.event_name) descriptor = `Event: ${first.event_name}`;
    else if (first.content_asset) descriptor = `Content: ${first.content_asset}`;
    else if (first.bdr_sequence) descriptor = `BDR: ${first.bdr_sequence}`;
    else if (first.page_url) descriptor = `Page: ${first.page_url}`;
    else if (first.email_name) descriptor = `Email: ${first.email_name}`;
    else if (first.social_post_type) descriptor = `Organic: ${first.social_post_type}`;
    else descriptor = `${simplifyChannel(first.channel)}: ${first.interaction_detail}`;

    const key = `${descriptor}||${acc.product_line}`;
    if (!grouped.has(key)) {
      grouped.set(key, { channel: first.channel, opps: [], product_line: acc.product_line });
    }
    grouped.get(key)!.opps.push(acc);
  }

  const convertedStages = ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'];
  const results: FirstTouchByProduct[] = [];

  for (const [key, g] of grouped) {
    const descriptor = key.split('||')[0];
    const pipeline = g.opps.reduce((s, a) => s + a.deal_amount, 0);
    const revenue = g.opps.filter(a => a.stage === 'closed_won').reduce((s, a) => s + a.deal_amount, 0);
    const converted = g.opps.filter(a => convertedStages.includes(a.stage)).length;

    results.push({
      first_touchpoint: descriptor,
      channel: g.channel,
      frequency: g.opps.length,
      pipeline_generated: pipeline,
      revenue_generated: revenue,
      conversion_rate: g.opps.length > 0 ? converted / g.opps.length : 0,
      product_line: g.product_line,
    });
  }

  return results.sort((a, b) => b.frequency - a.frequency);
}

// ---- Q12: BDR Effectiveness by Product ----

export interface BDRByProduct {
  sequence_name: string;
  product_line: string;
  enrolled: number;
  replied: number;
  meetings_booked: number;
  pipeline_generated: number;
  reply_rate: number;
  meeting_rate: number;
  avg_steps_to_reply: number;
}

export function calculateBDRByProduct(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
): BDRByProduct[] {
  const bdrTouches = touchpoints.filter(t => t.source_system === 'outreach' && t.bdr_sequence);

  const grouped = new Map<string, { touches: UnifiedTouchpoint[]; product: string }>();
  for (const t of bdrTouches) {
    const key = `${t.bdr_sequence}||${t.product_line}`;
    if (!grouped.has(key)) grouped.set(key, { touches: [], product: t.product_line });
    grouped.get(key)!.touches.push(t);
  }

  const results: BDRByProduct[] = [];

  for (const [key, { touches, product }] of grouped) {
    const seqName = key.split('||')[0];
    const uniqueOpps = new Set(touches.map(t => t.opportunity_id));
    const enrolled = uniqueOpps.size;
    const repliedOpps = new Set(
      touches.filter(t => t.bdr_outcome === 'replied' || t.bdr_outcome === 'connected')
        .map(t => t.opportunity_id),
    );
    const meetingOpps = new Set(
      touches.filter(t => t.bdr_outcome === 'connected' || t.bdr_outcome === 'replied')
        .map(t => t.opportunity_id),
    );

    const matchedAccounts = accounts.filter(a => uniqueOpps.has(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);

    const replySteps = touches
      .filter(t => t.bdr_outcome === 'replied' || t.bdr_outcome === 'connected')
      .map(t => t.bdr_step_number || 1);
    const avgSteps = replySteps.length > 0 ? replySteps.reduce((a, b) => a + b, 0) / replySteps.length : 0;

    results.push({
      sequence_name: seqName,
      product_line: product,
      enrolled,
      replied: repliedOpps.size,
      meetings_booked: meetingOpps.size,
      pipeline_generated: pipeline,
      reply_rate: enrolled > 0 ? repliedOpps.size / enrolled : 0,
      meeting_rate: enrolled > 0 ? meetingOpps.size / enrolled : 0,
      avg_steps_to_reply: avgSteps,
    });
  }

  return results.sort((a, b) => b.pipeline_generated - a.pipeline_generated);
}

// ---- Q13: Paid Media ROI by Ad Account ----

export interface PaidMediaROI {
  ad_account_id: string;
  ad_account_name: string;
  total_spend: number;
  impressions: number;
  clicks: number;
  unique_opps: number;
  pipeline_influenced: number;
  revenue_generated: number;
  roas: number;
  cost_per_opp: number;
  cost_per_pipeline_dollar: number;
}

export function calculatePaidMediaROI(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
): PaidMediaROI[] {
  const paidTouches = touchpoints.filter(t =>
    t.channel === 'linkedin_ads' && t.ad_account_id,
  );

  const grouped = new Map<string, {
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    opp_ids: Set<string>;
  }>();

  for (const t of paidTouches) {
    const id = t.ad_account_id!;
    if (!grouped.has(id)) {
      grouped.set(id, {
        name: t.ad_account_name || id,
        spend: 0,
        impressions: 0,
        clicks: 0,
        opp_ids: new Set(),
      });
    }
    const g = grouped.get(id)!;
    if (t.spend) g.spend += t.spend;
    if (t.activity_type === 'ad_impression') g.impressions++;
    if (t.activity_type === 'ad_click') g.clicks++;
    g.opp_ids.add(t.opportunity_id);
  }

  const results: PaidMediaROI[] = [];

  for (const [id, g] of grouped) {
    const oppIds = Array.from(g.opp_ids);
    const matchedAccounts = accounts.filter(a => oppIds.includes(a.opportunity_id));
    const pipeline = matchedAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const revenue = matchedAccounts.filter(a => a.stage === 'closed_won').reduce((s, a) => s + a.deal_amount, 0);

    results.push({
      ad_account_id: id,
      ad_account_name: g.name,
      total_spend: g.spend,
      impressions: g.impressions,
      clicks: g.clicks,
      unique_opps: g.opp_ids.size,
      pipeline_influenced: pipeline,
      revenue_generated: revenue,
      roas: g.spend > 0 ? revenue / g.spend : 0,
      cost_per_opp: g.opp_ids.size > 0 ? g.spend / g.opp_ids.size : 0,
      cost_per_pipeline_dollar: pipeline > 0 ? g.spend / pipeline : 0,
    });
  }

  return results.sort((a, b) => b.pipeline_influenced - a.pipeline_influenced);
}

// ---- Q14: Conversion Effort (Touch Count Analysis) ----

export interface ConversionEffort {
  dimension_label: string;
  dimension_type: 'overall' | 'region' | 'industry' | 'segment';
  avg_touches_to_convert: number;
  median_touches: number;
  touch_type_breakdown: { channel: string; avg_count: number }[];
  opp_count: number;
  avg_pipeline: number;
}

export function calculateConversionEffort(accounts: EnrichedAccount[]): ConversionEffort[] {
  const convertedStages = ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'];
  const converted = accounts.filter(a => convertedStages.includes(a.stage) && a.touchpoints.length > 0);

  function computeForGroup(label: string, dimType: 'overall' | 'region' | 'industry' | 'segment', accs: EnrichedAccount[]): ConversionEffort | null {
    if (accs.length === 0) return null;

    const touchCounts = accs.map(a => a.touchpoints.length);
    touchCounts.sort((a, b) => a - b);
    const avg = touchCounts.reduce((a, b) => a + b, 0) / touchCounts.length;
    const median = touchCounts[Math.floor(touchCounts.length / 2)];

    // Channel breakdown
    const channelTotals = new Map<string, number>();
    for (const acc of accs) {
      const channelCounts = new Map<string, number>();
      for (const t of acc.touchpoints) {
        const ch = simplifyChannel(t.channel);
        channelCounts.set(ch, (channelCounts.get(ch) || 0) + 1);
      }
      for (const [ch, count] of channelCounts) {
        channelTotals.set(ch, (channelTotals.get(ch) || 0) + count);
      }
    }

    const breakdown = Array.from(channelTotals.entries())
      .map(([ch, total]) => ({ channel: ch, avg_count: total / accs.length }))
      .sort((a, b) => b.avg_count - a.avg_count);

    const avgPipeline = accs.reduce((s, a) => s + a.deal_amount, 0) / accs.length;

    return {
      dimension_label: label,
      dimension_type: dimType,
      avg_touches_to_convert: avg,
      median_touches: median,
      touch_type_breakdown: breakdown,
      opp_count: accs.length,
      avg_pipeline: avgPipeline,
    };
  }

  const results: ConversionEffort[] = [];

  // Overall
  const overall = computeForGroup('Overall', 'overall', converted);
  if (overall) results.push(overall);

  // By region
  const regions = new Set(converted.map(a => a.region));
  for (const region of regions) {
    const r = computeForGroup(region, 'region', converted.filter(a => a.region === region));
    if (r) results.push(r);
  }

  // By industry
  const industries = new Set(converted.map(a => a.industry));
  for (const industry of industries) {
    const r = computeForGroup(industry, 'industry', converted.filter(a => a.industry === industry));
    if (r) results.push(r);
  }

  // By segment
  const segments = new Set(converted.map(a => a.segment));
  for (const segment of segments) {
    const r = computeForGroup(segment, 'segment', converted.filter(a => a.segment === segment));
    if (r) results.push(r);
  }

  return results;
}

// ---- Q15: Marketing + xDR Interaction Combos ----

export interface MarketingXDRCombo {
  combo_label: string;
  marketing_steps: string[];
  xdr_steps: string[];
  occurrence_count: number;
  pipeline_value: number;
  won_count: number;
  conversion_probability: number;
  avg_days_to_convert: number;
}

export function calculateMarketingXDRCombos(accounts: EnrichedAccount[]): MarketingXDRCombo[] {
  const marketingChannels = ['linkedin_ads', 'organic_social', 'email_nurture', 'email_newsletter', 'web_visit', 'form_submission', 'event', 'webinar', 'content_download'];
  const xdrChannels = ['bdr_email', 'bdr_call', 'bdr_linkedin'];

  const patternMap = new Map<string, {
    marketing: string[];
    xdr: string[];
    accounts: EnrichedAccount[];
  }>();

  for (const acc of accounts) {
    if (acc.touchpoints.length < 2) continue;

    // Collect unique marketing and xDR channels in this journey
    const mktChannels: string[] = [];
    const xdrSteps: string[] = [];

    for (const t of acc.touchpoints) {
      const simplified = simplifyChannel(t.channel);
      if (marketingChannels.includes(t.channel)) {
        if (!mktChannels.includes(simplified)) mktChannels.push(simplified);
      }
      if (xdrChannels.includes(t.channel)) {
        if (!xdrSteps.includes(simplified)) xdrSteps.push(simplified);
      }
    }

    if (mktChannels.length === 0 || xdrSteps.length === 0) continue;

    // Generate combos of 1-2 marketing + 1 xDR steps
    for (let mi = 0; mi < mktChannels.length; mi++) {
      for (const xdr of xdrSteps) {
        const comboKey = `${mktChannels[mi]} + ${xdr}`;
        if (!patternMap.has(comboKey)) {
          patternMap.set(comboKey, { marketing: [mktChannels[mi]], xdr: [xdr], accounts: [] });
        }
        patternMap.get(comboKey)!.accounts.push(acc);

        // Also try pairs of marketing channels
        for (let mj = mi + 1; mj < Math.min(mktChannels.length, mi + 3); mj++) {
          const combo2Key = `${mktChannels[mi]} + ${mktChannels[mj]} + ${xdr}`;
          if (!patternMap.has(combo2Key)) {
            patternMap.set(combo2Key, {
              marketing: [mktChannels[mi], mktChannels[mj]],
              xdr: [xdr],
              accounts: [],
            });
          }
          patternMap.get(combo2Key)!.accounts.push(acc);
        }
      }
    }
  }

  const convertedStages = ['solution_accepted', 'eval_planning', 'negotiation', 'closed_won'];
  const results: MarketingXDRCombo[] = [];

  for (const [label, { marketing, xdr, accounts: matched }] of patternMap) {
    // Deduplicate accounts (same account can appear multiple times)
    const uniqueAccounts = Array.from(new Map(matched.map(a => [a.opportunity_id, a])).values());
    if (uniqueAccounts.length < 2) continue;

    const pipeline = uniqueAccounts.reduce((s, a) => s + a.deal_amount, 0);
    const wonCount = uniqueAccounts.filter(a => a.stage === 'closed_won').length;
    const convertedCount = uniqueAccounts.filter(a => convertedStages.includes(a.stage)).length;

    const durations = uniqueAccounts.map(a => {
      if (a.touchpoints.length < 2) return 0;
      const first = new Date(a.touchpoints[0].date).getTime();
      const last = new Date(a.touchpoints[a.touchpoints.length - 1].date).getTime();
      return (last - first) / 86400000;
    });
    const avgDays = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    results.push({
      combo_label: label,
      marketing_steps: marketing,
      xdr_steps: xdr,
      occurrence_count: uniqueAccounts.length,
      pipeline_value: pipeline,
      won_count: wonCount,
      conversion_probability: uniqueAccounts.length > 0 ? convertedCount / uniqueAccounts.length : 0,
      avg_days_to_convert: avgDays,
    });
  }

  return results
    .sort((a, b) => {
      const scoreA = a.occurrence_count * a.conversion_probability * a.pipeline_value;
      const scoreB = b.occurrence_count * b.conversion_probability * b.pipeline_value;
      return scoreB - scoreA;
    })
    .slice(0, 20);
}

// ---- A2: Velocity Impact ----

export interface VelocityImpact {
  touchpoint: string;
  avg_days_with: number;
  avg_days_without: number;
  velocity_delta_days: number;
  velocity_delta_pct: number;
  sufficient_data: boolean;
}

export function calculateVelocityImpact(
  touchpoints: UnifiedTouchpoint[],
  accounts: EnrichedAccount[],
  descriptorFn: (t: UnifiedTouchpoint) => string | null,
): VelocityImpact[] {
  // Collect unique touchpoint descriptors
  const descriptorAccounts = new Map<string, Set<string>>();

  for (const t of touchpoints) {
    const desc = descriptorFn(t);
    if (!desc) continue;
    if (!descriptorAccounts.has(desc)) descriptorAccounts.set(desc, new Set());
    descriptorAccounts.get(desc)!.add(t.opportunity_id);
  }

  function avgDaysToCurrentStage(accs: EnrichedAccount[]): number {
    if (accs.length === 0) return 0;
    const days = accs.map((a) => {
      const created = new Date(a.created_date).getTime();
      const lastStage = a.stage_history[a.stage_history.length - 1];
      const stageDate = new Date(lastStage.entered_date).getTime();
      return Math.max(0, (stageDate - created) / 86400000);
    });
    return days.reduce((s, d) => s + d, 0) / days.length;
  }

  const allOppIds = new Set(accounts.map((a) => a.opportunity_id));
  const results: VelocityImpact[] = [];

  for (const [desc, oppIds] of descriptorAccounts) {
    const withAccounts = accounts.filter((a) => oppIds.has(a.opportunity_id));
    const withoutAccounts = accounts.filter((a) => !oppIds.has(a.opportunity_id));

    const sufficient = withAccounts.length >= 3 && withoutAccounts.length >= 3;
    const avgWith = avgDaysToCurrentStage(withAccounts);
    const avgWithout = avgDaysToCurrentStage(withoutAccounts);
    const deltaDays = avgWithout - avgWith;
    const deltaPct = avgWithout > 0 ? (deltaDays / avgWithout) * 100 : 0;

    results.push({
      touchpoint: desc,
      avg_days_with: avgWith,
      avg_days_without: avgWithout,
      velocity_delta_days: deltaDays,
      velocity_delta_pct: deltaPct,
      sufficient_data: sufficient,
    });
  }

  return results;
}

// ---- A3: Stage Transition Filter ----

export function filterTouchpointsByStageTransition(
  account: EnrichedAccount,
  targetStage: string,
  windowDays: number = 30,
): UnifiedTouchpoint[] {
  // Find when the account entered the target stage
  const stageEntry = account.stage_history.find((s) => s.stage === targetStage);
  if (!stageEntry) return [];

  const enteredDate = new Date(stageEntry.entered_date).getTime();
  const windowStart = enteredDate - windowDays * 86400000;

  return account.touchpoints.filter((t) => {
    const tDate = new Date(t.date).getTime();
    return tDate >= windowStart && tDate <= enteredDate;
  });
}

export function applyStageTransitionFilter(
  accounts: EnrichedAccount[],
  targetStage: string,
  windowDays: number = 30,
): { accounts: EnrichedAccount[]; touchpoints: UnifiedTouchpoint[] } {
  if (targetStage === 'all') {
    return {
      accounts,
      touchpoints: accounts.flatMap((a) => a.touchpoints),
    };
  }

  const filteredAccounts: EnrichedAccount[] = [];
  const filteredTouchpoints: UnifiedTouchpoint[] = [];

  for (const acc of accounts) {
    const reached = acc.stage_history.some((s) => s.stage === targetStage);
    if (!reached) continue;

    const windowTouchpoints = filterTouchpointsByStageTransition(acc, targetStage, windowDays);
    if (windowTouchpoints.length > 0) {
      filteredAccounts.push({ ...acc, touchpoints: windowTouchpoints });
      filteredTouchpoints.push(...windowTouchpoints);
    }
  }

  return { accounts: filteredAccounts, touchpoints: filteredTouchpoints };
}
