// ============================================================
// ENRICHED MOCK DATA GENERATOR — Acme Cloud Marketing Attribution
// Generates UnifiedTouchpoint & EnrichedAccount data per spec2
// ============================================================

import type {
  UnifiedTouchpoint,
  EnrichedAccount,
  StageHistoryEntry,
  EnrichedChannel,
  ActivityType,
  SourceSystem,
  AssetType,
  DealType,
  ProductLine,
  Segment,
  BDRStepType,
  BuyingCommitteeMember,
  ContactRole,
  ContactSeniority,
} from './enriched-data';

// ---- Seeded random ----
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}
function weightedPick<T>(items: T[], weights: number[]): T {
  const r = seededRandom();
  let cum = 0;
  for (let i = 0; i < items.length; i++) {
    cum += weights[i];
    if (r <= cum) return items[i];
  }
  return items[items.length - 1];
}

// ---- Reference Data ----

const PAGE_URLS: { url: string; title: string }[] = [
  { url: '/cloud-observability/', title: 'CloudWatch Pro Observability Platform' },
  { url: '/solutions/kubernetes/', title: 'Kubernetes Monitoring Solutions' },
  { url: '/solutions/aws/', title: 'AWS Infrastructure Monitoring' },
  { url: '/demo/', title: 'Request a Demo' },
  { url: '/pricing/', title: 'CloudWatch Pro Pricing' },
  { url: '/customers/', title: 'Customer Success Stories' },
  { url: '/resources/whitepaper/cloud-migration/', title: 'Cloud Migration Whitepaper' },
  { url: '/blog/datadog-alternative/', title: 'Blog: Best Datadog Alternative' },
  { url: '/roi-calculator/', title: 'ROI Calculator' },
  { url: '/platform/', title: 'CloudWatch Pro Platform Overview' },
  { url: '/solutions/ci-cd-analytics/', title: 'CI/CD Analytics' },
  { url: '/blog/observability-trends/', title: 'Blog: Observability Trends 2025' },
  { url: '/case-study/apex-financial/', title: 'Case Study: Apex Financial' },
  { url: '/resources/datasheet/cloudwatch-pro/', title: 'CloudWatch Pro Datasheet' },
  { url: '/about/', title: 'About Acme Cloud' },
];

const CONTENT_ASSETS: { name: string; type: AssetType }[] = [
  { name: 'Cloud Migration Monitoring Guide', type: 'guide' },
  { name: 'Datadog to CloudWatch Pro Comparison Sheet', type: 'datasheet' },
  { name: 'CloudWatch Pro ROI Calculator Results', type: 'roi_calculator' },
  { name: 'Observability Platform Buyer\'s Guide', type: 'guide' },
  { name: 'Apex Financial Case Study', type: 'case_study' },
  { name: 'Total Economic Impact Study', type: 'whitepaper' },
  { name: 'Kubernetes Monitoring Datasheet', type: 'datasheet' },
  { name: 'CloudWatch Pro vs Competitors Infographic', type: 'infographic' },
  { name: 'CTO Guide to Cloud Observability', type: 'whitepaper' },
  { name: 'DevOps Monitoring Best Practices', type: 'guide' },
];

const BDR_SEQUENCES = [
  'CWP Enterprise — Datadog Displacement Q4',
  'CWP Enterprise — Cloud Migration Awareness',
  'CWP Enterprise — Event Follow-Up KubeCon',
  'CWP Mid-Market — Inbound Demo Follow-Up',
  'CWP Enterprise — Competitive Win-Back',
  'CWP Enterprise — Pricing Follow-Up',
];

const LINKEDIN_CAMPAIGNS = [
  'CWP | Cloud Migration | Platform Engineers',
  'CWP | Kubernetes Monitoring | C-Level',
  'CWP | Observability SaaS | Retarget',
  'CWP | DevOps Automation | Tech Leads',
  'CWP | Competitor Conquest | Datadog/Splunk',
  'CWP | Infrastructure Monitoring | ABM Tier 1',
];

const AD_CREATIVES = [
  'Cloud Migration — Platform Engineer Testimonial',
  'K8s Monitoring — CTO Webinar Promo',
  'Datadog Alternative — Comparison Infographic',
  'CloudWatch Pro SaaS — Free Assessment Offer',
  'Observability ROI — Calculator CTA',
  'Infrastructure Monitoring — Customer Story Video',
];

const EMAIL_PROGRAMS = [
  'CWP Nurture — Cloud Migration Sequence',
  'CWP Nurture — Competitive Displacement',
  'CWP Newsletter — Jan 2026',
  'CWP Newsletter — Dec 2025',
  'CWP Event Follow-Up — KubeCon',
  'CWP Demo Request Follow-Up',
  'CWP Webinar Invite — K8s Monitoring',
];

const EMAIL_NAMES = [
  'Cloud Migration Nurture Email 1 — Pain Points',
  'Cloud Migration Nurture Email 2 — Case Study',
  'Cloud Migration Nurture Email 3 — ROI Calculator',
  'Competitive Email 1 — Why Switch',
  'Competitive Email 2 — Migration Ease',
  'Newsletter — Product Updates',
  'Newsletter — Industry Insights',
  'Event Recap — Key Takeaways',
  'Demo Confirmation & Prep',
  'Webinar Invite — Register Now',
];

const EVENTS: { name: string; type: 'conference' | 'webinar' | 'workshop' | 'customer_summit' }[] = [
  { name: 'KubeCon NA 2025', type: 'conference' },
  { name: 'AWS re:Invent 2025', type: 'conference' },
  { name: 'DevOps Days San Francisco', type: 'conference' },
  { name: 'Acme Webinar: Migrate from Datadog', type: 'webinar' },
  { name: 'Acme Webinar: Kubernetes Monitoring at Scale', type: 'webinar' },
  { name: 'SREcon Europe 2025', type: 'conference' },
  { name: 'Acme Cloud Summit 2025', type: 'customer_summit' },
  { name: 'Observability Workshop: Hands-On CloudWatch Pro', type: 'workshop' },
];

