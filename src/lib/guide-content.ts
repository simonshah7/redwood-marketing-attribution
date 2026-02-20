export interface PageGuideContent {
  whatItShows: string;
  whenToUseIt: string;
  whatToDo: string;
}

export const PAGE_GUIDES: Record<string, PageGuideContent> = {
  "/": {
    whatItShows:
      "High-level pipeline health and channel credit under your selected attribution model. The KPIs, funnel, and channel breakdown all recalculate when you switch models.",
    whenToUseIt:
      "Weekly pipeline reviews, preparing for marketing standups, or getting a quick pulse on what's working.",
    whatToDo:
      "Look for channels with high pipeline share but low win rate — that signals awareness without conversion. Switch attribution models to see if credit shifts dramatically.",
  },
  "/first-touch": {
    whatItShows:
      "Which channels and campaigns sourced accounts — 100% credit goes to the very first touchpoint that brought each account into the funnel.",
    whenToUseIt:
      "Evaluating top-of-funnel performance and demand gen effectiveness. Useful for answering 'where do our best accounts come from?'",
    whatToDo:
      "Compare sourcing channels by win rate, not just pipeline volume. A channel that sources fewer but higher-converting accounts may deserve more budget.",
  },
  "/last-touch": {
    whatItShows:
      "Which channels and campaigns get credit for the final touchpoint before conversion — the 'closer' in each deal.",
    whenToUseIt:
      "Understanding what drives final conversion decisions and validating bottom-of-funnel investments.",
    whatToDo:
      "Compare with First-Touch to find channels that close but don't source (or vice versa). These patterns reveal your funnel's hidden dependencies.",
  },
  "/multi-touch": {
    whatItShows:
      "How credit redistributes when every touchpoint counts. Compare models side-by-side to see which channels gain or lose credit.",
    whenToUseIt:
      "When you suspect a channel is over- or under-credited by single-touch models. Budget allocation discussions with leadership.",
    whatToDo:
      "Compare delta columns — large positive deltas reveal undervalued channels worth more investment. Look at won vs lost touchpoint patterns to understand what winning journeys look like.",
  },
  "/data-driven": {
    whatItShows:
      "Markov chain-based attribution that measures each channel's true incremental impact on conversion. Unlike rule-based models, this approach uses probabilistic analysis of actual journey paths.",
    whenToUseIt:
      "When you need an unbiased, data-driven view of channel value. Especially useful for validating or challenging assumptions from simpler attribution models.",
    whatToDo:
      "Compare Markov weights against Linear to spot channels whose value is hidden by simpler models. Check the transition matrix to understand how accounts flow between channels on the path to conversion.",
  },
  "/attribution-trends": {
    whatItShows:
      "How channel attribution evolves month-over-month across all models. Reveals seasonal patterns and shifting channel effectiveness.",
    whenToUseIt:
      "Quarterly planning, identifying emerging or declining channels, and spotting seasonal patterns before they repeat.",
    whatToDo:
      "Look for channels with rising trend lines — they may warrant more investment. Declining channels need investigation: is it spend reduction or diminishing returns?",
  },
  "/channels": {
    whatItShows:
      "Deep performance comparison across all marketing channels: touches, pipeline influence, conversion rates, and deal velocity.",
    whenToUseIt:
      "Channel-level budget reviews, comparing efficiency metrics, and identifying which channels accelerate deals vs slow them down.",
    whatToDo:
      "Sort by different metrics to challenge assumptions. A channel might rank #1 in touches but last in conversion — volume doesn't equal value.",
  },
  "/journeys": {
    whatItShows:
      "Complete touchpoint timelines for every account, plus channel transition flows and the golden path pattern of won deals.",
    whenToUseIt:
      "Understanding the actual buyer journey — how accounts move between channels and what sequences lead to closed-won.",
    whatToDo:
      "Study the golden path: the most common channel sequence for won deals. Then check if your current campaigns reflect that sequence.",
  },
  "/pipeline": {
    whatItShows:
      "Conversion rates between pipeline stages, velocity metrics, regional performance, and where deals stall or die in the funnel.",
    whenToUseIt:
      "Diagnosing where deals stall, planning content for specific stages, and identifying regional performance gaps.",
    whatToDo:
      "Find the stage with the highest drop-off and check what content or touchpoints are missing there. Compare won vs lost velocity to set realistic timelines.",
  },
  "/explorer": {
    whatItShows:
      "Full pivot-table view of attribution data with statistical significance testing. Slice by channel, stage, region, or campaign.",
    whenToUseIt:
      "Ad-hoc analysis, answering specific questions from stakeholders, or digging into anomalies spotted on other pages.",
    whatToDo:
      "Use the significance indicators to separate real signals from noise. Focus on segments with both high pipeline and statistical confidence.",
  },
  "/ai-insights": {
    whatItShows:
      "AI-generated insights that surface anomalies, recommendations, and patterns across all your marketing data.",
    whenToUseIt:
      "When you want a quick summary of what deserves attention across the entire dashboard without checking every page.",
    whatToDo:
      "Review the high-priority insights first and drill into the referenced pages for details. Use these as your weekly action item list.",
  },
  "/deal-scoring": {
    whatItShows:
      "Win probability for every open deal based on touchpoint pattern analysis against historical won and lost deals. Includes model accuracy backtesting.",
    whenToUseIt:
      "Prioritizing sales rep time, identifying at-risk pipeline, and validating forecast accuracy.",
    whatToDo:
      "Sort by score to find the cluster of deals between 30-50% — these are most improvable with targeted outreach. Use the backtest metrics to calibrate your confidence in the scores.",
  },
  "/revenue-forecast": {
    whatItShows:
      "Revenue projections based on current pipeline, historical conversion rates, and scenario modeling across different growth assumptions.",
    whenToUseIt:
      "Board reporting, quarterly target setting, and stress-testing revenue assumptions.",
    whatToDo:
      "Compare the base forecast against scenarios. If the pessimistic case still hits your target, you're in a strong position. If not, focus on the pipeline gap.",
  },
  "/abm": {
    whatItShows:
      "Account-level engagement scoring with time-decayed activity, buying committee coverage, competitive signals, and intent indicators.",
    whenToUseIt:
      "Prioritizing ABM accounts for sales outreach, identifying accounts showing buying signals, and tracking account progression.",
    whatToDo:
      "Focus on accounts with high engagement but missing buying committee roles — they need targeted persona outreach. Flag accounts with competitive signals for urgent sales follow-up.",
  },
  "/next-best-action": {
    whatItShows:
      "AI-recommended next actions for open opportunities based on touchpoint gap analysis and pattern matching against successful deals.",
    whenToUseIt:
      "Weekly sales-marketing alignment meetings, planning targeted outreach, and closing pipeline gaps.",
    whatToDo:
      "Prioritize actions by expected impact. Focus on high-value deals with clear touchpoint gaps that match your campaign capabilities.",
  },
  "/spend-optimizer": {
    whatItShows:
      "Optimal budget reallocation based on diminishing returns analysis per channel. Shows what happens if you shift spend between channels.",
    whenToUseIt:
      "Quarterly planning, budget reviews, proving ROI to leadership, and modeling 'what-if' budget scenarios.",
    whatToDo:
      "Use the scenario comparison to model upside from budget shifts before committing. Start with the channel showing the highest marginal return per dollar.",
  },
  "/content-intelligence": {
    whatItShows:
      "Content performance by type, stage influence, sequence analysis, and which content combinations drive progression through the funnel.",
    whenToUseIt:
      "Content planning, editorial calendar prioritization, and understanding which assets your team should produce more of.",
    whatToDo:
      "Identify content types that appear most in winning sequences but are underproduced. These are your highest-ROI content investments.",
  },
  "/cross-sell": {
    whatItShows:
      "Attribution analysis focused on expansion revenue — which channels and touchpoints drive cross-sell and upsell pipeline.",
    whenToUseIt:
      "Planning customer marketing programs, evaluating expansion channel mix, and comparing new-logo vs expansion attribution.",
    whatToDo:
      "Compare cross-sell attribution to new-logo attribution. Channels that drive expansion but not acquisition (or vice versa) need separate strategies.",
  },
  "/cohorts": {
    whatItShows:
      "How groups of accounts perform differently when segmented by time period, source channel, engagement density, or industry.",
    whenToUseIt:
      "Understanding which segments convert best and why. Validating ICP hypotheses with actual conversion data.",
    whatToDo:
      "Compare win rates across cohorts to find your ideal customer profile. Look for engagement density thresholds where win rate jumps — that's your activation target.",
  },
};
