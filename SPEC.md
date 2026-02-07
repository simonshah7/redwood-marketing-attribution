# Redwood RunMyJobs Marketing Attribution Dashboard — Claude Code Build Spec

## OVERVIEW

Build a production-grade marketing attribution visualization dashboard for Redwood Software's RunMyJobs product line. This is an internal marketing analytics tool that takes Salesforce pipeline data + marketing channel data (LinkedIn Ads, Marketo Email, WordPress Form Submissions, Events/Webinars) and shows first-touch, last-touch, and multi-touch attribution across the buyer journey.

I have a working prototype that I'll provide the complete data layer and component specs from. Your job is to scaffold this as a proper Next.js App Router project, deploy-ready for Vercel.

---

## STEP 1: Project Setup

```bash
# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install shadcn/ui
npx shadcn@latest init
# Choose: New York style, Slate base color, CSS variables: YES

# Add shadcn components
npx shadcn@latest add card badge table tabs tooltip scroll-area separator sheet select button progress

# Install charting + animation libraries
npm install recharts framer-motion lucide-react

# Install next/font (built in, but ensure DM Sans is used)
```

---

## STEP 2: Theme Configuration

This is a DARK THEME dashboard branded for Redwood Software.

**Brand colors:**
- Primary red: `#E3342F` (Redwood brand red)
- Dark backgrounds: `hsl(222, 20%, 7%)` through `hsl(222, 18%, 10%)`

**Channel colors (must be consistent across all views):**
- LinkedIn Ads: `#0A66C2`
- Marketo Email: `#8B5CF6`
- Form Submissions: `#10B981`
- Events & Webinars: `#F59E0B`

**Stage colors:**
- Discos Set: `#3B82F6`
- Discos Completed: `#06B6D4`
- Solution Accepted: `#8B5CF6`
- Evaluation Planning: `#F59E0B`
- Negotiation: `#F97316`
- Closed Won: `#10B981`
- Closed Lost: `#EF4444`

**Typography:**
- Primary: DM Sans (via `next/font/google`)
- Monospace (data figures): JetBrains Mono (via `next/font/google`)

**CSS variables for globals.css** (shadcn dark theme customized for Redwood):
```css
:root {
  --background: 222 20% 7%;
  --foreground: 220 15% 90%;
  --card: 222 18% 10%;
  --card-foreground: 220 15% 90%;
  --popover: 222 22% 9%;
  --popover-foreground: 220 15% 90%;
  --primary: 3 82% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 222 14% 16%;
  --secondary-foreground: 220 15% 85%;
  --muted: 222 14% 14%;
  --muted-foreground: 220 10% 55%;
  --accent: 222 14% 18%;
  --accent-foreground: 220 15% 90%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 222 14% 18%;
  --input: 222 14% 18%;
  --ring: 3 82% 53%;
  --radius: 0.5rem;
}
```

---

## STEP 3: File Structure

```
src/
├── app/
│   ├── layout.tsx                  ← Root layout: sidebar shell + header
│   ├── page.tsx                    ← Overview dashboard (default route)
│   ├── first-touch/page.tsx
│   ├── last-touch/page.tsx
│   ├── multi-touch/page.tsx
│   ├── channels/page.tsx
│   ├── journeys/page.tsx
│   ├── pipeline/page.tsx
│   └── ai-insights/page.tsx
├── components/
│   ├── ui/                         ← shadcn components (auto-generated)
│   ├── layout/
│   │   ├── sidebar.tsx             ← Navigation sidebar (desktop fixed + mobile Sheet)
│   │   └── header.tsx              ← Sticky header with breadcrumb + filters
│   ├── charts/
│   │   ├── model-comparison.tsx    ← Side-by-side stacked bars (3 attribution models)
│   │   ├── monthly-timeline.tsx    ← Stacked bar chart, 12 months, by channel
│   │   ├── pipeline-funnel.tsx     ← Horizontal funnel with drop-off %
│   │   ├── channel-bar.tsx         ← Single horizontal bar with label
│   │   ├── mini-spark.tsx          ← Sparkline bar chart (used in channel cards)
│   │   └── journey-map.tsx         ← Horizontal dot timeline per account
│   ├── cards/
│   │   ├── kpi-card.tsx            ← KPI with accent bar, value, delta badge
│   │   └── insight-card.tsx        ← Colored left-border card with severity icon
│   └── shared/
│       └── channel-legend.tsx      ← Reusable channel color legend
├── lib/
│   ├── data.ts                     ← All mock data, types, constants
│   ├── attribution.ts              ← First-touch, last-touch, multi-touch models
│   └── utils.ts                    ← fmt(), pct(), and cn() helper
└── styles/
    └── globals.css                 ← Tailwind + CSS variables + custom animations
```

