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
      statistical_significance: wonWith >= 3 && lostWith >= 1,
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