const AD_ACCOUNTS: { id: string; name: string }[] = [
  { id: 'act_001', name: 'CWP Enterprise — NA' },
  { id: 'act_002', name: 'CWP Enterprise — EMEA' },
  { id: 'act_003', name: 'CWP ABM Tier 1' },
  { id: 'act_004', name: 'CWP Mid-Market — Global' },
  { id: 'act_005', name: 'CWP Competitive Conquest' },
];

const ORGANIC_SOCIAL_POSTS: { detail: string; postType: string }[] = [
  { detail: 'LinkedIn organic: CloudWatch Pro customer success story', postType: 'customer_story' },
  { detail: 'LinkedIn organic: Cloud migration monitoring tips', postType: 'thought_leadership' },
  { detail: 'LinkedIn organic: Acme Cloud employee advocacy share', postType: 'employee_advocacy' },
  { detail: 'LinkedIn organic: Observability trends infographic', postType: 'infographic' },
  { detail: 'LinkedIn organic: Webinar promotion post', postType: 'event_promo' },
  { detail: 'LinkedIn organic: Product update announcement', postType: 'product_update' },
];

const OWNERS = ['Jane Smith', 'Michael Chen', 'Sarah Johnson', 'David Park', 'Lisa Mueller', 'Robert Taylor'];
const BDRS = ['Tom Wilson', 'Amy Rodriguez', 'Chris Lee', 'Katie Brown', 'James Kim', 'Nicole Davis'];
const LEAD_SOURCES = ['Marketing', 'Outbound BDR', 'Event', 'Partner', 'Inbound Web', 'Referral'];

// ---- Account Base Data ----
interface AccountBase {
  name: string;
  size: Segment;
  industry: string;
  deal: number;
  stage: string;
  region: string;
  deal_type: DealType;
  product_line: ProductLine;
}

