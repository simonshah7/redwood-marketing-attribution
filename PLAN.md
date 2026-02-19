# Redwood Marketing Attribution — Expansion Plan

## Overview
Expand the dashboard from backward-looking attribution into a forward-looking pipeline intelligence platform with 8 new capabilities, multi-period data, and full UI/UX redesign.

## Navigation Architecture (5 Collapsible Sections)

```
ATTRIBUTION (existing)
  Overview              /
  First Touch           /first-touch
  Last Touch            /last-touch
  Multi-Touch           /multi-touch

DEEP DIVES (existing)
  Channels              /channels
  Journeys              /journeys
  Pipeline              /pipeline

PREDICTIVE (new)
  Deal Scoring          /deal-scoring
  Revenue Forecast      /revenue-forecast
  ABM Command           /abm

ACTIONS (new)
  Next Best Action      /next-best-action
  Spend Optimizer       /spend-optimizer
  Content Intelligence  /content-intelligence
  Cross-Sell            /cross-sell

EXPLORE (merged)
  Explorer              /explorer
  AI Insights           /ai-insights
```

Sections are collapsible with chevron toggle. State persisted to localStorage.

## Global Period Selector
- Added to header bar, replacing static "Pipeline Jan 31, 2025" badge
- Dropdown with 4 months: Oct 2025, Nov 2025, Dec 2025, Jan 2026
- React Context (`PeriodContext`) wraps the app in layout.tsx
- ALL pages (existing + new) become period-aware with MoM trend indicators

## Phase 1: Foundation (Data + Global Controls)
1. Extend enriched-data.ts types (BuyingCommitteeMember, ContactRole, cross-sell fields)
2. Create mock-multi-period.ts (4 monthly snapshots via time-filtered views)
3. Extend mock-enriched-data.ts (buying committee, Finance Automation accounts, cross-sell opps)
4. Create mock-channel-spend.ts (channel spend reference data)
5. Create period-context.tsx (React Context for period selection)
6. Create period-selector.tsx component
7. Update layout.tsx (wrap in PeriodProvider)
8. Update header.tsx (add PeriodSelector, dynamic date, new PAGE_TITLES)
9. Update sidebar.tsx (5 collapsible sections with chevron toggle)

## Phase 2: Analytics Engine (7 new calculation modules)
1. deal-scoring.ts — 6-factor weighted scoring (channel diversity, touchpoint count, win signals, velocity, recency, event/content engagement)
2. next-best-action.ts — Rules engine: stage-appropriate missing touchpoints, time-since-last-touch, content gaps, event proximity, BDR follow-up
3. spend-optimizer.ts — Marginal ROI equalization with diminishing returns curves
4. content-intelligence.ts — Content × stage heatmap, gap identification, acceleration scoring
5. abm-scoring.ts — Engagement scoring (recency, frequency, breadth, committee coverage)
6. revenue-forecast.ts — Marketing-informed forecast with confidence tiers
7. cross-sell-analysis.ts — Pattern detection between RunMyJobs and Finance Automation

## Phase 3: Core New Pages
1. Deal Scoring — Score distribution chart, sortable deal table, detail drawer with score breakdown
2. ABM Command Centre — Account heat map grid (green/amber/red), buying committee table, engagement trends
3. Content Intelligence — Stage × content heatmap, content ranking, gap analysis cards
4. Spend Optimizer — Current vs recommended allocation (dual donuts), waterfall impact chart, channel table

## Phase 4: Dependent Pages
1. Next Best Action — Action feed grouped by urgency, action cards with rationale
2. Revenue Forecast — KPI summary (high confidence/at risk/projected), comparison chart, weekly projection
3. Cross-Sell — Pattern visualization (flow diagram), opportunity table, pattern cards

## Phase 5: Integration & Polish
1. Update Overview page with computed MoM deltas from period data
2. Create trend-sparkline.tsx reusable component
3. Update all existing pages (Channels, Pipeline, Journeys, attribution pages) to respect period context
4. Add trend sparklines and MoM indicators throughout
5. Update AI Insights page with deal scoring and cross-sell findings

## New Files (42 total)
- 10 data/analytics modules in src/lib/
- 7 new page routes in src/app/
- 25 new components across 7 component directories
- 8 existing files modified
