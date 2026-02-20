import { type Account, type Channel, CHANNEL_KEYS } from './data';

// ============================================================
// Attribution Model Types & Configuration — SPEC3 A1
// ============================================================

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'markov' | 'w_shaped';

export interface AttributionModelInfo {
  id: AttributionModel;
  label: string;
  description: string;
}

export const ATTRIBUTION_MODELS: AttributionModelInfo[] = [
  { id: 'first_touch', label: 'First Touch', description: '100% credit to the first interaction. Shows which channels create awareness.' },
  { id: 'last_touch', label: 'Last Touch', description: '100% credit to the final interaction. Shows which channels convert.' },
  { id: 'linear', label: 'Multi-Touch (Linear)', description: 'Equal credit to all touchpoints. Shows overall channel contribution.' },
  { id: 'time_decay', label: 'Multi-Touch (Time-Decay)', description: 'More credit to recent touchpoints. Shows what\'s accelerating deals right now.' },
  { id: 'position_based', label: 'Multi-Touch (Position-Based)', description: '40% first touch, 40% last touch, 20% distributed across middle. Balances sourcing and conversion.' },
  { id: 'markov', label: 'Data-Driven (Markov)', description: 'Probabilistic model using channel removal effects. Shows each channel\'s true incremental impact.' },
  { id: 'w_shaped', label: 'W-Shaped', description: '30% first touch, 30% lead creation, 30% opportunity creation, 10% middle. Emphasizes key conversion milestones.' },
];

export interface AttributionResult {
  revenue: number;
  opps: number;
  pipeline: number;
}

// ============================================================
// Attribution Model Implementations
// ============================================================

export function firstTouchAttribution(data: Account[]): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });
  data.forEach(d => {
    if (d.touches.length > 0) {
      const ft = d.touches[0].channel;
      result[ft].pipeline += d.deal;
      result[ft].opps += 1;
      if (d.stage === 'closed_won') result[ft].revenue += d.deal;
    }
  });
  return result as Record<Channel, AttributionResult>;
}

export function lastTouchAttribution(data: Account[]): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });
  data.forEach(d => {
    if (d.touches.length > 0) {
      const lt = d.touches[d.touches.length - 1].channel;
      result[lt].pipeline += d.deal;
      result[lt].opps += 1;
      if (d.stage === 'closed_won') result[lt].revenue += d.deal;
    }
  });
  return result as Record<Channel, AttributionResult>;
}

export function multiTouchAttribution(data: Account[]): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });
  data.forEach(d => {
    if (d.touches.length > 0) {
      const channelTouches: Record<string, number> = {};
      d.touches.forEach(t => { channelTouches[t.channel] = (channelTouches[t.channel] || 0) + 1; });
      const total = d.touches.length;
      Object.entries(channelTouches).forEach(([ch, count]) => {
        const weight = count / total;
        result[ch].pipeline += d.deal * weight;
        result[ch].opps += weight;
        if (d.stage === 'closed_won') result[ch].revenue += d.deal * weight;
      });
    }
  });
  return result as Record<Channel, AttributionResult>;
}

// ============================================================
// Time-Decay Attribution — SPEC3 A1
// More credit to recent touchpoints. Half-life of 30 days.
// ============================================================

export function timeDecayAttribution(data: Account[], halfLifeDays: number = 30): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });

  data.forEach(d => {
    if (d.touches.length === 0) return;

    // Reference point: latest touchpoint date
    const latestDate = d.touches.reduce((max, t) => {
      const tDate = new Date(t.date).getTime();
      return tDate > max ? tDate : max;
    }, 0);

    // Calculate raw weights
    const weights: { channel: Channel; weight: number }[] = d.touches.map(t => {
      const daysBefore = (latestDate - new Date(t.date).getTime()) / 86400000;
      const weight = Math.pow(2, -daysBefore / halfLifeDays);
      return { channel: t.channel, weight };
    });

    // Normalize
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
    if (totalWeight === 0) return;

    // Aggregate by channel
    const channelWeights: Record<string, number> = {};
    weights.forEach(w => {
      const normalized = w.weight / totalWeight;
      channelWeights[w.channel] = (channelWeights[w.channel] || 0) + normalized;
    });

    Object.entries(channelWeights).forEach(([ch, weight]) => {
      result[ch].pipeline += d.deal * weight;
      result[ch].opps += weight;
      if (d.stage === 'closed_won') result[ch].revenue += d.deal * weight;
    });
  });

  return result as Record<Channel, AttributionResult>;
}

