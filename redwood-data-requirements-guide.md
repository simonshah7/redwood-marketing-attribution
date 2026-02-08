# RunMyJobs Attribution Dashboard — Data Requirements Guide

**For: Redwood Marketing Operations, RevOps, BDR Operations**
**Purpose**: This document defines the exact data exports needed from each system to power the RMJ marketing attribution dashboard. The dashboard cannot produce accurate attribution without these data feeds.

---

## What We're Building

An attribution dashboard that answers 15 critical questions about how marketing and BDR activity drives RunMyJobs Enterprise New Logo pipeline. The dashboard needs data from 6 systems, joined together via Salesforce Account/Contact IDs.

**The 15 questions we're answering:**

1. Which website pages appear most frequently in journeys that convert to pipeline?
2. Which content assets (whitepapers, datasheets, webinars) move deals forward?
3. Which specific touchpoints predict won deals vs lost deals?
4. What are the actual first touchpoints that open doors (at the ad/page/asset level)?
5. Which BDR sequences generate the most/least pipeline?
6. Which multi-step marketing + BDR combinations have the highest conversion probability?
7. What touchpoints occur within 14 days before a meeting is booked, ranked by frequency and impact on conversion?
8. Which ABM ad impressions or engagements typically precede successful outbound meetings or opportunities?
9. What are the top journey paths for high-velocity deals vs slow-moving deals, and which touchpoints differentiate the two?
10. Which paid social, organic social, or digital creative variants are most common in journeys that lead to meeting creation?
11. What is the most common first touchpoint that appears in user journeys that convert to pipeline?
12. What are our most effective BDR sequences — by product?
13. How do we measure profitability of paid media efforts — by ad account?
14. How many touches — and which types — are typically required to convert an account, and how does this vary by product, region, industry, or persona?
15. What are the most common combinations of marketing and xDR interactions that convert to pipeline, and which have the highest conversion probability?

---

## System 1: Salesforce

### Export 1A: Opportunity Pipeline Report

**Who owns this**: RevOps / Salesforce Admin
**Report type**: Opportunities with Contact Roles
**Filters**: Product Family = RunMyJobs, Created Date within attribution window

| Field Needed | SFDC API Name | Why We Need It |
|-------------|---------------|----------------|
| Opportunity ID | `Id` | Primary key for all joins |
| Account ID | `AccountId` | **Master join key** across all systems |
| Account Name | `Account.Name` | Display |
| Amount | `Amount` | Pipeline and revenue calculations |
| Stage | `StageName` | Current deal stage |
| Close Date | `CloseDate` | Velocity analysis |
| Created Date | `CreatedDate` | Journey duration |
| Deal Type | `Type` or custom | **Must distinguish New Logo vs Expansion** |
| Product Line | Custom field or Product Family | **Must identify RunMyJobs vs Finance Automation** |
| Account Segment | Custom field | Enterprise vs Mid-Market |
| Region | Territory or custom field | Regional analysis |
| Industry | `Account.Industry` | Industry breakdown |
| Owner (AE) | `Owner.Name` | Rep-level analysis |
| BDR/SDR | Custom field | Who sourced the deal |
| Lead Source | `LeadSource` | Original source |
| Contact Role: Contact ID | `OpportunityContactRole.ContactId` | **Links opp to all marketing data** |
| Contact Role: Email | `Contact.Email` | Matching to Marketo and Outreach |
| Contact Role: Role | `OpportunityContactRole.Role` | Stakeholder mapping |

### Export 1B: Stage History

**Who owns this**: RevOps / Salesforce Admin
**Method**: Salesforce Stage History report or OpportunityFieldHistory API query

| Field Needed | Why We Need It |
|-------------|----------------|
| Opportunity ID | Join to opp |
| Stage Name | Which stage |
| Date Entered | When they entered this stage |
| Days in Stage | Velocity calculation |

### ⚠️ Critical Dependency: Contact Roles

**The single most important data hygiene requirement.** If an opportunity doesn't have Contact Roles populated, we cannot link any marketing activity to that deal. It becomes invisible to attribution.

**Action required**: Ensure every opportunity has at least 1 Contact Role with a valid email address. Ideally, the primary buyer, the champion, and the economic buyer are all listed.

**Quick audit**: Run a report of "Opportunities where Contact Roles = 0" — any found are attribution blind spots.

---

## System 2: Marketo

### Export 2A: Activity Log (All Activity Types)

**Who owns this**: Marketing Operations / Marketo Admin
**Method**: Smart List export or REST API Activity Log extraction
**Filters**: Lead has SFDC Contact ID, Activity Date within window

| Field Needed | Why We Need It |
|-------------|----------------|
| Marketo Lead ID | Internal Marketo ID |
| SFDC Contact ID | **Join key** to Salesforce Contact → Contact Role → Opportunity |
| SFDC Account ID | Direct account-level join |
| Activity Type | What happened (see list below) |
| Activity Date | When it happened |

**Activity types we need:**

