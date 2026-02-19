// ============================================================
// CHANNEL SPEND DATA — for Spend Optimizer
// ============================================================

import type { EnrichedChannel } from './enriched-data';

export interface ChannelSpendData {
  channel: EnrichedChannel;
  channelName: string;
  currentBudget: number;
  currentPipeline: number;
  currentRevenue: number;
  currentROI: number;
  marginalROI: number;
  minBudget: number;
  maxBudget: number;
  // Curve parameter: pipeline = coefficient * sqrt(spend)
  coefficient: number;
}

// Based on attribution data patterns — LinkedIn drives awareness,
// events drive conversion but are expensive, forms are efficient
export const CHANNEL_SPEND_DATA: ChannelSpendData[] = [
  {
    channel: 'linkedin_ads',
    channelName: 'LinkedIn Ads',
    currentBudget: 85000,
    currentPipeline: 1420000,
    currentRevenue: 485000,
    currentROI: 5.7,
    marginalROI: 3.2,
    minBudget: 30000,
    maxBudget: 150000,
    coefficient: 4870,
  },
  {
    channel: 'email_nurture',
    channelName: 'Email Nurture',
    currentBudget: 25000,
    currentPipeline: 890000,
    currentRevenue: 320000,
    currentROI: 12.8,
    marginalROI: 8.4,
    minBudget: 10000,
    maxBudget: 60000,
    coefficient: 5630,
  },
  {
    channel: 'event',
    channelName: 'Events & Conferences',
    currentBudget: 120000,
    currentPipeline: 2150000,
    currentRevenue: 720000,
    currentROI: 6.0,
    marginalROI: 2.8,
    minBudget: 40000,
    maxBudget: 200000,
    coefficient: 6210,
  },
  {
    channel: 'content_download',
    channelName: 'Content & Downloads',
    currentBudget: 35000,
    currentPipeline: 680000,
    currentRevenue: 210000,
    currentROI: 6.0,
    marginalROI: 4.5,
    minBudget: 15000,
    maxBudget: 80000,
    coefficient: 3630,
  },
  {
    channel: 'webinar',
    channelName: 'Webinars',
    currentBudget: 35000,
    currentPipeline: 760000,
    currentRevenue: 265000,
    currentROI: 7.6,
    marginalROI: 5.1,
    minBudget: 10000,
    maxBudget: 70000,
    coefficient: 4060,
  },
];

export const TOTAL_QUARTERLY_BUDGET = 300000;

export function getCurrentTotalBudget(): number {
  return CHANNEL_SPEND_DATA.reduce((sum, ch) => sum + ch.currentBudget, 0);
}