// ============================================================
// Position-Based Attribution — SPEC3 A1
// 40% first, 40% last, 20% distributed across middle
// ============================================================

export function positionBasedAttribution(
  data: Account[],
  firstWeight: number = 0.4,
  lastWeight: number = 0.4,
  middleWeight: number = 0.2,
): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });

  data.forEach(d => {
    if (d.touches.length === 0) return;

    const channelWeights: Record<string, number> = {};

    if (d.touches.length === 1) {
      // Single touchpoint gets 100%
      channelWeights[d.touches[0].channel] = 1.0;
    } else if (d.touches.length === 2) {
      // Two touchpoints: 50/50
      channelWeights[d.touches[0].channel] = (channelWeights[d.touches[0].channel] || 0) + 0.5;
      channelWeights[d.touches[1].channel] = (channelWeights[d.touches[1].channel] || 0) + 0.5;
    } else {
      // First touch
      channelWeights[d.touches[0].channel] = (channelWeights[d.touches[0].channel] || 0) + firstWeight;
      // Last touch
      channelWeights[d.touches[d.touches.length - 1].channel] = (channelWeights[d.touches[d.touches.length - 1].channel] || 0) + lastWeight;
      // Middle touches split the middleWeight equally
      const middleCount = d.touches.length - 2;
      const perMiddle = middleWeight / middleCount;
      for (let i = 1; i < d.touches.length - 1; i++) {
        channelWeights[d.touches[i].channel] = (channelWeights[d.touches[i].channel] || 0) + perMiddle;
      }
    }

    Object.entries(channelWeights).forEach(([ch, weight]) => {
      result[ch].pipeline += d.deal * weight;
      result[ch].opps += weight;
      if (d.stage === 'closed_won') result[ch].revenue += d.deal * weight;
    });
  });

  return result as Record<Channel, AttributionResult>;
}

// ============================================================
// Markov Chain Attribution — Data-Driven via Removal Effect
// Builds a transition matrix between channels, then computes
// the conversion probability with vs without each channel.
// Enhanced with path frequency analysis for small datasets.
// ============================================================