const ACCOUNTS_BASE: AccountBase[] = [
  { name: 'Apex Financial', size: 'Enterprise', industry: 'Financial Services', deal: 485000, stage: 'closed_won', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'NovaTech Solutions', size: 'Enterprise', industry: 'Technology', deal: 620000, stage: 'negotiation', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Meridian Health', size: 'Enterprise', industry: 'Healthcare', deal: 310000, stage: 'eval_planning', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Stratton Consulting', size: 'Enterprise', industry: 'Professional Services', deal: 275000, stage: 'closed_won', region: 'NA', deal_type: 'Expansion', product_line: 'CloudWatch Pro' },
  { name: 'Vantage Logistics', size: 'Enterprise', industry: 'Logistics', deal: 540000, stage: 'solution_accepted', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Orion Industries', size: 'Enterprise', industry: 'Manufacturing', deal: 390000, stage: 'disco_completed', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Pinnacle Retail', size: 'Enterprise', industry: 'Retail', deal: 220000, stage: 'closed_lost', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Helix Biotech', size: 'Enterprise', industry: 'Biotech', deal: 680000, stage: 'eval_planning', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Pacific Minerals', size: 'Enterprise', industry: 'Mining', deal: 445000, stage: 'disco_set', region: 'APAC', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Zenith Motors', size: 'Enterprise', industry: 'Automotive', deal: 720000, stage: 'negotiation', region: 'APAC', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Cascade Pharma', size: 'Enterprise', industry: 'Pharma', deal: 350000, stage: 'closed_won', region: 'NA', deal_type: 'Expansion', product_line: 'CloudWatch Pro' },
  { name: 'Broadleaf Media', size: 'Enterprise', industry: 'Media', deal: 290000, stage: 'solution_accepted', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Titan Chemical', size: 'Enterprise', industry: 'Chemicals', deal: 410000, stage: 'disco_completed', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Cobalt Engineering', size: 'Mid-Market', industry: 'Engineering', deal: 185000, stage: 'closed_lost', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Ironwood Consumer', size: 'Enterprise', industry: 'Consumer Goods', deal: 255000, stage: 'disco_set', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Vertex Genomics', size: 'Enterprise', industry: 'Biotech', deal: 520000, stage: 'eval_planning', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Atlas Heavy Ind', size: 'Enterprise', industry: 'Heavy Equipment', deal: 375000, stage: 'disco_completed', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Nordic Automation', size: 'Enterprise', industry: 'Industrial', deal: 430000, stage: 'solution_accepted', region: 'EMEA', deal_type: 'Expansion', product_line: 'CloudWatch Pro' },
  { name: 'Quantum Systems', size: 'Enterprise', industry: 'Technology', deal: 295000, stage: 'closed_lost', region: 'APAC', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Summit Brands', size: 'Enterprise', industry: 'Consumer Goods', deal: 550000, stage: 'negotiation', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Fjord Mobility', size: 'Enterprise', industry: 'Automotive', deal: 340000, stage: 'disco_set', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Trident Energy', size: 'Mid-Market', industry: 'Energy', deal: 210000, stage: 'disco_set', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Lumina Sciences', size: 'Enterprise', industry: 'Pharma', deal: 480000, stage: 'eval_planning', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Sterling Robotics', size: 'Enterprise', industry: 'Industrial', deal: 320000, stage: 'disco_completed', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  // Additional accounts for richer data
  { name: 'Helios Power', size: 'Enterprise', industry: 'Energy', deal: 460000, stage: 'closed_won', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Nexus Pharma', size: 'Enterprise', industry: 'Pharma', deal: 530000, stage: 'closed_won', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Harbor Foods', size: 'Enterprise', industry: 'Consumer Goods', deal: 280000, stage: 'closed_lost', region: 'NA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Austral Mining', size: 'Enterprise', industry: 'Mining', deal: 395000, stage: 'closed_won', region: 'APAC', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Crest Automotive', size: 'Mid-Market', industry: 'Automotive', deal: 175000, stage: 'closed_lost', region: 'EMEA', deal_type: 'New Logo', product_line: 'CloudWatch Pro' },
  { name: 'Precision Medical', size: 'Enterprise', industry: 'Medical Devices', deal: 415000, stage: 'closed_won', region: 'NA', deal_type: 'Expansion', product_line: 'CloudWatch Pro' },
  // PipelineIQ accounts (for cross-sell analysis)
  { name: 'Apex Financial', size: 'Enterprise', industry: 'Financial Services', deal: 320000, stage: 'eval_planning', region: 'EMEA', deal_type: 'Expansion', product_line: 'PipelineIQ' },
  { name: 'Stratton Consulting', size: 'Enterprise', industry: 'Professional Services', deal: 245000, stage: 'disco_completed', region: 'NA', deal_type: 'Expansion', product_line: 'PipelineIQ' },
  { name: 'Zenith Motors', size: 'Enterprise', industry: 'Automotive', deal: 410000, stage: 'solution_accepted', region: 'APAC', deal_type: 'Expansion', product_line: 'PipelineIQ' },
  { name: 'Vantage Logistics', size: 'Enterprise', industry: 'Logistics', deal: 280000, stage: 'disco_set', region: 'EMEA', deal_type: 'Expansion', product_line: 'PipelineIQ' },
  { name: 'Cascade Pharma', size: 'Enterprise', industry: 'Pharma', deal: 195000, stage: 'negotiation', region: 'NA', deal_type: 'Expansion', product_line: 'PipelineIQ' },
  { name: 'NovaTech Solutions', size: 'Enterprise', industry: 'Technology', deal: 350000, stage: 'eval_planning', region: 'EMEA', deal_type: 'Expansion', product_line: 'PipelineIQ' },
];

// ---- Stage progression data ----
const STAGE_ORDER = ['disco_set', 'disco_completed', 'solution_accepted', 'eval_planning', 'negotiation', 'closed_won', 'closed_lost'];

function getStageIndex(stage: string): number {
  if (stage === 'closed_lost') return Math.floor(seededRandom() * 4) + 1; // lost at random stage
  return STAGE_ORDER.indexOf(stage);
}

function generateStageHistory(stage: string, createdDate: string): StageHistoryEntry[] {
  const history: StageHistoryEntry[] = [];
  const targetIdx = stage === 'closed_lost' ? Math.floor(seededRandom() * 4) + 1 : STAGE_ORDER.indexOf(stage);
  const baseDate = new Date(createdDate);

  for (let i = 0; i <= Math.min(targetIdx, 4); i++) {
    const daysOffset = i * (8 + Math.floor(seededRandom() * 25));
    const entryDate = new Date(baseDate.getTime() + daysOffset * 86400000);
    const daysInStage = 5 + Math.floor(seededRandom() * 30);
    history.push({
      stage: i <= 4 ? STAGE_ORDER[i] : stage,
      entered_date: entryDate.toISOString().split('T')[0],
      days_in_stage: daysInStage,
    });
  }

  if (stage === 'closed_won' || stage === 'closed_lost') {
    const lastEntry = history[history.length - 1];
    const lastDate = new Date(lastEntry.entered_date);
    const finalDate = new Date(lastDate.getTime() + (5 + Math.floor(seededRandom() * 20)) * 86400000);
    history.push({
      stage,
      entered_date: finalDate.toISOString().split('T')[0],
      days_in_stage: 0,
    });
  }

  return history;
}

// ---- Winning sequence patterns (per spec appendix) ----
// Won deals get planted winning patterns
function generateWonDealTouchpoints(
  acc: AccountBase,
  accountId: string,
  oppId: string,
  contactId: string,
  createdDate: string,
): UnifiedTouchpoint[] {
  const touches: UnifiedTouchpoint[] = [];
  let tpIdx = 0;
  const baseDate = new Date(createdDate);

  const common = {
    account_id: accountId,
    account_name: acc.name,
    opportunity_id: oppId,
    contact_id: contactId,
    deal_type: acc.deal_type,
    product_line: acc.product_line,
    segment: acc.size,
    stage: acc.stage,
    deal_amount: acc.deal,
    region: acc.region,
    industry: acc.industry,
  };

  function makeDate(daysOffset: number): string {
    const d = new Date(baseDate.getTime() + daysOffset * 86400000);
    return d.toISOString().split('T')[0];
  }

  // Pick one of the winning sequence patterns
  const pattern = Math.floor(seededRandom() * 3);

  if (pattern === 0) {
    // Pattern A: LinkedIn Ad → KubeCon → Nurture click → BDR call → Demo form
    const liCamp = pick(LINKEDIN_CAMPAIGNS);
    const liAd = pick(AD_CREATIVES);
    const adAcct = pick(AD_ACCOUNTS);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(0),
      source_system: 'linkedin', channel: 'linkedin_ads', activity_type: 'ad_click',
      interaction_detail: `Clicked ad: ${liAd}`,
      campaign_name: liCamp, ad_creative: liAd, ad_format: 'Single Image',
      spend: 15 + Math.floor(seededRandom() * 40),
      ad_account_id: adAcct.id, ad_account_name: adAcct.name,
      utm_source: 'linkedin', utm_medium: 'paid-social', utm_campaign: 'cwp-cloud-migration-platform-eng',
    });
    // Web visit from LinkedIn
    const page = pick(PAGE_URLS.slice(0, 4));
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(0),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: `Visited ${page.title}`,
      page_url: page.url, page_title: page.title, referrer_url: 'https://www.linkedin.com/',
    });
    // KubeCon attended (key win signal)
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(14 + Math.floor(seededRandom() * 20)),
      source_system: 'salesforce', channel: 'event', activity_type: 'event_attended',
      interaction_detail: 'Attended KubeCon NA 2025',
      event_name: 'KubeCon NA 2025', event_type: 'conference',
    });
    // Pricing page visit (key win signal)
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(35 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: 'Visited pricing page',
      page_url: '/pricing/', page_title: 'CloudWatch Pro Pricing',
    });
    // Nurture email click
    const prog = pick(EMAIL_PROGRAMS.slice(0, 2));
    const email = pick(EMAIL_NAMES.slice(0, 3));
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(42 + Math.floor(seededRandom() * 15)),
      source_system: 'marketo', channel: 'email_nurture', activity_type: 'email_click',
      interaction_detail: `Clicked link in ${email}`,
      program_name: prog, email_name: email, link_clicked: '/roi-calculator/',
    });
    // BDR call connected (key win signal)
    const seq = pick(BDR_SEQUENCES.slice(0, 3));
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(55 + Math.floor(seededRandom() * 10)),
      source_system: 'outreach', channel: 'bdr_call', activity_type: 'call_connected',
      interaction_detail: `Connected call — discussed cloud migration timeline`,
      bdr_sequence: seq, bdr_step_number: 3, bdr_step_type: 'call', bdr_outcome: 'connected',
    });
    // ROI Calculator (key win signal)
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(62 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'content_download', activity_type: 'content_downloaded',
      interaction_detail: 'Completed ROI Calculator',
      content_asset: 'CloudWatch Pro ROI Calculator Results', asset_type: 'roi_calculator',
      page_url: '/roi-calculator/',
    });
    // Demo form fill
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(70 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'form_submission', activity_type: 'form_fill',
      interaction_detail: 'Submitted demo request form',
      page_url: '/demo/quick/', page_title: 'Request a Demo',
    });
  } else if (pattern === 1) {
    // Pattern B: Content download → Webinar → BDR email reply → Pricing page
    const asset = pick(CONTENT_ASSETS.slice(0, 5));
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(0),
      source_system: 'marketo', channel: 'content_download', activity_type: 'content_downloaded',
      interaction_detail: `Downloaded ${asset.name}`,
      content_asset: asset.name, asset_type: asset.type,
      page_url: '/resources/whitepaper/sap-migration/', referrer_url: 'https://www.google.com/',
    });
    // Web visit
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(3),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: 'Visited solutions page',
      page_url: '/solutions/sap/', page_title: 'Kubernetes Monitoring Solutions', referrer_url: 'https://www.google.com/',
    });
    // Webinar attended
    const webinar = pick(EVENTS.filter(e => e.type === 'webinar'));
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(18 + Math.floor(seededRandom() * 10)),
      source_system: 'salesforce', channel: 'webinar', activity_type: 'webinar_attended',
      interaction_detail: `Attended ${webinar.name}`,
      event_name: webinar.name, event_type: 'webinar',
    });
    // BDR email reply
    const seq = pick(BDR_SEQUENCES);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(30 + Math.floor(seededRandom() * 10)),
      source_system: 'outreach', channel: 'bdr_email', activity_type: 'email_click',
      interaction_detail: 'Replied to BDR email — interested in demo',
      bdr_sequence: seq, bdr_step_number: 2, bdr_step_type: 'email', bdr_outcome: 'replied',
    });
    // Pricing page
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(40 + Math.floor(seededRandom() * 8)),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: 'Visited pricing page',
      page_url: '/pricing/', page_title: 'CloudWatch Pro Pricing',
    });
    // Case study download
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(45 + Math.floor(seededRandom() * 8)),
      source_system: 'marketo', channel: 'content_download', activity_type: 'content_downloaded',
      interaction_detail: 'Downloaded Apex Financial Case Study',
      content_asset: 'Apex Financial Case Study', asset_type: 'case_study',
    });
    // Form fill
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(52 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'form_submission', activity_type: 'form_fill',
      interaction_detail: 'Submitted demo request',
      page_url: '/demo/quick/', page_title: 'Request a Demo',
    });
  } else {
    // Pattern C: BDR cold call → Email nurture → Event invite → Event attended → Form fill
    const seq = pick(BDR_SEQUENCES);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(0),
      source_system: 'outreach', channel: 'bdr_call', activity_type: 'call_connected',
      interaction_detail: 'Cold call — discussed observability pain points',
      bdr_sequence: seq, bdr_step_number: 1, bdr_step_type: 'call', bdr_outcome: 'connected',
    });
    // BDR email follow-up
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(2),
      source_system: 'outreach', channel: 'bdr_email', activity_type: 'email_click',
      interaction_detail: 'Opened BDR follow-up email with case study',
      bdr_sequence: seq, bdr_step_number: 2, bdr_step_type: 'email', bdr_outcome: 'opened',
    });
    // Email nurture enrolled
    const prog = pick(EMAIL_PROGRAMS.slice(0, 2));
    const email = pick(EMAIL_NAMES);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(10 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'email_nurture', activity_type: 'email_click',
      interaction_detail: `Clicked link in ${email}`,
      program_name: prog, email_name: email, link_clicked: '/solutions/sap/',
    });
    // Web visits
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(20 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: 'Visited platform page',
      page_url: '/platform/', page_title: 'CloudWatch Pro Platform Overview',
    });
    // Event attended
    const event = pick(EVENTS.filter(e => e.type === 'conference'));
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(35 + Math.floor(seededRandom() * 15)),
      source_system: 'salesforce', channel: 'event', activity_type: 'event_attended',
      interaction_detail: `Attended ${event.name}`,
      event_name: event.name, event_type: event.type,
    });
    // Pricing page
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(50 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: 'Visited pricing page',
      page_url: '/pricing/', page_title: 'CloudWatch Pro Pricing',
    });
    // Form fill
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(58 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'form_submission', activity_type: 'form_fill',
      interaction_detail: 'Submitted migration assessment form',
      page_url: '/migration/', page_title: 'Migration Assessment',
    });
  }

  // Add some extra random touches for more realism
  const extraCount = 2 + Math.floor(seededRandom() * 5);
  for (let i = 0; i < extraCount; i++) {
    const tp = generateRandomTouchpoint(acc, accountId, oppId, contactId, `${oppId}-tp-${tpIdx++}`, makeDate(Math.floor(seededRandom() * 80)), true);
    touches.push(tp);
  }

  return touches.sort((a, b) => a.date.localeCompare(b.date));
}