| Activity Type | What It Tells Us | Dashboard Question |
|--------------|------------------|-------------------|
| **Visit Web Page** | Which redwood.com pages they visited | Q1: Page Influence |
| **Fill Out Form** | Which forms they submitted, on which page | Q1, Q4: First Touch |
| **Email Opened** | Which nurture emails were opened | Q2, Q6: Sequences |
| **Email Clicked Link** | Which CTAs they engaged with | Q2, Q6: Content + Sequences |
| **Email Sent** | Nurture program enrollment evidence | Q5, Q6: BDR + Sequences |
| **Interesting Moment** | Custom-triggered milestones | Q3: Win/Loss signals |

**For Visit Web Page activities, we need:**
- Web Page URL (e.g., `https://redwood.com/workload-automation/`)
- Referrer URL (how they got there)

**For Email activities, we need:**
- Program Name (e.g., "RMJ Nurture — SAP Modernization Sequence")
- Email Name (e.g., "SAP Mod Nurture Email 3 — ROI Calculator")
- Link Clicked URL (if clicked)

**For Form Fill activities, we need:**
- Form Name (e.g., "Demo Request — Quick")
- Web Page URL (the page the form was on)
- UTM Source, Medium, Campaign (from the URL parameters)

### ⚠️ Critical Dependency: Munchkin Tracking

Marketo's Munchkin JavaScript must be active on ALL pages of redwood.com for web visit tracking to work. If Munchkin is missing from certain pages, those page visits won't appear in the data.

**Action required**: Verify Munchkin is firing on all redwood.com pages. Check a sample of key pages: `/workload-automation/`, `/solutions/sap/`, `/demo/`, `/pricing/`, `/roi-calculator/`, `/resources/`.

### ⚠️ Critical Dependency: Marketo-Salesforce Sync

The Marketo lead must have a synced SFDC Contact ID. If the sync is broken or a lead hasn't been synced, their marketing activity is invisible to attribution.

**Quick audit**: Smart List of "Leads where SFDC Contact ID is empty AND has activity in last 90 days" — these are attribution gaps.

---

## System 3: LinkedIn Campaign Manager

### Export 3A: Campaign Performance Report

**Who owns this**: Paid Media / Demand Gen team
**Method**: LinkedIn Campaign Manager → Export CSV, or LinkedIn Marketing API
**Filters**: Campaign Group contains "RMJ" or "RunMyJobs"

| Field Needed | Why We Need It |
|-------------|----------------|
| Campaign Name | Which campaign drove engagement |
| Campaign Group | Grouping for analysis |
| Ad Account ID | **Required for Q13** — groups spend by ad account |
| Ad Account Name | Display name for the ad account (e.g., "RMJ Enterprise — NA") |
| Ad Creative Name | **Specific ad variant** — answers Q4 and Q10 at the ad level |
| Ad Format | Single Image, Video, Carousel |
| Company Name | Account-level matching (ABM only) |
| Interaction Type | Impression, Click, Video View, Lead Gen Form |
| Date | When the interaction occurred |
| Spend | **Required for Q13** — For ROI and profitability calculations |

### ⚠️ Critical Dependency: UTM Parameters

LinkedIn doesn't automatically tell us which Salesforce contacts clicked which ads. The connection happens through UTM parameters:

1. LinkedIn ad click lands on `redwood.com/demo/?utm_source=linkedin&utm_medium=paid-social&utm_campaign=rmj-sap-migration-it-leaders`
2. Marketo Munchkin captures the page visit with UTM parameters
3. If the visitor is a known Marketo lead, the click is attributed

**Action required**: Every LinkedIn campaign must have UTM parameters configured. Standard format:
- `utm_source=linkedin`
- `utm_medium=paid-social`
- `utm_campaign=[campaign-slug-matching-linkedin-campaign-name]`

**Quick audit**: Check 5 active RMJ LinkedIn campaigns — do their destination URLs all have UTM parameters?

---

## System 4: WordPress Forms

**No separate export needed** — WordPress form submissions should flow through Marketo forms (embedded on the WordPress site). They'll appear as "Fill Out Form" activities in the Marketo export (Export 2A).

**Action required**: Confirm that all forms on redwood.com are Marketo forms (not native WordPress forms). Native WordPress forms won't sync to Marketo and will be invisible to attribution.

Key forms to verify:
- [ ] Demo request form (`/demo/quick/`)
- [ ] Migration assessment form (`/migration/`)
- [ ] Contact us form (`/contact-us/`)
- [ ] Resource download forms (gated content)
- [ ] ROI calculator form (`/roi-calculator/`)

---

## System 5: Outreach / Salesloft (BDR Sequences)

### Export 5A: Sequence Activity Report

**Who owns this**: BDR Operations / Sales Ops
**Method**: Outreach Analytics export or Salesloft Cadence report
**Filters**: Sequence name contains "RMJ"

