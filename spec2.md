# SPEC2.md — RunMyJobs Attribution Dashboard: Enriched Data Model & Attribution Explorer

## Purpose

This spec has two audiences:

1. **Engineering (Claude Code)**: Build spec for enriching the data layer, adding 6 new analysis views, and implementing the Attribution Explorer interface.
2. **Redwood Marketing Ops**: Data requirements document — exactly which exports are needed from which systems, with which fields, for the attribution dashboard to function.

---

# SECTION A: Data Requirements & Source System Exports

## A1. Overview of Source Systems

The attribution dashboard requires data from 5 source systems, joined via Salesforce Account ID. Each system contributes a different dimension of the buyer journey.

| # | Source System | What It Provides | Export Format | Refresh Cadence |
|---|--------------|-------------------|---------------|-----------------|
| 1 | Salesforce | Opportunities, accounts, campaign members, contact roles | CSV report / Data Loader export | Weekly |
| 2 | Marketo | Email engagement, web page visits (Munchkin), form submissions | Activity log export / Smart List | Weekly |
| 3 | LinkedIn Campaign Manager | Ad impressions, clicks, video views, lead gen form submits | CSV export / API | Weekly |
| 4 | WordPress / Marketo Forms | Form submissions on redwood.com | Via Marketo (Form Fill activities) | Via Marketo |
| 5 | Outreach / Salesloft | BDR sequences, calls, emails, LinkedIn tasks | CSV export / CRM sync | Weekly |

### The Join Key

All data connects through the Salesforce Account hierarchy:

```
Salesforce Opportunity
  └── Account ID (primary join key)
       ├── Contact Roles → Contact IDs
       │    ├── Marketo Lead/Contact ID (bi-directional sync)
       │    │    ├── Email activities
       │    │    ├── Web page visits (Munchkin)
       │    │    └── Form fill activities
       │    ├── LinkedIn matched audience member (via company match or Marketo integration)
       │    └── Outreach/Salesloft Prospect (via Contact sync)
       └── Salesforce Campaign Members (via Contact/Lead → Campaign)
```

**CRITICAL**: The dashboard can only attribute touchpoints that are linked to a Salesforce Contact who has a Contact Role on an Opportunity. If Contact Roles aren't maintained on opportunities, attribution will have blind spots. This is the #1 data hygiene requirement.

---

## A2. Export 1: Salesforce Opportunity Report

**Report name**: `RMJ Attribution — Opportunity Pipeline`
**Report type**: Opportunities with Contact Roles
**Filters**: 
- Product Family = "RunMyJobs" OR Opportunity Name contains "RMJ"
- Created Date >= [start of attribution window]
- Stage != "Duplicate" or "Junk"

### Required Fields

| Field | Salesforce API Name | Type | Example | Notes |
|-------|-------------------|------|---------|-------|
| Opportunity ID | `Id` | Text | `006Dn000004xKz1` | Primary key |
| Opportunity Name | `Name` | Text | `Siemens AG — RMJ Enterprise` | |
| Account ID | `AccountId` | Text | `001Dn000003aB2c` | **Join key** to all other data |
| Account Name | `Account.Name` | Text | `Siemens AG` | |
| Deal Amount | `Amount` | Currency | `485000` | |
| Stage | `StageName` | Text | `Closed Won` | Current stage |
| Stage History | Via Stage History report | Date per stage | See A2a | Needed for velocity analysis |
| Close Date | `CloseDate` | Date | `2025-01-15` | |
| Created Date | `CreatedDate` | Date | `2024-03-22` | |
| Deal Type | `Type` or custom field | Text | `New Logo` | **New Logo vs Expansion** — critical filter. May be `New Business`, `New Logo`, etc. at Redwood. |
| Product Line | `Product_Family__c` or via Line Items | Text | `RunMyJobs` | Could be derived from Opp Products or a custom field |
| Account Segment | `Account.Segment__c` or similar | Text | `Enterprise` | Enterprise / Mid-Market / SMB |
| Region | `Account.Region__c` or Territory | Text | `EMEA` | |
| Industry | `Account.Industry` | Text | `Manufacturing` | Standard SFDC field |
| Owner | `Owner.Name` | Text | `Jane Smith` | AE name |
| BDR/SDR | Custom field or via Campaign Source | Text | `Tom Wilson` | Who sourced/qualified |
| Lead Source | `LeadSource` | Text | `Marketing` | Original lead source |
| Contact Role: Contact ID | `OpportunityContactRole.ContactId` | Text | `003Dn000005xYz1` | **Links opp to marketing touches** |
| Contact Role: Role | `OpportunityContactRole.Role` | Text | `Decision Maker` | |
| Contact Role: Contact Email | `Contact.Email` | Text | `j.mueller@siemens.com` | For matching to Marketo/Outreach |