export function markovAttribution(data: Account[]): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });

  // Build transition counts: from → to (including "start" and "conversion"/"null" states)
  const transitions = new Map<string, Map<string, number>>();

  function addTransition(from: string, to: string) {
    if (!transitions.has(from)) transitions.set(from, new Map());
    const row = transitions.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  // Build paths from account journeys
  for (const account of data) {
    if (account.touches.length === 0) continue;
    const channels = account.touches.map(t => t.channel);
    const isConversion = account.stage === 'closed_won';
    const endState = isConversion ? 'conversion' : 'null';

    addTransition('start', channels[0]);
    for (let i = 0; i < channels.length - 1; i++) {
      addTransition(channels[i], channels[i + 1]);
    }
    addTransition(channels[channels.length - 1], endState);
  }

  // All states (channels + start + conversion + null)
  const allStates = new Set<string>(['start', 'conversion', 'null']);
  for (const [from, row] of transitions) {
    allStates.add(from);
    for (const to of row.keys()) allStates.add(to);
  }
  const states = Array.from(allStates);

  // Calculate total conversion rate via absorption probability
  function computeConversionRate(removedChannel?: Channel): number {
    // Build transient states (everything except conversion and null)
    const transient = states.filter(s => s !== 'conversion' && s !== 'null');
    const n = transient.length;
    const stateIdx = new Map(transient.map((s, i) => [s, i]));

    // Build transition sub-matrix Q (transient→transient)
    // and absorption vector R (transient→conversion)
    const Q: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const R: number[] = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      const from = transient[i];
      if (from === removedChannel) {
        // Removed channel redirects to null (absorbing non-conversion)
        continue; // Q row stays 0, R stays 0 → absorbed into null
      }
      const row = transitions.get(from);
      if (!row) continue;
      const total = Array.from(row.values()).reduce((s, v) => s + v, 0);
      if (total === 0) continue;

      for (const [to, count] of row) {
        if (to === removedChannel) continue; // skip transitions to removed
        const prob = count / total;
        if (to === 'conversion') {
          R[i] += prob;
        } else if (to !== 'null') {
          const j = stateIdx.get(to);
          if (j !== undefined) Q[i][j] += prob;
        }
      }
    }

    // Solve (I - Q) * absorption = R via iterative method
    // absorption[i] = probability of reaching conversion from state i
    const absorption = Array(n).fill(0);
    for (let iter = 0; iter < 100; iter++) {
      let maxDelta = 0;
      for (let i = 0; i < n; i++) {
        let newVal = R[i];
        for (let j = 0; j < n; j++) {
          newVal += Q[i][j] * absorption[j];
        }
        maxDelta = Math.max(maxDelta, Math.abs(newVal - absorption[i]));
        absorption[i] = newVal;
      }
      if (maxDelta < 1e-10) break;
    }

    // Return absorption probability from start state
    const startIdx = stateIdx.get('start');
    return startIdx !== undefined ? absorption[startIdx] : 0;
  }

  const baseConversionRate = computeConversionRate();

  // Compute removal effect for each channel
  const removalEffects: Record<string, number> = {};
  let totalRemovalEffect = 0;

  for (const ch of CHANNEL_KEYS) {
    const removedRate = computeConversionRate(ch);
    const effect = Math.max(0, baseConversionRate - removedRate);
    removalEffects[ch] = effect;
    totalRemovalEffect += effect;
  }

  // ── Path frequency analysis ──────────────────────────────
  // Measures how much each channel participates in converting
  // vs non-converting journeys. Produces differentiated weights
  // even when removal effects are small (common in small datasets).
  const pathFreq: Record<string, number> = {};
  CHANNEL_KEYS.forEach(ch => { pathFreq[ch] = 0; });

  const wonAccounts = data.filter(a => a.stage === 'closed_won');
  const lostAccounts = data.filter(a => a.stage === 'closed_lost');
  const totalAccounts = data.length;

  for (const ch of CHANNEL_KEYS) {
    // Frequency in winning paths
    const wonWithCh = wonAccounts.filter(a => a.touches.some(t => t.channel === ch)).length;
    const wonRate = wonAccounts.length > 0 ? wonWithCh / wonAccounts.length : 0;

    // Frequency in losing paths
    const lostWithCh = lostAccounts.filter(a => a.touches.some(t => t.channel === ch)).length;
    const lostRate = lostAccounts.length > 0 ? lostWithCh / lostAccounts.length : 0;

    // Touch density in winning paths (avg touches per won account)
    const wonTouchDensity = wonAccounts.length > 0
      ? wonAccounts.reduce((s, a) => s + a.touches.filter(t => t.channel === ch).length, 0) / wonAccounts.length
      : 0;
    const overallTouchDensity = totalAccounts > 0
      ? data.reduce((s, a) => s + a.touches.filter(t => t.channel === ch).length, 0) / totalAccounts
      : 0;

    // Score: win-rate lift × touch density lift
    const winLift = wonRate - lostRate; // negative = more in losing, positive = more in winning
    const densityLift = overallTouchDensity > 0 ? wonTouchDensity / overallTouchDensity : 1;
    pathFreq[ch] = Math.max(0.01, (1 + winLift) * densityLift);
  }

  const totalPathFreq = Object.values(pathFreq).reduce((s, v) => s + v, 0);

  // ── Blend removal effects with path frequency ────────────
  // Use 60% removal effect + 40% path frequency when removal
  // effects exist; 100% path frequency as fallback.
  const blendedWeights: Record<string, number> = {};
  const removalShare = totalRemovalEffect > 1e-8 ? 0.6 : 0;
  const freqShare = 1 - removalShare;

  for (const ch of CHANNEL_KEYS) {
    const removalNorm = totalRemovalEffect > 0 ? removalEffects[ch] / totalRemovalEffect : 0;
    const freqNorm = totalPathFreq > 0 ? pathFreq[ch] / totalPathFreq : 1 / CHANNEL_KEYS.length;
    blendedWeights[ch] = removalShare * removalNorm + freqShare * freqNorm;
  }

  // Distribute pipeline/revenue based on blended weights per account
  for (const account of data) {
    if (account.touches.length === 0) continue;
    const accountChannels = new Set(account.touches.map(t => t.channel));

    // Per-account: weight by global Markov weight × local touch count
    let accountTotal = 0;
    const channelScores: Record<string, number> = {};
    for (const ch of accountChannels) {
      const touchCount = account.touches.filter(t => t.channel === ch).length;
      channelScores[ch] = blendedWeights[ch] * touchCount;
      accountTotal += channelScores[ch];
    }
    if (accountTotal === 0) continue;

    for (const ch of accountChannels) {
      const weight = channelScores[ch] / accountTotal;
      result[ch].pipeline += account.deal * weight;
      result[ch].opps += weight;
      if (account.stage === 'closed_won') result[ch].revenue += account.deal * weight;
    }
  }

  return result as Record<Channel, AttributionResult>;
}