| Field Needed | Why We Need It |
|-------------|----------------|
| Prospect Email | **Match to SFDC Contact** |
| SFDC Contact ID (if synced) | Direct join |
| Account Name | Account-level matching fallback |
| Sequence Name | **Which sequence** — answers Q5 directly |
| Step Number | Position in the sequence |
| Step Type | Email, Call, LinkedIn, Manual Task |
| Step Name/Subject | Specific email subject or task description |
| Activity Date | When the step was executed |
| Outcome | See outcomes table below |

**Step outcomes we need:**

| Step Type | Possible Outcomes |
|-----------|------------------|
| Email | delivered, opened, clicked, replied, bounced |
| Call | connected, voicemail, no_answer, wrong_number |
| LinkedIn | connection_sent, accepted, message_sent, replied |
| Manual | completed, skipped |

### ⚠️ Critical Dependency: Outreach-Salesforce Sync

Outreach/Salesloft prospects must be linked to Salesforce Contacts. If the BDR creates prospects outside of Salesforce sync, those activities are invisible.

**Action required**: Ensure all Outreach/Salesloft prospects have a synced Salesforce Contact ID. Verify the sync is active and running.

---

## System 6: Organic Social (LinkedIn Company Page Analytics)

### Export 6A: Organic Social Engagement Report

**Who owns this**: Social Media / Content Marketing team
**Method**: LinkedIn Page Analytics CSV export, or social management platform (Hootsuite, Sprout Social, etc.)
**Filters**: Posts related to RunMyJobs or Workload Automation content

| Field Needed | Why We Need It |
|-------------|----------------|
| Post Date | When the organic post was published |
| Post Type | `thought_leadership`, `customer_story`, `product_update`, `event_promo`, `employee_advocacy`, `infographic` |
| Post Content/Title | Specific post identification |
| Platform | LinkedIn, Twitter, etc. |
| Engagement Type | Like, Comment, Share, Click |
| Engager Company Name | **Account-level matching** (available on LinkedIn page analytics) |
| Engager Email (if available) | Direct contact matching |

### Why Organic Social Matters (Q8, Q10)

The dashboard now distinguishes **paid social** (LinkedIn Ads with spend) from **organic social** (LinkedIn company page posts, employee advocacy, etc.). This is critical for:
- **Q8 (ABM → Outbound)**: Understanding which organic engagements soften accounts before outbound
- **Q10 (Creative Performance)**: Comparing paid vs organic social effectiveness

### ⚠️ Critical Dependency: Company-Level Matching

LinkedIn Page Analytics provides company-level engagement data for some interactions. Matching organic social engagement to Salesforce accounts requires either:
- **Company name matching** — LinkedIn reports which companies engaged with your organic posts
- **Social management platform integration** — Tools like Hootsuite/Sprout may provide richer engagement data
- **Marketo Social Module** — If Marketo social forms or tracking are used on organic post links

**Action required**: Determine which organic social data is available and whether company-level matching is feasible. Even partial organic social data significantly improves Q10 analysis.

---

## Summary: What's Needed From Each Team

| Team | System | Export | Frequency | Priority |
|------|--------|--------|-----------|----------|
| **RevOps** | Salesforce | Opportunity Pipeline + Stage History | Weekly | 🔴 Critical |
| **Marketing Ops** | Marketo | Activity Log (all types) | Weekly | 🔴 Critical |
| **Demand Gen** | LinkedIn | Campaign Performance (incl. Ad Account ID & Spend) | Weekly | 🔴 Critical |
| **Marketing Ops** | WordPress/Marketo | Verify forms are Marketo forms | One-time audit | 🟡 High |
| **BDR Ops** | Outreach/Salesloft | Sequence Activity | Weekly | 🟡 High |
| **Social/Content** | LinkedIn Page / Social Platform | Organic Social Engagement | Weekly | 🟡 High |

## Data Hygiene Checklist (Pre-Launch)

Before the dashboard can produce meaningful results, these items must be verified:

- [ ] **Every RMJ opportunity has Contact Roles** with email addresses
- [ ] **Deal Type field is populated** on all RMJ opportunities (New Logo vs Expansion)
- [ ] **Product Line is identifiable** in Salesforce (field or naming convention)
- [ ] **Marketo-Salesforce sync is active** and leads have SFDC Contact IDs
- [ ] **Munchkin tracking is on all redwood.com pages**
- [ ] **All LinkedIn campaigns have UTM parameters**
- [ ] **All redwood.com forms are Marketo forms** (not native WordPress)
- [ ] **Outreach/Salesloft is synced to Salesforce**
- [ ] **BDR sequences use "RMJ" naming prefix** for filtering
- [ ] **Campaign naming conventions** are consistent across all systems
- [ ] **LinkedIn Ad Account IDs and Spend data** are included in Campaign Manager exports (required for Q13: Paid Media ROI)
- [ ] **Organic social engagement data** is being captured from LinkedIn Page Analytics or social platform (required for Q8, Q10)

---

## Questions?

If any of these exports are not possible, or if fields are named differently in your Salesforce/Marketo instance, please flag them. We can adapt the dashboard to your schema — but we need to know the mapping before build.