// Lost deals: single-channel, newsletter-only, short journeys (per spec appendix)
function generateLostDealTouchpoints(
  acc: AccountBase,
  accountId: string,
  oppId: string,
  contactId: string,
  createdDate: string,
): UnifiedTouchpoint[] {
  const touches: UnifiedTouchpoint[] = [];
  let tpIdx = 0;
  const baseDate = new Date(createdDate);

  const common = {
    account_id: accountId,
    account_name: acc.name,
    opportunity_id: oppId,
    contact_id: contactId,
    deal_type: acc.deal_type,
    product_line: acc.product_line,
    segment: acc.size,
    stage: acc.stage,
    deal_amount: acc.deal,
    region: acc.region,
    industry: acc.industry,
  };

  function makeDate(daysOffset: number): string {
    const d = new Date(baseDate.getTime() + daysOffset * 86400000);
    return d.toISOString().split('T')[0];
  }

  const pattern = Math.floor(seededRandom() * 3);

  if (pattern === 0) {
    // Pattern: LinkedIn Ad → Form fill only (missing middle)
    const liCamp = pick(LINKEDIN_CAMPAIGNS);
    const liAd = pick(AD_CREATIVES);
    const adAcct = pick(AD_ACCOUNTS);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(0),
      source_system: 'linkedin', channel: 'linkedin_ads', activity_type: 'ad_click',
      interaction_detail: `Clicked ad: ${liAd}`,
      campaign_name: liCamp, ad_creative: liAd, ad_format: 'Single Image',
      spend: 20 + Math.floor(seededRandom() * 30),
      ad_account_id: adAcct.id, ad_account_name: adAcct.name,
      utm_source: 'linkedin', utm_medium: 'paid-social', utm_campaign: 'cwp-generic',
    });
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(5 + Math.floor(seededRandom() * 10)),
      source_system: 'marketo', channel: 'form_submission', activity_type: 'form_fill',
      interaction_detail: 'Submitted contact form',
      page_url: '/contact-us/', page_title: 'Contact Us',
    });
  } else if (pattern === 1) {
    // Pattern: Newsletter-only touches
    for (let i = 0; i < 3 + Math.floor(seededRandom() * 3); i++) {
      const prog = pick(EMAIL_PROGRAMS.slice(2, 4));
      const email = pick(EMAIL_NAMES.slice(5, 7));
      touches.push({
        ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(i * 14 + Math.floor(seededRandom() * 7)),
        source_system: 'marketo', channel: 'email_newsletter',
        activity_type: seededRandom() > 0.5 ? 'email_open' : 'email_click',
        interaction_detail: `${seededRandom() > 0.5 ? 'Opened' : 'Clicked'} newsletter: ${email}`,
        program_name: prog, email_name: email,
      });
    }
  } else {
    // Pattern: Single web visit + BDR voicemail
    const page = pick(PAGE_URLS);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(0),
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: `Visited ${page.title}`,
      page_url: page.url, page_title: page.title, referrer_url: 'https://www.google.com/',
    });
    const seq = pick(BDR_SEQUENCES);
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(5),
      source_system: 'outreach', channel: 'bdr_call', activity_type: 'call_voicemail',
      interaction_detail: 'Left voicemail — no response',
      bdr_sequence: seq, bdr_step_number: 1, bdr_step_type: 'call', bdr_outcome: 'voicemail',
    });
    touches.push({
      ...common, touchpoint_id: `${oppId}-tp-${tpIdx++}`, date: makeDate(8),
      source_system: 'outreach', channel: 'bdr_email', activity_type: 'email_open',
      interaction_detail: 'Opened BDR email but did not reply',
      bdr_sequence: seq, bdr_step_number: 2, bdr_step_type: 'email', bdr_outcome: 'delivered',
    });
  }

  return touches.sort((a, b) => a.date.localeCompare(b.date));
}