// ============================================================
// W-Shaped Attribution
// 30% first touch, 30% lead-creation touch, 30% opp-creation touch, 10% middle
// Lead-creation = touchpoint closest to 40% of journey
// Opp-creation = touchpoint closest to 80% of journey
// ============================================================

export function wShapedAttribution(data: Account[]): Record<Channel, AttributionResult> {
  const result: Record<string, AttributionResult> = {};
  CHANNEL_KEYS.forEach(ch => { result[ch] = { revenue: 0, opps: 0, pipeline: 0 }; });

  data.forEach(d => {
    if (d.touches.length === 0) return;

    const channelWeights: Record<string, number> = {};

    if (d.touches.length === 1) {
      channelWeights[d.touches[0].channel] = 1.0;
    } else if (d.touches.length === 2) {
      channelWeights[d.touches[0].channel] = (channelWeights[d.touches[0].channel] || 0) + 0.5;
      channelWeights[d.touches[1].channel] = (channelWeights[d.touches[1].channel] || 0) + 0.5;
    } else if (d.touches.length === 3) {
      // Each key milestone gets 33.3%
      for (const t of d.touches) {
        channelWeights[t.channel] = (channelWeights[t.channel] || 0) + 1 / 3;
      }
    } else {
      const n = d.touches.length;
      const firstIdx = 0;
      const lastIdx = n - 1;
      // Lead creation ~ 40% through journey, Opp creation ~ 80%
      const leadIdx = Math.round(n * 0.4);
      const oppIdx = Math.round(n * 0.8);

      // Assign 30% to each milestone
      channelWeights[d.touches[firstIdx].channel] = (channelWeights[d.touches[firstIdx].channel] || 0) + 0.30;
      channelWeights[d.touches[leadIdx].channel] = (channelWeights[d.touches[leadIdx].channel] || 0) + 0.30;
      channelWeights[d.touches[oppIdx].channel] = (channelWeights[d.touches[oppIdx].channel] || 0) + 0.30;

      // 10% distributed across remaining middle touches
      const milestoneIdxs = new Set([firstIdx, leadIdx, oppIdx, lastIdx]);
      const middleIdxs = Array.from({ length: n }, (_, i) => i).filter(i => !milestoneIdxs.has(i));
      if (middleIdxs.length > 0) {
        const perMiddle = 0.10 / middleIdxs.length;
        for (const i of middleIdxs) {
          channelWeights[d.touches[i].channel] = (channelWeights[d.touches[i].channel] || 0) + perMiddle;
        }
      } else {
        // If no middle touches remain, give the 10% to the last touch
        channelWeights[d.touches[lastIdx].channel] = (channelWeights[d.touches[lastIdx].channel] || 0) + 0.10;
      }
    }

    Object.entries(channelWeights).forEach(([ch, weight]) => {
      result[ch].pipeline += d.deal * weight;
      result[ch].opps += weight;
      if (d.stage === 'closed_won') result[ch].revenue += d.deal * weight;
    });
  });

  return result as Record<Channel, AttributionResult>;
}

// ============================================================
// Markov diagnostics — exposed for the Data-Driven page
// ============================================================

export interface MarkovDiagnostics {
  transitionMatrix: Record<string, Record<string, number>>;
  removalEffects: Record<string, number>;
  pathFrequency: Record<string, { wonRate: number; lostRate: number; wonDensity: number; score: number }>;
  baseConversionRate: number;
}

