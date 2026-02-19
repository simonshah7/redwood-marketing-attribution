// ============================================================
// ENRICHED DATA MODEL — RunMyJobs Marketing Attribution
// Spec2: UnifiedTouchpoint + EnrichedAccount schemas
// ============================================================

export type DealType = 'New Logo' | 'Expansion';
export type ProductLine = 'RunMyJobs' | 'Finance Automation';
export type Segment = 'Enterprise' | 'Mid-Market';
export type SourceSystem = 'salesforce' | 'marketo' | 'linkedin' | 'outreach';

export type EnrichedChannel =
  | 'linkedin_ads'
  | 'organic_social'
  | 'email_nurture'
  | 'email_newsletter'
  | 'web_visit'
  | 'form_submission'
  | 'event'
  | 'webinar'
  | 'bdr_email'
  | 'bdr_call'
  | 'bdr_linkedin'
  | 'content_download';

export type ActivityType =
  | 'email_open'
  | 'email_click'
  | 'page_visit'
  | 'form_fill'
  | 'ad_click'
  | 'ad_impression'
  | 'social_engagement'
  | 'call_connected'
  | 'call_voicemail'
  | 'event_attended'
  | 'webinar_registered'
  | 'webinar_attended'
  | 'content_downloaded';

export type AssetType =
  | 'whitepaper'
  | 'datasheet'
  | 'case_study'
  | 'webinar_recording'
  | 'guide'
  | 'roi_calculator'
  | 'infographic'
  | 'video';

export type BDRStepType = 'email' | 'call' | 'linkedin' | 'manual';

export interface UnifiedTouchpoint {
  // Identity & Linkage
  touchpoint_id: string;
  account_id: string;
  account_name: string;
  opportunity_id: string;
  contact_id: string;

  // Opportunity Context (denormalized)
  deal_type: DealType;
  product_line: ProductLine;
  segment: Segment;
  stage: string;
  deal_amount: number;
  region: string;
  industry: string;

  // Touchpoint Core
  date: string;
  source_system: SourceSystem;
  channel: EnrichedChannel;

  // Activity Detail
  activity_type: ActivityType;
  interaction_detail: string;

  // Channel-Specific Fields (nullable)
  // Web
  page_url?: string;
  page_title?: string;
  referrer_url?: string;

  // Content
  content_asset?: string;
  asset_type?: AssetType;

  // Email
  program_name?: string;
  email_name?: string;
  link_clicked?: string;

  // LinkedIn / Paid Social
  campaign_name?: string;
  ad_creative?: string;
  ad_format?: string;
  spend?: number;
  ad_account_id?: string;
  ad_account_name?: string;

  // Organic Social
  social_platform?: string;
  social_post_type?: string;

  // Events
  event_name?: string;
  event_type?: 'conference' | 'webinar' | 'workshop' | 'customer_summit';

  // BDR
  bdr_sequence?: string;
  bdr_step_number?: number;
  bdr_step_type?: BDRStepType;
  bdr_outcome?: string;

  // UTM (for paid traffic)
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface StageHistoryEntry {
  stage: string;
  entered_date: string;
  days_in_stage: number;
}

// ============================================================
// BUYING COMMITTEE & CONTACT ROLES (for ABM Command Centre)
// ============================================================
export type ContactRole = 'champion' | 'economic_buyer' | 'technical_evaluator' | 'influencer' | 'blocker';
export type ContactSeniority = 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor';

export interface BuyingCommitteeMember {
  contact_id: string;
  name: string;
  title: string;
  role: ContactRole;
  seniority: ContactSeniority;
  email_domain: string;
  engagement_score: number; // 0-100
  last_activity_date: string;
  touchpoint_count: number;
  channels_engaged: EnrichedChannel[];
}

export interface EnrichedAccount {
  // Core (from Salesforce Opp)
  account_id: string;
  account_name: string;
  opportunity_id: string;
  opportunity_name: string;
  deal_amount: number;
  stage: string;
  deal_type: DealType;
  product_line: ProductLine;
  segment: Segment;
  region: string;
  industry: string;
  owner: string;
  bdr: string;
  created_date: string;
  close_date: string;
  lead_source: string;

  // Stage velocity
  stage_history: StageHistoryEntry[];

  // All touchpoints (unified)
  touchpoints: UnifiedTouchpoint[];

  // ABM & Cross-sell extensions
  buying_committee?: BuyingCommitteeMember[];
  engagement_score?: number;
  engagement_tier?: 'hot' | 'warm' | 'cold';
  cross_sell_opportunity_id?: string;
}

// ============================================================
// ENRICHED CHANNEL INFO
// ============================================================
export interface EnrichedChannelInfo {
  name: string;
  color: string;
  shortName: string;
  icon: string;
}

export const ENRICHED_CHANNELS: Record<EnrichedChannel, EnrichedChannelInfo> = {
  linkedin_ads:      { name: 'LinkedIn Ads',       color: 'hsl(200, 65%, 50%)', shortName: 'LinkedIn',  icon: 'linkedin' },
  organic_social:    { name: 'Organic Social',     color: 'hsl(195, 55%, 45%)', shortName: 'Organic',   icon: 'share2' },
  email_nurture:     { name: 'Email Nurture',      color: 'hsl(220, 50%, 58%)', shortName: 'Nurture',   icon: 'mail' },
  email_newsletter:  { name: 'Email Newsletter',   color: 'hsl(230, 45%, 62%)', shortName: 'Newsletter',icon: 'newspaper' },
  web_visit:         { name: 'Website Visit',       color: 'hsl(280, 45%, 55%)', shortName: 'Web',       icon: 'globe' },
  form_submission:   { name: 'Form Submission',     color: 'hsl(168, 55%, 45%)', shortName: 'Forms',     icon: 'file-text' },
  event:             { name: 'Events',              color: 'hsl(38, 55%, 55%)',  shortName: 'Events',    icon: 'calendar' },
  webinar:           { name: 'Webinars',            color: 'hsl(45, 60%, 50%)',  shortName: 'Webinars',  icon: 'video' },
  bdr_email:         { name: 'BDR Email',           color: 'hsl(340, 50%, 55%)', shortName: 'BDR Email', icon: 'send' },
  bdr_call:          { name: 'BDR Call',            color: 'hsl(350, 55%, 50%)', shortName: 'BDR Call',  icon: 'phone' },
  bdr_linkedin:      { name: 'BDR LinkedIn',        color: 'hsl(0, 50%, 55%)',   shortName: 'BDR LI',   icon: 'user' },
  content_download:  { name: 'Content Download',    color: 'hsl(140, 45%, 48%)', shortName: 'Content',   icon: 'download' },
};

export const ENRICHED_CHANNEL_KEYS: EnrichedChannel[] = Object.keys(ENRICHED_CHANNELS) as EnrichedChannel[];