---

## STEP 4: Data Layer

Port this file to `src/lib/data.ts`. It contains all the mock data, types, and constants. The data is DETERMINISTIC (seeded random) so it's consistent across renders.

```typescript
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
```

---

## STEP 5: Attribution Models

Port this to `src/lib/attribution.ts`:

```typescript
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
```

---

## STEP 6: View Specifications

### 6a. Layout (root layout.tsx)
- Fixed sidebar on desktop (260px, left, full height, bg-card, border-r)
- Sheet sidebar on mobile (triggered by hamburger in header)
- Sticky header (64px) with: breadcrumb "RunMyJobs > Pipeline Jan 31, 2025", page title, date range badge
- Sidebar navigation has 3 sections: "Attribution" (Overview, First Touch, Last Touch, Multi-Touch), "Deep Dives" (Channels, Journeys, Pipeline), "Intelligence" (AI Insights)
- Use Next.js `<Link>` for navigation with `usePathname()` for active state
- Sidebar footer: green pulse dot + "Mock data · Feb 2024 – Jan 2025"
- Use `next/font` for DM Sans + JetBrains Mono

### 6b. Overview Dashboard (`/`)
**KPI Row** (5 across on desktop, responsive grid):
1. Total Pipeline — value from data, "↓ 8.3% vs prior" (negative/red)
2. Closed Won — won revenue, "↓ 12.1% vs prior" (negative)
3. Win Rate — won/total %, "↓ 3.2pp vs prior" (negative)
4. Opportunities — count, "Flat vs prior" (neutral/amber)
5. Avg Touches — mean touches per deal, "+1.4 vs prior" (positive/green)

Each KPI card has a 3px colored accent bar on top, the value in large bold white text, and a Badge with directional arrow icon for the delta.

**Attribution Model Comparison**: 3 horizontal stacked bars (First Touch, Last Touch, Multi-Touch) showing pipeline % split by channel color. Interactive tooltips on hover showing exact amounts.

**Pipeline Funnel**: Horizontal funnel visualization with the 7 stages. Centered bars proportional to count. Red "↓ X% drop" annotations between stages. Closed Won/Lost show dollar amounts.

**Attribution Alerts** (4 insight cards):
- DANGER: "LinkedIn drives awareness but not conversion" — show FT vs LT percentages and the gap amount
- WARNING: "Form submissions dominate last touch" — LT vs FT form percentages
- DANGER: "Closed-Lost deals had 38% fewer event touches" — won vs lost event avg
- INFO: "Email nurtures undervalued" — MT vs FT email percentages

**Monthly Touch Volume**: Stacked bar chart (use Recharts StackedBarChart), 12 months, 4 channel colors. Tooltips with breakdown.

### 6c. First Touch (`/first-touch`)
- Description paragraph explaining the model
- 4 channel cards: each shows pipeline value, pipeline share %, revenue (green), opp count. Colored accent bar on top matching channel.
- Horizontal bar chart: channels ranked by pipeline, animated fill
- Account table: all 24 accounts with name, stage badge, deal amount, first-touch channel dot + label. ScrollArea for overflow.

### 6d. Last Touch (`/last-touch`)
- Same structure as First Touch but using last touchpoint for attribution

