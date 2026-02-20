// ============================================================
// MOCK DATA ENGINE — RunMyJobs Marketing Attribution
// ============================================================

export type Channel = 'linkedin' | 'email' | 'form' | 'events';

export interface ChannelInfo {
  name: string;
  color: string;
  shortName: string;
  icon: string;
}

export const CHANNELS: Record<Channel, ChannelInfo> = {
  linkedin: { name: 'LinkedIn Ads', color: 'hsl(200, 65%, 50%)', shortName: 'LinkedIn', icon: 'linkedin' },
  email: { name: 'Marketo Email', color: 'hsl(220, 50%, 58%)', shortName: 'Email', icon: 'mail' },
  form: { name: 'Form Submissions', color: 'hsl(168, 55%, 45%)', shortName: 'Web Forms', icon: 'file-text' },
  events: { name: 'Events & Webinars', color: 'hsl(38, 55%, 55%)', shortName: 'Events', icon: 'calendar' },
};

export const CHANNEL_KEYS: Channel[] = ['linkedin', 'email', 'form', 'events'];

export interface Stage {
  key: string;
  name: string;
  color: string;
}

export const STAGES: Stage[] = [
  { key: 'disco_set', name: 'Discos Set', color: 'hsl(168, 55%, 42%)' },
  { key: 'disco_completed', name: 'Discos Completed', color: 'hsl(168, 50%, 48%)' },
  { key: 'solution_accepted', name: 'Solution Accepted', color: 'hsl(168, 45%, 54%)' },
  { key: 'eval_planning', name: 'Evaluation Planning', color: 'hsl(170, 40%, 60%)' },
  { key: 'negotiation', name: 'Negotiation', color: 'hsl(172, 35%, 66%)' },
  { key: 'closed_won', name: 'Closed Won', color: 'hsl(168, 55%, 42%)' },
  { key: 'closed_lost', name: 'Closed Lost', color: 'hsl(220, 10%, 50%)' },
];

export const CAMPAIGNS: Record<Channel, string[]> = {
  linkedin: [
    'RMJ | SAP S/4HANA Migration | IT Leaders',
    'RMJ | RISE with SAP | C-Level',
    'RMJ | Workload Automation SaaS | Retarget',
    'RMJ | DevOps Automation | Tech Leads',
    'RMJ | Competitor Conquest | Ctrl-M/TWS',
    'RMJ | SAP BTP Automation | ABM Tier 1',
  ],
  email: [
    'RMJ Nurture — SAP Modernization Sequence',
    'RMJ Nurture — Competitive Displacement',
    'RMJ Newsletter — Jan 2026',
    'RMJ Newsletter — Dec 2025',
    'RMJ Event Follow-Up — Gartner IOCS',
    'RMJ Demo Request Follow-Up',
    'RMJ Webinar Invite — RISE with SAP',
  ],
  events: [
    'SAP Sapphire Orlando 2025',
    'Gartner IOCS Las Vegas 2025',
    'ASUG Annual Conference',
    'Redwood Webinar: Migrate from Ctrl-M',
    'Redwood Webinar: S/4HANA Job Scheduling',
    'SAPPHIRE Barcelona 2025',
    'Redwood Customer Summit 2025',
  ],
  form: [
    'redwood.com/demo/quick — Demo Request',
    'redwood.com/migration — Migration Assessment',
    'redwood.com/resource/sap — SAP Guide Download',
    'redwood.com/workload-automation — WA Datasheet',
    'redwood.com/contact-us — Contact Form',
    'redwood.com/roi-calculator — ROI Calculator',
  ],
};

export interface Touchpoint {
  channel: Channel;
  campaign: string;
  date: string;
  type: string;
  position: number;
}

export interface Account {
  name: string;
  size: string;
  industry: string;
  deal: number;
  stage: string;
  region: string;
  touches: Touchpoint[];
}