### A2a. Stage History (separate report or API query)

| Field | Type | Example |
|-------|------|---------|
| Opportunity ID | Text | `006Dn000004xKz1` |
| Stage | Text | `Discos Set` |
| Date Entered | DateTime | `2024-04-15T10:30:00Z` |
| Days in Stage | Number | `12` |

**Why this matters**: Stage History lets us calculate deal velocity and correlate specific touchpoints with stage progression.

---

## A3. Export 2: Salesforce Campaign Member Report

**Report name**: `RMJ Attribution — Campaign Members`
**Report type**: Campaigns with Campaign Members
**Filters**:
- Campaign Member is linked to a Contact who has a Contact Role on an RMJ Opportunity
- (OR) Campaign Type in relevant categories

### Required Fields

| Field | Salesforce API Name | Type | Example | Notes |
|-------|-------------------|------|---------|-------|
| Campaign Member ID | `Id` | Text | `00vDn000001aBcD` | |
| Contact/Lead ID | `ContactId` or `LeadId` | Text | `003Dn000005xYz1` | **Links to Contact Role → Opp** |
| Account ID | Via Contact lookup | Text | `001Dn000003aB2c` | Derived |
| Campaign ID | `CampaignId` | Text | `701Dn000002cDeF` | |
| Campaign Name | `Campaign.Name` | Text | `SAP Sapphire Orlando 2024` | |
| Campaign Type | `Campaign.Type` | Text | `Event` | Standard SFDC picklist: Event, Webinar, Advertisement, Email, Content, etc. |
| Member Status | `Status` | Text | `Attended` | e.g., Sent, Responded, Attended, Downloaded, Clicked |
| First Associated Date | `FirstRespondedDate` | Date | `2024-06-15` | When the member first engaged |
| Created Date | `CreatedDate` | Date | `2024-06-10` | When added to campaign |

---

## A4. Export 3: Marketo Activity Log

**Report name**: `RMJ Attribution — Marketo Activities`
**Method**: Smart List export or Activity Log API
**Filters**:
- Lead is a known Salesforce Contact (has SFDC Contact ID)
- Activity Date >= [start of attribution window]
- Activity Type in: Email Sent, Email Delivered, Email Opened, Email Clicked Link, Fill Out Form, Visit Web Page, Interesting Moment

### Required Fields

| Field | Marketo Field | Type | Example | Notes |
|-------|-------------|------|---------|-------|
| Marketo Lead ID | `id` | Number | `1234567` | |
| SFDC Contact ID | `sfdcContactId` | Text | `003Dn000005xYz1` | **Join key** |
| SFDC Account ID | `sfdcAccountId` | Text | `001Dn000003aB2c` | Direct join to Opp |
| Activity Type | `activityTypeId` | Text | `Email Clicked Link` | See activity types below |
| Activity Date | `activityDate` | DateTime | `2024-06-15T14:22:00Z` | |
| Primary Attribute | varies by type | Text | varies | See below |

### Activity-Specific Fields

**Email Activities** (Sent, Delivered, Opened, Clicked):
| Field | Example | Notes |
|-------|---------|-------|
| Program Name | `RMJ Nurture — SAP Modernization Sequence` | The Marketo program |
| Program Channel | `Nurture` | Nurture, Newsletter, Operational, Event |
| Email Name | `SAP Mod Nurture Email 3 — ROI Calculator` | The specific email |
| Link URL (Clicked only) | `https://redwood.com/roi-calculator/` | The CTA they clicked |

