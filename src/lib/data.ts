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
  linkedin: { name: 'LinkedIn Ads', color: '#0A66C2', shortName: 'LinkedIn', icon: 'linkedin' },
  email: { name: 'Marketo Email', color: '#8B5CF6', shortName: 'Email', icon: 'mail' },
  form: { name: 'Form Submissions', color: '#10B981', shortName: 'Web Forms', icon: 'file-text' },
  events: { name: 'Events & Webinars', color: '#F59E0B', shortName: 'Events', icon: 'calendar' },
};

export const CHANNEL_KEYS: Channel[] = ['linkedin', 'email', 'form', 'events'];

export interface Stage {
  key: string;
  name: string;
  color: string;
}

export const STAGES: Stage[] = [
  { key: 'disco_set', name: 'Discos Set', color: '#3B82F6' },
  { key: 'disco_completed', name: 'Discos Completed', color: '#06B6D4' },
  { key: 'solution_accepted', name: 'Solution Accepted', color: '#8B5CF6' },
  { key: 'eval_planning', name: 'Evaluation Planning', color: '#F59E0B' },
  { key: 'negotiation', name: 'Negotiation', color: '#F97316' },
  { key: 'closed_won', name: 'Closed Won', color: '#10B981' },
  { key: 'closed_lost', name: 'Closed Lost', color: '#EF4444' },
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
    'RMJ Newsletter — Jan 2025',
    'RMJ Newsletter — Dec 2024',
    'RMJ Event Follow-Up — Gartner IOCS',
    'RMJ Demo Request Follow-Up',
    'RMJ Webinar Invite — RISE with SAP',
  ],
  events: [
    'SAP Sapphire Orlando 2024',
    'Gartner IOCS Las Vegas 2024',
    'ASUG Annual Conference',
    'Redwood Webinar: Migrate from Ctrl-M',
    'Redwood Webinar: S/4HANA Job Scheduling',
    'SAPPHIRE Barcelona 2024',
    'Redwood Customer Summit 2024',
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

function generateTouchpoints(_account: typeof ACCOUNTS_BASE[0]): Touchpoint[] {
  const touches: Touchpoint[] = [];
  const months = ['2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12','2025-01'];
  const numTouches = 3 + Math.floor(seededRandom() * 12);

  // SKEW: LinkedIn heavy first-touch, Events heavy mid-funnel, Forms heavy last-touch
  const firstW: Record<string, number> = { linkedin: 0.50, email: 0.15, form: 0.10, events: 0.25 };
  const midW: Record<string, number> = { linkedin: 0.20, email: 0.35, form: 0.05, events: 0.40 };
  const lastW: Record<string, number> = { linkedin: 0.10, email: 0.25, form: 0.50, events: 0.15 };

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
    const monthIdx = Math.min(Math.floor((i / numTouches) * 12), 11);
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
export const MONTH_KEYS = ['2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12','2025-01'];