const ACCOUNTS_BASE = [
  { name: 'Siemens AG', size: 'Enterprise', industry: 'Manufacturing', deal: 485000, stage: 'closed_won', region: 'EMEA' },
  { name: 'Nestlé SA', size: 'Enterprise', industry: 'Consumer Goods', deal: 620000, stage: 'negotiation', region: 'EMEA' },
  { name: 'Johnson Controls', size: 'Enterprise', industry: 'Industrial', deal: 310000, stage: 'eval_planning', region: 'NA' },
  { name: 'Deloitte LLP', size: 'Enterprise', industry: 'Professional Services', deal: 275000, stage: 'closed_won', region: 'NA' },
  { name: 'BASF SE', size: 'Enterprise', industry: 'Chemicals', deal: 540000, stage: 'solution_accepted', region: 'EMEA' },
  { name: 'Honeywell Intl', size: 'Enterprise', industry: 'Conglomerate', deal: 390000, stage: 'disco_completed', region: 'NA' },
  { name: 'Colgate-Palmolive', size: 'Enterprise', industry: 'Consumer Goods', deal: 220000, stage: 'closed_lost', region: 'NA' },
  { name: 'Roche Holding', size: 'Enterprise', industry: 'Pharma', deal: 680000, stage: 'eval_planning', region: 'EMEA' },
  { name: 'BHP Group', size: 'Enterprise', industry: 'Mining', deal: 445000, stage: 'disco_set', region: 'APAC' },
  { name: 'Toyota Motor Corp', size: 'Enterprise', industry: 'Automotive', deal: 720000, stage: 'negotiation', region: 'APAC' },
  { name: 'Pfizer Inc', size: 'Enterprise', industry: 'Pharma', deal: 350000, stage: 'closed_won', region: 'NA' },
  { name: 'Unilever PLC', size: 'Enterprise', industry: 'Consumer Goods', deal: 290000, stage: 'solution_accepted', region: 'EMEA' },
  { name: 'Dow Chemical', size: 'Enterprise', industry: 'Chemicals', deal: 410000, stage: 'disco_completed', region: 'NA' },
  { name: 'Continental AG', size: 'Mid-Market', industry: 'Automotive', deal: 185000, stage: 'closed_lost', region: 'EMEA' },
  { name: 'Kimberly-Clark', size: 'Enterprise', industry: 'Consumer Goods', deal: 255000, stage: 'disco_set', region: 'NA' },
  { name: 'Merck KGaA', size: 'Enterprise', industry: 'Pharma', deal: 520000, stage: 'eval_planning', region: 'EMEA' },
  { name: 'Caterpillar Inc', size: 'Enterprise', industry: 'Heavy Equipment', deal: 375000, stage: 'disco_completed', region: 'NA' },
  { name: 'ABB Ltd', size: 'Enterprise', industry: 'Industrial', deal: 430000, stage: 'solution_accepted', region: 'EMEA' },
  { name: 'Lenovo Group', size: 'Enterprise', industry: 'Technology', deal: 295000, stage: 'closed_lost', region: 'APAC' },
  { name: 'Procter & Gamble', size: 'Enterprise', industry: 'Consumer Goods', deal: 550000, stage: 'negotiation', region: 'NA' },
  { name: 'Volvo Group', size: 'Enterprise', industry: 'Automotive', deal: 340000, stage: 'disco_set', region: 'EMEA' },
  { name: 'Baker Hughes', size: 'Mid-Market', industry: 'Energy', deal: 210000, stage: 'disco_set', region: 'NA' },
  { name: 'Sanofi SA', size: 'Enterprise', industry: 'Pharma', deal: 480000, stage: 'eval_planning', region: 'EMEA' },
  { name: 'Emerson Electric', size: 'Enterprise', industry: 'Industrial', deal: 320000, stage: 'disco_completed', region: 'NA' },
];

// Seeded random for deterministic data
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Seasonal weights by month index: Feb=0 … Jan=11
// Q4 (Oct-Nov) peaks, summer dips, Jan slight dip
const SEASONAL_WEIGHTS = [0.7, 0.8, 0.9, 1.0, 0.9, 0.7, 0.6, 0.7, 0.9, 1.2, 1.3, 0.8];