**Form Fill Activities**:
| Field | Example | Notes |
|-------|---------|-------|
| Form Name | `Demo Request — Quick` | The Marketo form |
| Web Page URL | `https://redwood.com/demo/quick/` | Page where form lives |
| Referrer URL | `https://google.com/search?q=...` | What brought them to the form |
| UTM Source | `linkedin` | From URL parameters |
| UTM Medium | `paid-social` | |
| UTM Campaign | `rmj-sap-migration-it-leaders` | Links back to LinkedIn campaign |

**Visit Web Page Activities** (Munchkin tracking):
| Field | Example | Notes |
|-------|---------|-------|
| Web Page URL | `https://redwood.com/workload-automation/` | **This answers Question 1** |
| Referrer URL | `https://google.com/` | Organic, paid, direct, referral |
| Search Query (if available) | `sap job scheduling automation` | From referrer |
| Client IP Country | `Germany` | Geo data |

**Interesting Moments** (manually triggered by Marketo flows):
| Field | Example | Notes |
|-------|---------|-------|
| Description | `Visited pricing page 3x in 7 days` | Custom triggers |
| Type | `Web` / `Email` / `Milestone` | |

---

## A5. Export 4: LinkedIn Campaign Manager

**Report name**: `RMJ Attribution — LinkedIn Engagement`
**Method**: Campaign Manager CSV export or Marketing API
**Filters**:
- Campaign Group contains "RMJ" or "RunMyJobs"
- Date range within attribution window

### Required Fields

| Field | LinkedIn Export Column | Type | Example | Notes |
|-------|---------------------|------|---------|-------|
| Campaign Name | `Campaign Name` | Text | `RMJ \| SAP S/4HANA Migration \| IT Leaders` | |
| Campaign Group | `Campaign Group Name` | Text | `RMJ Enterprise 2024` | |
| Ad Creative Name | `Creative Name` or `Ad Name` | Text | `RISE with SAP — CIO Testimonial Video` | **Answers Question 4 at ad level** |
| Ad Format | `Ad Format` | Text | `Single Image` / `Video` / `Carousel` | |
| Company Name | `Company Name` (matched audiences) | Text | `Siemens AG` | **Only available with ABM/matched audiences** |
| Interaction Type | derived | Text | `impression` / `click` / `video_view` / `lead_gen_form` | |
| Interaction Date | `Start Date` | Date | `2024-06-15` | |
| Spend | `Total Spent` | Currency | `45.20` | For ROI analysis |

### Important Note on LinkedIn Matching

LinkedIn provides company-level engagement data but NOT individual contact-level data (unless using Lead Gen Forms). Matching LinkedIn engagement to Salesforce opportunities requires one of:
- **Marketo LinkedIn integration** (LaunchPoint connector) — syncs LinkedIn leads to Marketo
- **ABM matched audiences** — you upload account lists, LinkedIn reports engagement at company level
- **UTM tracking** — LinkedIn ad clicks land on redwood.com with UTMs, Marketo Munchkin captures the visit with the UTM parameters, linking the LinkedIn campaign to a known lead
- **Manual / Bizible matching** — a tool like Bizible/Marketo Measure matches by company name + timeframe

**For the mock data**: We'll assume UTM-based matching (LinkedIn click → Marketo web visit with UTM → form fill creates/matches lead → links to SFDC Contact → links to Opportunity).

---

## A6. Export 5: Outreach / Salesloft (BDR Sequences)

**Report name**: `RMJ Attribution — BDR Sequence Activity`
**Method**: Outreach/Salesloft CSV export or CRM Activity sync
**Filters**:
- Sequence name contains "RMJ" or linked to RMJ target accounts
- Activity date within attribution window

### Required Fields

| Field | Outreach Field | Type | Example | Notes |
|-------|--------------|------|---------|-------|
| Prospect Email | `prospect.email` | Text | `j.mueller@siemens.com` | **Match to SFDC Contact** |
| SFDC Contact ID | `prospect.salesforce_id` | Text | `003Dn000005xYz1` | If synced |
| Account Name | `prospect.account.name` | Text | `Siemens AG` | |
| Sequence Name | `sequence.name` | Text | `RMJ Enterprise — Ctrl-M Displacement Q4` | **Answers Question 5** |
| Sequence Step Number | `step.order` | Number | `3` | Position in sequence |
| Step Type | `step.step_type` | Text | `email` / `call` / `linkedin` / `manual` | |
| Step Name/Subject | `step.name` | Text | `Follow-up: SAP migration timeline` | Specific email subject or task name |
| Activity Date | `completed_at` | DateTime | `2024-06-15T09:30:00Z` | |
| Outcome/Disposition | `call_disposition` or `email_outcome` | Text | See below | |

