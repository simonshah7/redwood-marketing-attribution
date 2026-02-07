import { type Account, type Channel, CHANNEL_KEYS } from './data';

export interface AttributionResult {
  revenue: number;
  opps: number;
  pipeline: number;
}

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