function seasonalMonthIdx(linearIdx: number): number {
  // Build cumulative distribution from seasonal weights
  const totalWeight = SEASONAL_WEIGHTS.reduce((s, w) => s + w, 0);
  const r = seededRandom() * totalWeight;
  let cum = 0;
  // Start search from linearIdx to keep chronological bias, wrap around
  for (let offset = 0; offset < 12; offset++) {
    const idx = (linearIdx + offset) % 12;
    cum += SEASONAL_WEIGHTS[idx];
    if (r <= cum) return idx;
  }
  return linearIdx;
}

function generateTouchpoints(account: typeof ACCOUNTS_BASE[0]): Touchpoint[] {
  const touches: Touchpoint[] = [];
  const months = ['2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01'];

  const isLost = account.stage === 'closed_lost';
  const isWon = account.stage === 'closed_won';

  // Touch count varies by deal outcome
  const numTouches = isLost
    ? 2 + Math.floor(seededRandom() * 3)    // 2-4 for lost deals
    : isWon
      ? 6 + Math.floor(seededRandom() * 9)  // 6-14 for won deals
      : 3 + Math.floor(seededRandom() * 12); // 3-14 for active pipeline

  // Channel weights per phase, adjusted by deal outcome
  let firstW: Record<string, number>;
  let midW: Record<string, number>;
  let lastW: Record<string, number>;

  if (isLost) {
    // Lost deals: single-channel heavy (email or linkedin), near-zero events
    firstW = { linkedin: 0.45, email: 0.50, form: 0.04, events: 0.01 };
    midW   = { linkedin: 0.40, email: 0.55, form: 0.04, events: 0.01 };
    lastW  = { linkedin: 0.35, email: 0.55, form: 0.09, events: 0.01 };
  } else if (isWon) {
    // Won deals: diverse channels, stronger event presence mid-funnel
    firstW = { linkedin: 0.45, email: 0.15, form: 0.10, events: 0.30 };
    midW   = { linkedin: 0.15, email: 0.25, form: 0.10, events: 0.50 };
    lastW  = { linkedin: 0.10, email: 0.20, form: 0.50, events: 0.20 };
  } else {
    // Default weights (active pipeline)
    firstW = { linkedin: 0.50, email: 0.15, form: 0.10, events: 0.25 };
    midW   = { linkedin: 0.20, email: 0.35, form: 0.05, events: 0.40 };
    lastW  = { linkedin: 0.10, email: 0.25, form: 0.50, events: 0.15 };
  }

  function weightedPick(weights: Record<string, number>): Channel {
    const r = seededRandom();
    let cum = 0;
    for (const [k, w] of Object.entries(weights)) {
      cum += w;
      if (r <= cum) return k as Channel;
    }
    return 'email';
  }

  for (let i = 0; i < numTouches; i++) {
    const phase = i === 0 ? 'first' : i === numTouches - 1 ? 'last' : 'mid';
    const ch = phase === 'first' ? weightedPick(firstW) : phase === 'last' ? weightedPick(lastW) : weightedPick(midW);
    const linearIdx = Math.min(Math.floor((i / numTouches) * 12), 11);
    const monthIdx = seasonalMonthIdx(linearIdx);
    const month = months[monthIdx];
    const day = String(1 + Math.floor(seededRandom() * 28)).padStart(2, '0');
    const campaigns = CAMPAIGNS[ch];

    touches.push({
      channel: ch,
      campaign: campaigns[Math.floor(seededRandom() * campaigns.length)],
      date: `${month}-${day}`,
      type: ch === 'email' ? (seededRandom() > 0.4 ? 'click' : 'open') :
            ch === 'linkedin' ? 'engagement' :
            ch === 'form' ? 'submission' :
            (seededRandom() > 0.5 ? 'attended' : 'registered'),
      position: i,
    });
  }
  return touches.sort((a, b) => a.date.localeCompare(b.date));
}

export const DATA: Account[] = ACCOUNTS_BASE.map(acc => ({
  ...acc,
  touches: generateTouchpoints(acc),
}));

export const MONTH_LABELS = ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
export const MONTH_KEYS = ['2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01'];