### BDR Step Outcomes

**Email steps**: `delivered`, `opened`, `clicked`, `replied`, `bounced`
**Call steps**: `connected`, `voicemail`, `no_answer`, `wrong_number`, `gatekeeper`
**LinkedIn steps**: `connection_sent`, `connection_accepted`, `message_sent`, `message_replied`
**Manual tasks**: `completed`, `skipped`

---

## A7. Data Matching & Hygiene Requirements

### Prerequisites (MUST be in place before attribution works)

| # | Requirement | System | Impact if Missing |
|---|-------------|--------|-------------------|
| 1 | **Contact Roles on Opportunities** | Salesforce | Cannot link marketing touches to deals. Single biggest data gap. |
| 2 | **Marketo-Salesforce sync active** | Marketo + SFDC | Cannot match email/web/form activities to contacts on deals. |
| 3 | **Munchkin tracking on redwood.com** | Marketo | Cannot track website page visits (Question 1 blind). |
| 4 | **UTM parameters on all paid campaigns** | LinkedIn, Google, etc. | Cannot attribute paid traffic to specific campaigns. |
| 5 | **Outreach/Salesloft synced to SFDC** | Outreach + SFDC | Cannot track BDR sequence activities (Question 5 blind). |
| 6 | **Campaign naming conventions** | All systems | Cannot group/filter campaigns by product line if naming is inconsistent. |
| 7 | **Deal Type field populated** | Salesforce | Cannot filter to New Logo vs Expansion. |
| 8 | **Product Line identifiable** | Salesforce | Cannot filter to RunMyJobs vs Finance Automation. |

### Data Quality Checklist

Before each data refresh, validate:

- [ ] Every closed opportunity has at least 1 Contact Role
- [ ] Contact Roles have email addresses populated
- [ ] Marketo leads have SFDC Contact IDs (sync is current)
- [ ] Munchkin is firing on all redwood.com pages (check Marketo web activity log)
- [ ] LinkedIn campaigns have UTM parameters: `utm_source=linkedin&utm_medium=paid-social&utm_campaign=[campaign-slug]`
- [ ] Outreach sequences named with `RMJ` prefix for filtering
- [ ] Deal Type field populated on all opportunities (no blanks)

---

## A8. Unified Touchpoint Schema (Post-Join)

After all exports are joined, every touchpoint record in the dashboard conforms to this schema:

```typescript
interface UnifiedTouchpoint {
  // === Identity & Linkage ===
  touchpoint_id: string;              // Generated unique ID
  account_id: string;                 // Salesforce Account ID (primary join key)
  account_name: string;
  opportunity_id: string;             // Salesforce Opportunity ID
  contact_id: string;                 // Salesforce Contact ID
  
  // === Opportunity Context (denormalized) ===
  deal_type: 'New Logo' | 'Expansion';
  product_line: 'RunMyJobs' | 'Finance Automation';
  segment: 'Enterprise' | 'Mid-Market';
  stage: string;                      // Current opp stage
  deal_amount: number;
  region: string;
  industry: string;
  
  // === Touchpoint Core ===
  date: string;                       // ISO date
  source_system: 'salesforce' | 'marketo' | 'linkedin' | 'outreach';
  channel: 'linkedin_ads' | 'email_nurture' | 'email_newsletter' | 'web_visit' | 'form_submission' | 'event' | 'webinar' | 'bdr_email' | 'bdr_call' | 'bdr_linkedin' | 'content_download';
  
  // === Activity Detail ===
  activity_type: string;              // email_open, email_click, page_visit, form_fill, ad_click, ad_impression, call_connected, call_voicemail, event_attended, webinar_registered, webinar_attended, content_downloaded
  interaction_detail: string;         // Most granular action description
  
  // === Channel-Specific Fields (nullable) ===
  // Web
  page_url?: string;                  // e.g., /workload-automation/
  page_title?: string;                // e.g., "RunMyJobs Workload Automation"
  referrer_url?: string;
  
  // Content
  content_asset?: string;             // e.g., "SAP Job Scheduling Migration Guide"
  asset_type?: 'whitepaper' | 'datasheet' | 'case_study' | 'webinar_recording' | 'guide' | 'roi_calculator' | 'infographic' | 'video';
  
  // Email
  program_name?: string;              // Marketo program
  email_name?: string;                // Specific email
  link_clicked?: string;              // CTA URL
  
  // LinkedIn
  campaign_name?: string;             // LinkedIn campaign
  ad_creative?: string;               // Specific ad
  ad_format?: string;
  spend?: number;
  
  // Events
  event_name?: string;
  event_type?: 'conference' | 'webinar' | 'workshop' | 'customer_summit';
  
  // BDR
  bdr_sequence?: string;              // Sequence name
  bdr_step_number?: number;
  bdr_step_type?: 'email' | 'call' | 'linkedin' | 'manual';
  bdr_outcome?: string;               // connected, replied, voicemail, etc.
  
  // UTM (for paid traffic)
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface EnrichedAccount {
  // Core (from Salesforce Opp)
  account_id: string;
  account_name: string;
  opportunity_id: string;
  opportunity_name: string;
  deal_amount: number;
  stage: string;
  deal_type: 'New Logo' | 'Expansion';
  product_line: 'RunMyJobs' | 'Finance Automation';
  segment: 'Enterprise' | 'Mid-Market';
  region: string;
  industry: string;
  owner: string;                      // AE
  bdr: string;                        // SDR/BDR who sourced
  created_date: string;
  close_date: string;
  lead_source: string;
  
  // Stage velocity
  stage_history: {
    stage: string;
    entered_date: string;
    days_in_stage: number;
  }[];
  
  // All touchpoints (unified)
  touchpoints: UnifiedTouchpoint[];
}
```

---

# SECTION B: Attribution Explorer Interface

## B1. Concept

Add a new top-level section to the dashboard called **"Attribution Explorer"**. This provides direct answers to the 6 business questions defined by the Redwood team. Each question becomes a selectable "lens" with a purpose-built answer panel.

## B2. Navigation

Add to the sidebar under a new section **"Explorer"**:
- Attribution Explorer (single route: `/explorer`)

The Explorer page has:
1. **Global Filter Bar** (sticky, always visible)
2. **Question Selector** (6 cards or tab strip)
3. **Answer Panel** (changes based on selected question)

## B3. Global Filter Bar

Persistent filter bar at the top of the Explorer with these controls:

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Deal Type | Select | All, New Logo, Expansion | New Logo |
| Segment | Select | All, Enterprise, Mid-Market | Enterprise |
| Product Line | Select | All, RunMyJobs, Finance Automation | RunMyJobs |
| Date Range | Date picker | Start / End | Full 12-month window |
| Stage | Multi-select | All stages | All |

When "RMJ Enterprise New Logo" is selected (which matches the original business requirement), a badge shows: **"Filtered: RMJ Enterprise New Logo deals"**

The filter state is passed to all 6 answer panels. Every visualization recomputes based on the active filters.

## B4. Question Selector

Display the 6 questions as a horizontal tab strip (desktop) or vertical accordion (mobile). Each tab shows:
- Question number (1–6)
- Short title
- One-line description

| # | Short Title | Description |
|---|------------|-------------|
| 1 | Page Influence | Which website pages appear in converting journeys? |
| 2 | Content Impact | Which content assets move deals forward? |
| 3 | Win/Loss Signals | Which touchpoints predict won vs lost? |
| 4 | First Touch Origins | What are the actual door-openers? |
| 5 | BDR Effectiveness | Which outbound sequences generate pipeline? |
| 6 | Winning Sequences | Which multi-step combinations convert best? |

---

# SECTION C: Analysis Logic & Answer Panels

## C1. Question 1: Page Influence

**Business Question**: "Show me the website pages that appear most frequently in user journeys that convert to pipeline, ranked by influence, not just volume — all websites."

### Analysis Logic