### 6e. Multi-Touch (`/multi-touch`)
- 4 channel cards with pipeline value + delta badges vs FT and LT (e.g., "+23% vs FT", "-15% vs LT")
- Comparison table: Channel | First Touch | Last Touch | Multi-Touch | FT→MT Δ | LT→MT Δ — show amounts and colored delta badges
- Won vs Lost bar chart: For each channel, show average touches for won deals (green bar) vs lost deals (red bar)
- 3 insight cards: Marketo hidden workhorse, LinkedIn over-credited, Events punch above weight

### 6f. Channel Performance (`/channels`)
- 4 channel cards (2x2 grid): each card has channel name + color dot, total touch count badge, monthly sparkline (12 mini bars), separator, top 5 campaigns with mini bar charts showing count

### 6g. Account Journeys (`/journeys`)
- Channel legend at top
- Card with top 10 accounts sorted by deal size
- Timeline header: "Feb '24" to "Jan '25" evenly spaced
- Each account row: name + deal + stage on left (w-36), horizontal timeline with colored dots positioned by date. Tooltips show date + channel + campaign.
- 3 pattern insight cards: Winning (LinkedIn→Event→Email→Form), Losing (LinkedIn→gap→Form), Stalled (heavy email, no events)

### 6h. Pipeline Influence (`/pipeline`)
- Stacked horizontal bars by deal stage: each stage shows channel mix %. Tooltips with counts.
- Pipeline by Region: NA, EMEA, APAC — each with pipeline/won amounts and stacked channel bar
- Industry Breakdown table: industry, opp count, pipeline amount

### 6i. AI Insights (`/ai-insights`)
- Hero banner: gradient border card with Sparkles icon, "AI-Powered Attribution Intelligence" title, summary stats
- 2-column insight grid:
  - Left: LinkedIn Drop-Off (danger), Event-Deprived Pipeline (danger), Marketo Underinvestment (warning)
  - Right: SAP Sapphire Winning Sequence (success), Model Disagreement (warning), Touch Density (info), Form Quality (info)
  - Each has a recommendation in amber/green/blue colored text
- Model Recommendation Matrix table: Use Case | Recommended Model | Rationale

---

## STEP 7: Visual Design Requirements

**USE RECHARTS** for all charts. Specifically:
- `BarChart` with `Bar` for horizontal bars and model comparison
- `BarChart` stacked for monthly timeline and channel influence
- Custom composed charts where needed

**USE FRAMER MOTION** for:
- Page transitions (`AnimatePresence` + `motion.div` with fadeInUp)
- Chart bar entrance animations (staggered from left)
- KPI card hover subtle scale
- View switch transitions

**Design principles:**
- NO purple gradients on white backgrounds
- This is a DARK dashboard — dark-900 background, dark-800 cards
- Use ample negative space — don't pack things too tight
- Channel colors should be the primary accent — let data visualization be the color source, not decorative elements
- Tables should have subtle hover rows
- All interactive elements need tooltips
- Mobile-first responsive: 1 col on phone, 2 col on tablet, full layout on desktop

---

## STEP 8: Deploy

- Push to GitHub
- Connect repo to Vercel
- Should work with zero config (Vercel auto-detects Next.js)

---

## KEY DATA INSIGHT: The mock data is INTENTIONALLY SKEWED to reveal attribution gaps:

1. **LinkedIn** dominates first-touch (~50%) but almost disappears from last-touch (~10%) — creates a dramatic "awareness vs conversion" gap
2. **Form submissions** dominate last-touch (~50%) but barely register as first-touch (~10%) — website converts demand from elsewhere
3. **Events** are the strongest predictor of winning — won deals have 62% more event touches than lost
4. **Email nurture** is the hidden workhorse — multi-touch reveals far more email influence than first/last models show
5. **Lost deals** have 38% fewer total touches and almost no event engagement

This data story is critical — the visualizations should make these gaps obvious and the AI Insights view should call them out explicitly.
