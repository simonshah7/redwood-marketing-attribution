"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTipProps {
  text: string;
}

export function HelpTip({ text }: HelpTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="text-xs text-muted-foreground leading-relaxed max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// Centralized help content
export const HELP_TEXT = {
  // Attribution models
  first_touch:
    "Gives 100% credit to the channel that first made this prospect aware of Redwood. Use this to understand where your pipeline originates.",
  last_touch:
    "Gives 100% credit to the final interaction before the deal progressed. Use this to understand what's converting prospects.",
  linear:
    "Splits credit equally across every touchpoint in the buyer's journey. If a deal had 4 touches, each one gets 25% of the credit. This gives you the most balanced view of how all your channels work together.",
  time_decay:
    "Gives more credit to touchpoints that happened recently, and less to older ones. Think of it like a half-life: a webinar last month matters more than a LinkedIn click 9 months ago. Use this to see which channels are actively accelerating your deals right now.",
  position_based:
    "Gives 40% credit to the very first touch (the one that started the conversation), 40% to the very last touch (the one that closed the deal), and spreads the remaining 20% evenly across everything in between. Great for understanding both what opens doors and what seals deals.",

  // Overview KPIs
  total_pipeline:
    "The total dollar value of all open and closed deals in the pipeline during this period. This is the sum of every opportunity regardless of its current stage.",
  closed_won:
    "The total dollar value of deals that were successfully closed and won during this period. This is actual revenue generated.",
  win_rate:
    "The percentage of all opportunities that ended in a win. Calculated as: won deals divided by total deals. Higher is better.",
  opportunities:
    "The total number of deals (opportunities) being tracked in the pipeline during this period, including open, won, and lost.",
  avg_touches:
    "The average number of marketing interactions (touchpoints) per deal. More touches usually mean more engagement before a deal closes.",
  cost_per_pipeline_card:
    "How much you spend to generate $1 of attributed pipeline. Lower means more efficient spend. Requires channel budgets to be entered via the budget button.",

  // Explorer metrics
  pipeline_influenced:
    "Total deal value of all opportunities where this touchpoint appeared anywhere in the journey.",
  influence_score:
    "Combines pipeline value with breadth — a touchpoint that appears across many deals scores higher than one in a single large deal.",
  lift_ratio:
    "How much more likely a touchpoint is to appear in won deals vs lost. A lift of 2.0x means it appears twice as often in wins.",
  velocity_impact:
    "How many days faster (or slower) deals progress when this touchpoint is present. Positive = deals move faster.",
  cost_per_pipeline:
    "How much you spend to generate $1 of attributed pipeline. Lower is better. Requires channel budgets to be entered.",

  // Charts
  model_comparison:
    "Compares how three different attribution models (First Touch, Last Touch, and Multi-Touch) distribute pipeline credit across your marketing channels. Each bar shows the percentage split so you can see which channels get more or less credit depending on the model you use.",
  pipeline_funnel:
    "Shows how deals flow through your sales pipeline stages from initial discovery to close. The drop percentage between stages shows where deals fall off. Use this to spot bottlenecks in your sales process.",
  monthly_timeline:
    "Shows the total number of marketing touchpoints (interactions) each month, broken down by channel. Use this to spot trends in marketing activity and see how channel engagement changes over time.",
  won_vs_lost:
    "Compares the average number of marketing touches per channel between deals that were won and deals that were lost. Channels where won deals have significantly more touches may be important for winning.",
  model_comparison_table:
    "Side-by-side comparison of pipeline credit given to each channel under First Touch, Last Touch, and Multi-Touch models. The delta columns show how much multi-touch changes the picture compared to single-touch models.",

  // Channel page
  channel_card:
    "Shows total marketing touchpoints for this channel with a monthly trend and the top-performing campaigns. Use this to understand how active each channel is and which campaigns drive the most engagement.",
  channel_sparkline:
    "A mini chart showing how this channel's touch volume changed month-to-month over the 12-month period.",
  top_campaigns:
    "The campaigns within this channel that generated the most touchpoints. Longer bars = more engagement.",

  // Attribution page cards
  channel_pipeline:
    "The total pipeline value attributed to this channel under the selected attribution model. The percentage shows this channel's share of the total attributed pipeline.",
  channel_revenue:
    "Revenue from closed-won deals attributed to this channel.",
  channel_opps:
    "Number of opportunities where this channel received attribution credit.",

  // Pipeline page
  stage_channel_mix:
    "Shows what percentage of marketing touches came from each channel at every pipeline stage. Use this to see how channel influence shifts as deals progress — for example, LinkedIn may dominate early stages while Forms dominate later ones.",
  pipeline_by_region:
    "Pipeline value and channel mix broken down by geographic region (NA, EMEA, APAC). The colored bars show the proportion of touches from each channel.",
  industry_breakdown:
    "Shows how pipeline is distributed across your target industries, sorted by total pipeline value.",

  // Journeys page
  journey_timeline:
    "Each row shows one account's complete marketing journey plotted on a timeline. Each dot represents a marketing touchpoint, colored by channel type. Hover over any dot to see the full details of that interaction.",
  journey_patterns:
    "Key patterns identified in how accounts move through the marketing journey. Winning patterns show common sequences in won deals; losing patterns show what happens in lost deals.",

  // Explorer page
  explorer_page_influence:
    "Analyzes which website pages appear most often in the journeys of deals that converted. Pages with high influence scores appear in many winning journeys.",
  explorer_content_impact:
    "Shows which content assets (guides, datasheets, case studies) are most effective at moving deals forward through the pipeline.",
  explorer_win_loss:
    "Identifies the touchpoints that are most predictive of winning vs losing deals. High lift ratios mean a touchpoint appears much more often in won deals.",
  explorer_first_touch:
    "Breaks down what the actual first marketing interaction was for each deal. Shows which channels and campaigns are most effective at starting new relationships.",
  explorer_bdr:
    "Measures how effective outbound BDR (Business Development Rep) sequences are at generating pipeline. Shows which sequences and step types produce the best results.",
  explorer_sequences:
    "Identifies the multi-step marketing combinations that lead to the highest win rates. For example, 'LinkedIn Ad then Event then Form' might convert better than 'Email only'.",

  // Alert section
  attribution_alerts:
    "Automated insights flagged by comparing different attribution models. Red alerts highlight concerning gaps, amber alerts are things to watch, and blue alerts are informational findings.",
} as const;