```typescript
interface PageInfluence {
  page_url: string;
  page_title: string;
  visit_count: number;               // Raw volume
  unique_opps: number;               // How many distinct opportunities visited this page
  pipeline_influenced: number;        // Sum of deal amounts for opps that visited
  revenue_influenced: number;         // Won deal amounts
  influence_score: number;            // pipeline_influenced * (unique_opps / total_opps)
  avg_position_in_journey: number;    // Where in the journey this page typically appears (0=first, 1=last)
  conversion_rate: number;            // % of opps that visited AND progressed past Disco
}

function calculatePageInfluence(touchpoints: UnifiedTouchpoint[], accounts: EnrichedAccount[]): PageInfluence[] {
  // 1. Filter touchpoints to activity_type === 'page_visit'
  // 2. Group by page_url
  // 3. For each page:
  //    - Count total visits (visit_count)
  //    - Count unique opportunity_ids (unique_opps)
  //    - Sum deal_amount for those opps (pipeline_influenced)
  //    - Sum deal_amount where stage === 'closed_won' (revenue_influenced)
  //    - Calculate influence_score = pipeline_influenced * (unique_opps / total_filtered_opps)
  //      (This penalizes pages that only appear in 1 big deal vs pages that appear across many deals)
  //    - Calculate avg_position = mean(touchpoint.position / total_touches_for_that_opp)
  //    - Calculate conversion_rate = opps that reached Solution Accepted or beyond / unique_opps
  // 4. Sort by influence_score descending
}
```

### Answer Panel Visualization

- **Primary chart**: Horizontal bar chart — pages ranked by influence score. Bar width = influence score. Bar color intensity = conversion rate. Show pipeline amount as label.
- **Table below**: Full detail table with columns: Page URL, Visits, Unique Opps, Pipeline Influenced, Revenue, Influence Score, Avg Journey Position, Conv Rate
- **Insight card**: "Top 3 most influential pages are [X], [Y], [Z] — collectively appearing in deals worth [pipeline amount]"

---

## C2. Question 2: Content Impact

**Business Question**: "Show me the interactions with content assets that appear most frequently in user journeys that convert to pipeline, ranked by influence."

### Analysis Logic

```typescript
interface ContentImpact {
  content_asset: string;
  asset_type: string;
  interaction_count: number;          // Total downloads/views
  unique_opps: number;
  pipeline_influenced: number;
  revenue_influenced: number;
  influence_score: number;
  avg_position_in_journey: number;
  appears_in_won_pct: number;         // % of won deals that interacted with this asset
  appears_in_lost_pct: number;        // % of lost deals
}

// Filter touchpoints where content_asset is not null
// Group by content_asset
// Same scoring logic as Page Influence
// Add won/lost comparison
```

### Answer Panel Visualization

- **Primary chart**: Grouped by asset_type (whitepaper, datasheet, webinar, etc.) — within each group, rank by influence score
- **Bubble chart alternative**: X = unique opps, Y = pipeline influenced, bubble size = influence score, color = asset type
- **Table**: Full detail with asset name, type, interactions, pipeline, revenue, influence score, won%, lost%

---

## C3. Question 3: Win/Loss Signals

**Business Question**: "Show me the specific marketing touchpoints that appear disproportionately in won deals versus lost deals."

### Analysis Logic

This is the most analytically important question. We need a "lift" or "disproportionality ratio."

```typescript
interface WinLossSignal {
  touchpoint_descriptor: string;      // Could be a campaign, page, content asset, or event
  touchpoint_type: string;            // What kind of touchpoint
  won_deals_with: number;             // Count of won deals that had this touchpoint
  won_deals_total: number;            // Total won deals
  won_pct: number;                    // won_deals_with / won_deals_total
  lost_deals_with: number;
  lost_deals_total: number;
  lost_pct: number;
  lift_ratio: number;                 // won_pct / lost_pct — values > 1 mean over-indexed in wins
  statistical_significance: boolean;  // Only flag if sample size is meaningful (>= 3 deals)
}

function calculateWinLossSignals(accounts: EnrichedAccount[]): WinLossSignal[] {
  // 1. Separate accounts into won and lost buckets
  // 2. For each unique touchpoint descriptor (campaign, page, content asset, event, sequence):
  //    - Count how many won deals include it
  //    - Count how many lost deals include it
  //    - Calculate lift_ratio = (won_pct) / (lost_pct)
  //    - Mark as significant if won_deals_with >= 3 AND lost_deals_with >= 1
  // 3. Sort by lift_ratio descending
  // 4. Show BOTH over-indexed (lift > 1.5) and under-indexed (lift < 0.7) touchpoints
  //    Over-indexed = "Do more of this"
  //    Under-indexed = "This isn't helping win deals"
}
```