export function markovDiagnostics(data: Account[]): MarkovDiagnostics {
  // Build transition counts
  const transitions = new Map<string, Map<string, number>>();
  function addTransition(from: string, to: string) {
    if (!transitions.has(from)) transitions.set(from, new Map());
    const row = transitions.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  for (const account of data) {
    if (account.touches.length === 0) continue;
    const channels = account.touches.map(t => t.channel);
    const isConversion = account.stage === 'closed_won';
    const endState = isConversion ? 'conversion' : 'null';
    addTransition('start', channels[0]);
    for (let i = 0; i < channels.length - 1; i++) {
      addTransition(channels[i], channels[i + 1]);
    }
    addTransition(channels[channels.length - 1], endState);
  }

  // Build probability matrix
  const transitionMatrix: Record<string, Record<string, number>> = {};
  for (const [from, row] of transitions) {
    const total = Array.from(row.values()).reduce((s, v) => s + v, 0);
    transitionMatrix[from] = {};
    for (const [to, count] of row) {
      transitionMatrix[from][to] = total > 0 ? Math.round((count / total) * 1000) / 1000 : 0;
    }
  }

  // Compute base conversion via absorption
  const allStates = new Set<string>(['start', 'conversion', 'null']);
  for (const [from, row] of transitions) {
    allStates.add(from);
    for (const to of row.keys()) allStates.add(to);
  }
  const states = Array.from(allStates);

  function computeConversionRate(removedChannel?: Channel): number {
    const transient = states.filter(s => s !== 'conversion' && s !== 'null');
    const n = transient.length;
    const stateIdx = new Map(transient.map((s, i) => [s, i]));
    const Q: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const R: number[] = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      const from = transient[i];
      if (from === removedChannel) continue;
      const row = transitions.get(from);
      if (!row) continue;
      const total = Array.from(row.values()).reduce((s, v) => s + v, 0);
      if (total === 0) continue;
      for (const [to, count] of row) {
        if (to === removedChannel) continue;
        const prob = count / total;
        if (to === 'conversion') {
          R[i] += prob;
        } else if (to !== 'null') {
          const j = stateIdx.get(to);
          if (j !== undefined) Q[i][j] += prob;
        }
      }
    }

    const absorption = Array(n).fill(0);
    for (let iter = 0; iter < 100; iter++) {
      let maxDelta = 0;
      for (let i = 0; i < n; i++) {
        let newVal = R[i];
        for (let j = 0; j < n; j++) {
          newVal += Q[i][j] * absorption[j];
        }
        maxDelta = Math.max(maxDelta, Math.abs(newVal - absorption[i]));
        absorption[i] = newVal;
      }
      if (maxDelta < 1e-10) break;
    }

    const startIdx = stateIdx.get('start');
    return startIdx !== undefined ? absorption[startIdx] : 0;
  }

  const baseConversionRate = computeConversionRate();

  const removalEffects: Record<string, number> = {};
  for (const ch of CHANNEL_KEYS) {
    const removedRate = computeConversionRate(ch);
    removalEffects[ch] = Math.max(0, baseConversionRate - removedRate);
  }

  // Path frequency analysis
  const wonAccounts = data.filter(a => a.stage === 'closed_won');
  const lostAccounts = data.filter(a => a.stage === 'closed_lost');
  const pathFrequency: Record<string, { wonRate: number; lostRate: number; wonDensity: number; score: number }> = {};
  for (const ch of CHANNEL_KEYS) {
    const wonWithCh = wonAccounts.filter(a => a.touches.some(t => t.channel === ch)).length;
    const wonRate = wonAccounts.length > 0 ? wonWithCh / wonAccounts.length : 0;
    const lostWithCh = lostAccounts.filter(a => a.touches.some(t => t.channel === ch)).length;
    const lostRate = lostAccounts.length > 0 ? lostWithCh / lostAccounts.length : 0;
    const wonDensity = wonAccounts.length > 0
      ? wonAccounts.reduce((s, a) => s + a.touches.filter(t => t.channel === ch).length, 0) / wonAccounts.length
      : 0;
    const overallDensity = data.length > 0
      ? data.reduce((s, a) => s + a.touches.filter(t => t.channel === ch).length, 0) / data.length
      : 0;
    const winLift = wonRate - lostRate;
    const densityLift = overallDensity > 0 ? wonDensity / overallDensity : 1;
    pathFrequency[ch] = { wonRate, lostRate, wonDensity, score: Math.max(0.01, (1 + winLift) * densityLift) };
  }

  return { transitionMatrix, removalEffects, pathFrequency, baseConversionRate };
}

// ============================================================
// Unified model runner — run any model by ID
// ============================================================

export function runAttribution(model: AttributionModel, data: Account[]): Record<Channel, AttributionResult> {
  switch (model) {
    case 'first_touch': return firstTouchAttribution(data);
    case 'last_touch': return lastTouchAttribution(data);
    case 'linear': return multiTouchAttribution(data);
    case 'time_decay': return timeDecayAttribution(data);
    case 'position_based': return positionBasedAttribution(data);
    case 'markov': return markovAttribution(data);
    case 'w_shaped': return wShapedAttribution(data);
  }
}