// General touchpoints for in-progress deals
function generateRandomTouchpoint(
  acc: AccountBase,
  accountId: string,
  oppId: string,
  contactId: string,
  tpId: string,
  date: string,
  isWon: boolean,
): UnifiedTouchpoint {
  const common = {
    account_id: accountId,
    account_name: acc.name,
    opportunity_id: oppId,
    contact_id: contactId,
    deal_type: acc.deal_type,
    product_line: acc.product_line,
    segment: acc.size,
    stage: acc.stage,
    deal_amount: acc.deal,
    region: acc.region,
    industry: acc.industry,
  };

  // For won-leaning accounts, bias toward high-value activities
  const channelWeights: [EnrichedChannel, number][] = isWon
    ? [
        ['linkedin_ads', 0.11], ['organic_social', 0.04], ['email_nurture', 0.14], ['email_newsletter', 0.05],
        ['web_visit', 0.19], ['form_submission', 0.08], ['event', 0.09],
        ['webinar', 0.08], ['bdr_email', 0.06], ['bdr_call', 0.06],
        ['bdr_linkedin', 0.02], ['content_download', 0.08],
      ]
    : [
        ['linkedin_ads', 0.09], ['organic_social', 0.06], ['email_nurture', 0.08], ['email_newsletter', 0.19],
        ['web_visit', 0.17], ['form_submission', 0.05], ['event', 0.04],
        ['webinar', 0.04], ['bdr_email', 0.09], ['bdr_call', 0.07],
        ['bdr_linkedin', 0.05], ['content_download', 0.07],
      ];

  const channel = weightedPick(
    channelWeights.map(c => c[0]),
    channelWeights.map(c => c[1]),
  );

  const base = { ...common, touchpoint_id: tpId, date };

  switch (channel) {
    case 'linkedin_ads': {
      const camp = pick(LINKEDIN_CAMPAIGNS);
      const ad = pick(AD_CREATIVES);
      const adAcct = pick(AD_ACCOUNTS);
      return {
        ...base, source_system: 'linkedin', channel,
        activity_type: seededRandom() > 0.3 ? 'ad_click' : 'ad_impression',
        interaction_detail: `${seededRandom() > 0.3 ? 'Clicked' : 'Saw'} ad: ${ad}`,
        campaign_name: camp, ad_creative: ad, ad_format: pick(['Single Image', 'Video', 'Carousel']),
        spend: 10 + Math.floor(seededRandom() * 50),
        ad_account_id: adAcct.id, ad_account_name: adAcct.name,
        utm_source: 'linkedin', utm_medium: 'paid-social', utm_campaign: camp.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
    }
    case 'organic_social': {
      const post = pick(ORGANIC_SOCIAL_POSTS);
      return {
        ...base, source_system: 'linkedin', channel, activity_type: 'social_engagement',
        interaction_detail: post.detail,
        social_platform: 'linkedin', social_post_type: post.postType,
      };
    }
    case 'email_nurture': {
      const prog = pick(EMAIL_PROGRAMS.slice(0, 2));
      const email = pick(EMAIL_NAMES.slice(0, 5));
      return {
        ...base, source_system: 'marketo', channel,
        activity_type: seededRandom() > 0.4 ? 'email_click' : 'email_open',
        interaction_detail: `${seededRandom() > 0.4 ? 'Clicked' : 'Opened'} ${email}`,
        program_name: prog, email_name: email,
        link_clicked: seededRandom() > 0.5 ? pick(PAGE_URLS).url : undefined,
      };
    }
    case 'email_newsletter': {
      const prog = pick(EMAIL_PROGRAMS.slice(2, 4));
      const email = pick(EMAIL_NAMES.slice(5, 7));
      return {
        ...base, source_system: 'marketo', channel,
        activity_type: seededRandom() > 0.3 ? 'email_open' : 'email_click',
        interaction_detail: `${seededRandom() > 0.3 ? 'Opened' : 'Clicked'} newsletter: ${email}`,
        program_name: prog, email_name: email,
      };
    }
    case 'web_visit': {
      const page = pick(PAGE_URLS);
      return {
        ...base, source_system: 'marketo', channel, activity_type: 'page_visit',
        interaction_detail: `Visited ${page.title}`,
        page_url: page.url, page_title: page.title,
        referrer_url: pick(['https://www.google.com/', 'https://www.linkedin.com/', 'https://www.bing.com/', '']),
      };
    }
    case 'form_submission': {
      const page = pick(PAGE_URLS.slice(0, 5));
      return {
        ...base, source_system: 'marketo', channel, activity_type: 'form_fill',
        interaction_detail: `Submitted form on ${page.title}`,
        page_url: page.url, page_title: page.title,
      };
    }
    case 'event': {
      const ev = pick(EVENTS.filter(e => e.type === 'conference' || e.type === 'customer_summit'));
      return {
        ...base, source_system: 'salesforce', channel, activity_type: 'event_attended',
        interaction_detail: `Attended ${ev.name}`,
        event_name: ev.name, event_type: ev.type,
      };
    }
    case 'webinar': {
      const ev = pick(EVENTS.filter(e => e.type === 'webinar'));
      const attended = seededRandom() > 0.3;
      return {
        ...base, source_system: 'salesforce', channel,
        activity_type: attended ? 'webinar_attended' : 'webinar_registered',
        interaction_detail: `${attended ? 'Attended' : 'Registered for'} ${ev.name}`,
        event_name: ev.name, event_type: 'webinar',
      };
    }
    case 'bdr_email': {
      const seq = pick(BDR_SEQUENCES);
      const step = 1 + Math.floor(seededRandom() * 5);
      const outcome = pick(['delivered', 'opened', 'clicked', 'replied', 'bounced']);
      return {
        ...base, source_system: 'outreach', channel, activity_type: 'email_open',
        interaction_detail: `BDR email step ${step}: ${outcome}`,
        bdr_sequence: seq, bdr_step_number: step, bdr_step_type: 'email', bdr_outcome: outcome,
      };
    }
    case 'bdr_call': {
      const seq = pick(BDR_SEQUENCES);
      const step = 1 + Math.floor(seededRandom() * 4);
      const outcome = pick(['connected', 'voicemail', 'no_answer', 'gatekeeper']);
      return {
        ...base, source_system: 'outreach', channel,
        activity_type: outcome === 'connected' ? 'call_connected' : 'call_voicemail',
        interaction_detail: `BDR call step ${step}: ${outcome}`,
        bdr_sequence: seq, bdr_step_number: step, bdr_step_type: 'call', bdr_outcome: outcome,
      };
    }
    case 'bdr_linkedin': {
      const seq = pick(BDR_SEQUENCES);
      const outcome = pick(['connection_sent', 'connection_accepted', 'message_sent', 'message_replied']);
      return {
        ...base, source_system: 'outreach', channel, activity_type: 'ad_click',
        interaction_detail: `BDR LinkedIn: ${outcome}`,
        bdr_sequence: seq, bdr_step_number: 1, bdr_step_type: 'linkedin', bdr_outcome: outcome,
      };
    }
    case 'content_download': {
      const asset = pick(CONTENT_ASSETS);
      return {
        ...base, source_system: 'marketo', channel, activity_type: 'content_downloaded',
        interaction_detail: `Downloaded ${asset.name}`,
        content_asset: asset.name, asset_type: asset.type,
      };
    }
  }
}

function generateInProgressDealTouchpoints(
  acc: AccountBase,
  accountId: string,
  oppId: string,
  contactId: string,
  createdDate: string,
): UnifiedTouchpoint[] {
  const touches: UnifiedTouchpoint[] = [];
  const numTouches = 4 + Math.floor(seededRandom() * 10);
  const baseDate = new Date(createdDate);

  // More advanced stages should look more like won deals
  const stageIdx = getStageIndex(acc.stage);
  const isWonLeaning = stageIdx >= 3; // eval_planning or later

  for (let i = 0; i < numTouches; i++) {
    const daysOffset = Math.floor((i / numTouches) * 90);
    const d = new Date(baseDate.getTime() + daysOffset * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const tp = generateRandomTouchpoint(acc, accountId, oppId, contactId, `${oppId}-tp-${i}`, dateStr, isWonLeaning);
    touches.push(tp);
  }

  // If won-leaning, ensure some key signals
  if (isWonLeaning && seededRandom() > 0.3) {
    const d = new Date(baseDate.getTime() + 45 * 86400000);
    touches.push({
      account_id: accountId, account_name: acc.name, opportunity_id: oppId, contact_id: contactId,
      deal_type: acc.deal_type, product_line: acc.product_line, segment: acc.size,
      stage: acc.stage, deal_amount: acc.deal, region: acc.region, industry: acc.industry,
      touchpoint_id: `${oppId}-tp-${numTouches}`, date: d.toISOString().split('T')[0],
      source_system: 'marketo', channel: 'web_visit', activity_type: 'page_visit',
      interaction_detail: 'Visited pricing page',
      page_url: '/pricing/', page_title: 'CloudWatch Pro Pricing',
    });
  }

  return touches.sort((a, b) => a.date.localeCompare(b.date));
}

// ---- Buying Committee Generation (for ABM) ----

const COMMITTEE_NAMES: Record<ContactRole, { names: string[]; titles: string[] }> = {
  champion: {
    names: ['Alex Thompson', 'Maria Garcia', 'James Liu', 'Sarah Miller', 'Daniel Kim'],
    titles: ['VP IT Operations', 'Sr Director IT', 'Head of Automation', 'VP Technology', 'Director Enterprise Apps'],
  },
  economic_buyer: {
    names: ['Richard Chen', 'Katherine Hayes', 'Robert Mueller', 'Patricia Singh', 'Thomas Park'],
    titles: ['CIO', 'CFO', 'SVP Technology', 'CTO', 'VP Finance & IT'],
  },
  technical_evaluator: {
    names: ['Priya Sharma', 'Kevin Zhang', 'Lisa Andersen', 'Marcus Williams', 'Anna Kowalski'],
    titles: ['Sr Systems Architect', 'SAP Basis Lead', 'IT Infrastructure Manager', 'DevOps Lead', 'Platform Engineer'],
  },
  influencer: {
    names: ['Emily Watson', 'David Rodriguez', 'Jennifer Lee', 'Chris Brown', 'Michelle Davis'],
    titles: ['Director of IT Strategy', 'Sr Business Analyst', 'PMO Director', 'VP Digital Transformation', 'Head of Procurement'],
  },
  blocker: {
    names: ['Steven Clark', 'Andrew Hoffman', 'Laura Fischer', 'George Nelson', 'Diana Ross'],
    titles: ['VP Legacy Systems', 'Sr Director Compliance', 'Head of Vendor Management', 'Security Architect', 'Risk Manager'],
  },
};

const SENIORITY_BY_ROLE: Record<ContactRole, ContactSeniority[]> = {
  champion: ['VP', 'Director'],
  economic_buyer: ['C-Level', 'VP'],
  technical_evaluator: ['Manager', 'Individual Contributor', 'Director'],
  influencer: ['Director', 'VP', 'Manager'],
  blocker: ['VP', 'Director'],
};

function generateBuyingCommittee(
  accountName: string,
  accountTouchpoints: UnifiedTouchpoint[],
  contactIdBase: string,
  stage: string,
): BuyingCommitteeMember[] {
  const roles: ContactRole[] = ['champion', 'economic_buyer', 'technical_evaluator', 'influencer'];
  // More advanced deals have more committee members
  const stageIdx = STAGE_ORDER.indexOf(stage);
  const memberCount = Math.min(2 + Math.floor(stageIdx * 0.8), 5);

  // Add blocker for some deals
  if (seededRandom() > 0.6 && memberCount >= 3) {
    roles.push('blocker');
  }

  const members: BuyingCommitteeMember[] = [];
  const domain = accountName.toLowerCase().replace(/[^a-z]/g, '') + '.com';

  for (let i = 0; i < Math.min(memberCount, roles.length); i++) {
    const role = roles[i];
    const roleData = COMMITTEE_NAMES[role];
    const name = roleData.names[Math.floor(seededRandom() * roleData.names.length)];
    const title = roleData.titles[Math.floor(seededRandom() * roleData.titles.length)];
    const seniority = SENIORITY_BY_ROLE[role][Math.floor(seededRandom() * SENIORITY_BY_ROLE[role].length)];

    // Distribute touchpoints across committee members
    const memberTouchpoints = accountTouchpoints.filter(() => seededRandom() > 0.5);
    const channels = [...new Set(memberTouchpoints.map(tp => tp.channel))];
    const lastActivity = memberTouchpoints.length > 0
      ? memberTouchpoints[memberTouchpoints.length - 1].date
      : '2025-06-01';

    // Champions and evaluators tend to have higher engagement
    const baseScore = role === 'champion' ? 65 : role === 'technical_evaluator' ? 55 : role === 'economic_buyer' ? 40 : role === 'blocker' ? 15 : 35;
    const engagementScore = Math.min(100, Math.max(0, baseScore + Math.floor(seededRandom() * 30) - 10));

    members.push({
      contact_id: `${contactIdBase}-c${i}`,
      name,
      title,
      role,
      seniority,
      email_domain: domain,
      engagement_score: engagementScore,
      last_activity_date: lastActivity,
      touchpoint_count: memberTouchpoints.length,
      channels_engaged: channels as EnrichedChannel[],
    });
  }

  return members;
}

// ---- Account-level engagement scoring ----

function computeEngagementScore(touchpoints: UnifiedTouchpoint[], stage: string): { score: number; tier: 'hot' | 'warm' | 'cold' } {
  const now = new Date('2026-01-31');
  const recencyDays = touchpoints.length > 0
    ? (now.getTime() - new Date(touchpoints[touchpoints.length - 1].date).getTime()) / 86400000
    : 365;

  const recencyScore = Math.max(0, 100 - recencyDays * 1.5);
  const frequencyScore = Math.min(100, touchpoints.length * 8);
  const breadthScore = Math.min(100, new Set(touchpoints.map(tp => tp.channel)).size * 18);

  const score = Math.round(recencyScore * 0.35 + frequencyScore * 0.35 + breadthScore * 0.3);
  const tier = score >= 65 ? 'hot' : score >= 35 ? 'warm' : 'cold';

  return { score, tier };
}

// ============================================================
// GENERATE ALL ENRICHED DATA
// ============================================================
function generateEnrichedData(): EnrichedAccount[] {
  seed = 42; // Reset seed for determinism

  const accounts = ACCOUNTS_BASE.map((acc, idx) => {
    const accountId = `001Dn${String(idx).padStart(6, '0')}`;
    const oppId = `006Dn${String(idx).padStart(6, '0')}`;
    const contactId = `003Dn${String(idx).padStart(6, '0')}`;
    const months = ['2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07'];
    const createdMonth = pick(months);
    const day = String(1 + Math.floor(seededRandom() * 28)).padStart(2, '0');
    const createdDate = `${createdMonth}-${day}`;

    // Close date is 3-8 months after creation for closed deals
    const createdDateObj = new Date(createdDate);
    const closeOffset = 90 + Math.floor(seededRandom() * 150);
    const closeDateObj = new Date(createdDateObj.getTime() + closeOffset * 86400000);
    const closeDate = closeDateObj.toISOString().split('T')[0];

    let touchpoints: UnifiedTouchpoint[];
    if (acc.stage === 'closed_won') {
      touchpoints = generateWonDealTouchpoints(acc, accountId, oppId, contactId, createdDate);
    } else if (acc.stage === 'closed_lost') {
      touchpoints = generateLostDealTouchpoints(acc, accountId, oppId, contactId, createdDate);
    } else {
      touchpoints = generateInProgressDealTouchpoints(acc, accountId, oppId, contactId, createdDate);
    }

    const stageHistory = generateStageHistory(acc.stage, createdDate);
    const { score: engScore, tier: engTier } = computeEngagementScore(touchpoints, acc.stage);
    const buyingCommittee = generateBuyingCommittee(acc.name, touchpoints, contactId, acc.stage);

    return {
      account_id: accountId,
      account_name: acc.name,
      opportunity_id: oppId,
      opportunity_name: `${acc.name} — ${acc.product_line === 'PipelineIQ' ? 'PIQ' : 'CWP'} ${acc.deal_type === 'Expansion' ? 'Expansion' : 'Enterprise'}`,
      deal_amount: acc.deal,
      stage: acc.stage,
      deal_type: acc.deal_type,
      product_line: acc.product_line,
      segment: acc.size,
      region: acc.region,
      industry: acc.industry,
      owner: pick(OWNERS),
      bdr: pick(BDRS),
      created_date: createdDate,
      close_date: closeDate,
      lead_source: pick(LEAD_SOURCES),
      stage_history: stageHistory,
      touchpoints,
      buying_committee: buyingCommittee,
      engagement_score: engScore,
      engagement_tier: engTier,
      cross_sell_opportunity_id: undefined as string | undefined,
    };
  });

  // Link cross-sell opportunities
  const crossSellPairs = [
    ['Apex Financial', 'CloudWatch Pro', 'PipelineIQ'],
    ['Stratton Consulting', 'CloudWatch Pro', 'PipelineIQ'],
    ['Zenith Motors', 'CloudWatch Pro', 'PipelineIQ'],
    ['Vantage Logistics', 'CloudWatch Pro', 'PipelineIQ'],
    ['Cascade Pharma', 'CloudWatch Pro', 'PipelineIQ'],
    ['NovaTech Solutions', 'CloudWatch Pro', 'PipelineIQ'],
  ];

  for (const [name, primary, secondary] of crossSellPairs) {
    const primaryAcc = accounts.find(a => a.account_name === name && a.product_line === primary);
    const secondaryAcc = accounts.find(a => a.account_name === name && a.product_line === secondary);
    if (primaryAcc && secondaryAcc) {
      primaryAcc.cross_sell_opportunity_id = secondaryAcc.opportunity_id;
      secondaryAcc.cross_sell_opportunity_id = primaryAcc.opportunity_id;
    }
  }

  return accounts;
}

export const ENRICHED_DATA: EnrichedAccount[] = generateEnrichedData();

// All touchpoints flattened for analysis
export const ALL_TOUCHPOINTS: UnifiedTouchpoint[] = ENRICHED_DATA.flatMap(a => a.touchpoints);