### Answer Panel Visualization

- **Diverging bar chart**: Center line = 1.0x (neutral). Bars extending right = over-indexed in wins (green). Bars extending left = under-indexed / over-indexed in losses (red).
- **Top 5 win signals** highlighted with green badges
- **Top 5 loss signals** highlighted with red badges
- **Table**: Full detail with touchpoint, type, won%, lost%, lift ratio, significance flag
- **Insight card**: "Deals with [touchpoint X] are [lift]x more likely to close. [Y] deals were won with this touchpoint vs [Z] without."

---

## C4. Question 4: First Touch Origins

**Business Question**: "Show me the most common first touchpoints that appear in user journeys that convert to pipeline."

### Analysis Logic

```typescript
interface FirstTouchOrigin {
  first_touchpoint: string;           // The specific first interaction
  touchpoint_type: string;            // ad_click, page_visit, event_attended, etc.
  channel: string;
  specific_detail: string;            // The ad creative, page URL, event name, etc.
  opp_count: number;                  // How many opps started here
  pipeline_generated: number;
  revenue_generated: number;
  avg_time_to_pipeline: number;       // Days from first touch to opp creation
  conversion_rate: number;            // % that reached Solution Accepted+
}

// For each opportunity, take the FIRST touchpoint (earliest date)
// Group by the specific first touchpoint (not just channel, but the actual ad/page/event)
// Rank by pipeline_generated
```

### Answer Panel Visualization

- **Treemap**: Size = pipeline generated, color = channel. Each block is a specific first touchpoint. This makes it immediately visual which specific ads/pages/events are the real door-openers.
- **Table**: Specific touchpoint, type, channel, opp count, pipeline, revenue, days to pipeline, conversion rate
- **Channel breakdown**: Donut showing what % of first touches come from each channel, with drill-down to specific touchpoints

---

## C5. Question 5: BDR Effectiveness

**Business Question**: "What are our most/least effective BDR sequences?"

### Analysis Logic

```typescript
interface BDRSequenceEffectiveness {
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
  avg_steps_to_reply: number;         // Which step typically gets the reply
  best_performing_step: {
    step_number: number;
    step_type: string;
    reply_rate: number;
  };
}

// Group touchpoints where source_system === 'outreach'
// Group by bdr_sequence
// Track funnel: enrolled → replied → meeting → opp created
// Calculate rates at each step
// Identify which step_number typically generates the response
```

### Answer Panel Visualization

- **Sequence comparison table**: Ranked by pipeline generated, with reply rate, meeting rate, opp conversion sparklines
- **Step-level heatmap**: For top sequences, show which steps perform best (green = high engagement, red = drop-off)
- **Best vs Worst comparison**: Side-by-side cards for the top 3 and bottom 3 sequences
- **Insight card**: "Best sequence [X] generates [pipeline] at [conversion rate]. Worst sequence [Y] has enrolled [N] prospects with [0] pipeline."

---

## C6. Question 6: Winning Sequences (Pattern Mining)

**Business Question**: "Show me the most common combinations of marketing and xDR interactions that appear together in journeys that convert to pipeline, and identify which have the highest conversion probability."

### Analysis Logic

This is the most complex analysis. We're looking for ordered subsequences of touchpoint types that predict pipeline conversion.

```typescript
interface WinningSequence {
  sequence_pattern: string[];         // e.g., ['linkedin_ad_click', 'webinar_attended', 'email_nurture_click', 'bdr_call_connected', 'demo_form_fill']
  pattern_label: string;              // Human-readable: "LinkedIn Ad → Webinar → Email Nurture → BDR Call → Demo Request"
  occurrence_count: number;           // How many opps followed this pattern
  pipeline_value: number;
  won_count: number;
  lost_count: number;
  win_rate: number;                   // won_count / (won_count + lost_count)
  avg_journey_duration_days: number;
  avg_touchpoints_total: number;
}

function findWinningSequences(accounts: EnrichedAccount[]): WinningSequence[] {
  // 1. For each account, extract the ordered sequence of touchpoint channels/types
  //    Simplify to category level: linkedin_ad, webinar, email_nurture, bdr_call, form_demo, etc.
  // 2. Find common subsequences of length 2, 3, 4, and 5
  //    Use sliding windows and common subsequence extraction
  // 3. Count how many opps contain each subsequence
  // 4. Calculate win rate for each subsequence
  // 5. Rank by: combination of occurrence_count * win_rate * pipeline_value
  //    (A pattern that appears 3 times with 100% win rate and $2M pipeline > a pattern that appears 20 times with 10% win rate and $500K)
  // 6. Present the top 10-15 sequences
}
```

