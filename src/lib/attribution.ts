import { type Account, type Channel, CHANNEL_KEYS } from './data';

// ============================================================
// Attribution Model Types & Configuration — SPEC3 A1
// ============================================================

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

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
// Unified model runner — run any model by ID
// ============================================================

export function runAttribution(model: AttributionModel, data: Account[]): Record<Channel, AttributionResult> {
  switch (model) {
    case 'first_touch': return firstTouchAttribution(data);
    case 'last_touch': return lastTouchAttribution(data);
    case 'linear': return multiTouchAttribution(data);
    case 'time_decay': return timeDecayAttribution(data);
    case 'position_based': return positionBasedAttribution(data);
  }
}