### Answer Panel Visualization

- **Sankey/flow diagram**: Show the most common paths from first touch to close, with flow width proportional to pipeline value. Color-code by win/loss outcome.
- **Sequence cards**: Top 5 winning sequences shown as horizontal step flows (like a progress bar with icons for each step)
- **Comparison table**: Sequence pattern, occurrences, pipeline, win rate, avg duration
- **Insight card**: "The most effective sequence is [pattern] with a [win_rate]% close rate across [N] deals worth [pipeline]. Deals following this pattern close [X] days faster than average."

---

# SECTION D: Updates to Existing Views

## D1. Enhanced Tooltips

All existing views should use the enriched touchpoint data for richer tooltips:
- Journey map dots: Now show page URL, content asset, email name, ad creative (not just "LinkedIn" or "Email")
- Channel bars: Show top 3 specific touchpoints within that channel
- Funnel stages: Show which touchpoints are most common at each stage transition

## D2. Account Journey Enhancements

The existing Journeys view should:
- Color-code dots by enriched channel (linkedin_ads, email_nurture, bdr_call, etc.) instead of just 4 channels
- Show BDR touches as a distinct icon (phone for calls, envelope for BDR emails)
- Add a "Journey Detail" click-through that expands an account into a full vertical timeline with every touchpoint detail

## D3. Existing Attribution Models

First Touch, Last Touch, Multi-Touch views should:
- Use the enriched channel taxonomy (10+ channels instead of 4)
- Add a drill-down: click on "LinkedIn Ads" bar → see breakdown by specific campaign and ad creative
- Add the Deal Type / Product Line / Segment filters from the Explorer

---

# APPENDIX: Mock Data Guidance

When generating mock data for the enriched schema, ensure:

1. **Realistic page URLs** for redwood.com: `/workload-automation/`, `/solutions/sap/`, `/solutions/sap/rise/`, `/demo/`, `/pricing/`, `/customers/`, `/resources/whitepaper/sap-migration/`, `/blog/ctrl-m-alternative/`, `/roi-calculator/`, etc.

2. **Realistic content assets**: "SAP Job Scheduling Migration Guide", "Ctrl-M to RunMyJobs Comparison Sheet", "RunMyJobs ROI Calculator Results", "Workload Automation Buyer's Guide", "Siemens Case Study", "Total Economic Impact Study", "S/4HANA Automation Datasheet"

3. **Realistic BDR sequences**: "RMJ Enterprise — SAP Ctrl-M Displacement Q4", "RMJ Enterprise — S/4HANA Migration Awareness", "RMJ Enterprise — Event Follow-Up Sapphire", "RMJ Mid-Market — Inbound Demo Follow-Up", "RMJ Enterprise — Competitive Win-Back"

4. **Realistic ad creatives**: "SAP S/4HANA Migration — IT Leader Testimonial", "RISE with SAP — CIO Webinar Promo", "Ctrl-M Alternative — Comparison Infographic", "RunMyJobs SaaS — Free Assessment Offer"

5. **Data skew for Question 3**: Ensure SAP Sapphire, pricing page visits, ROI calculator usage, and multi-step BDR sequences appear disproportionately in won deals. Ensure generic newsletter-only touches and single-channel journeys appear disproportionately in lost deals.

6. **Sequence patterns for Question 6**: Plant 3-4 clear "winning sequences" in the mock data:
   - LinkedIn Ad → SAP Sapphire attendance → Nurture email click → BDR call connected → Demo form fill (high win rate)
   - Content download → Webinar attended → BDR email reply → Pricing page visit (medium-high win rate)
   - BDR cold call → Email nurture enrolled → Event invite → Event attended → Form fill (medium win rate)
   - LinkedIn Ad → Form fill only (low win rate — shows the "missing middle" problem)
