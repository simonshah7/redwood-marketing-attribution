// ============================================================
// MULTI-PRODUCT & CROSS-SELL ATTRIBUTION
// Detects cross-sell patterns between RunMyJobs and Finance Automation
// ============================================================

import type { EnrichedAccount, ProductLine } from './enriched-data';

export interface CrossSellPattern {
  primaryProduct: ProductLine;
  crossSellProduct: ProductLine;
  accountCount: number;
  commonTriggers: string[];
  avgDaysBetweenProducts: number;
  crossSellConversionRate: number;
  description: string;
}

export interface CrossSellOpportunity {
  account_id: string;
  account_name: string;
  currentProduct: ProductLine;
  currentStage: string;
  currentDealAmount: number;
  crossSellProduct: ProductLine;
  crossSellStage?: string;
  crossSellDealAmount?: number;
  readinessScore: number; // 0-100
  indicatorsPresent: string[];
  indicatorsMissing: string[];
  recommendation: string;
}

export interface CrossSellSummary {
  totalCrossSellOpportunities: number;
  totalCrossSellPipeline: number;
  avgReadinessScore: number;
  patterns: CrossSellPattern[];
  opportunities: CrossSellOpportunity[];
  productBreakdown: {
    product: ProductLine;
    totalAccounts: number;
    crossSellAccounts: number;
    crossSellRate: number;
  }[];
}

// ---- Cross-sell trigger indicators ----

const CROSS_SELL_INDICATORS = [
  {
    key: 'finance_content',
    label: 'Engaged with Finance Automation content',
    check: (acc: EnrichedAccount) =>
      acc.touchpoints.some(tp =>
        tp.page_url?.includes('finance-automation') ||
        tp.interaction_detail?.toLowerCase().includes('finance')
      ),
  },
  {
    key: 'process_automation_webinar',
    label: 'Attended end-to-end process automation webinar',
    check: (acc: EnrichedAccount) =>
      acc.touchpoints.some(tp =>
        tp.channel === 'webinar' &&
        (tp.event_name?.toLowerCase().includes('process') ||
         tp.event_name?.toLowerCase().includes('automation'))
      ),
  },
  {
    key: 'multi_product_page_visit',
    label: 'Visited multiple product pages',
    check: (acc: EnrichedAccount) => {
      const urls = acc.touchpoints.map(tp => tp.page_url).filter(Boolean);
      const hasRMJ = urls.some(u => u?.includes('workload-automation') || u?.includes('platform'));
      const hasFA = urls.some(u => u?.includes('finance'));
      return hasRMJ && hasFA;
    },
  },
  {
    key: 'expansion_deal',
    label: 'Already an expansion deal type',
    check: (acc: EnrichedAccount) => acc.deal_type === 'Expansion',
  },
  {
    key: 'high_engagement',
    label: 'High engagement score (>65)',
    check: (acc: EnrichedAccount) => (acc.engagement_score || 0) > 65,
  },
  {
    key: 'advanced_stage',
    label: 'Advanced pipeline stage (eval+)',
    check: (acc: EnrichedAccount) =>
      ['eval_planning', 'negotiation', 'closed_won'].includes(acc.stage),
  },
  {
    key: 'multiple_contacts',
    label: 'Multiple buying committee members engaged',
    check: (acc: EnrichedAccount) => {
      const engaged = (acc.buying_committee || []).filter(m => m.touchpoint_count > 0);
      return engaged.length >= 2;
    },
  },
];

// ---- Pattern Detection ----

function detectPatterns(accounts: EnrichedAccount[]): CrossSellPattern[] {
  const patterns: CrossSellPattern[] = [];

  // Find accounts with cross-sell links
  const crossSellAccounts = accounts.filter(a => a.cross_sell_opportunity_id);
  const accountNames = [...new Set(crossSellAccounts.map(a => a.account_name))];

  if (accountNames.length === 0) return patterns;

  // Group by account name to find primary → secondary paths
  const accountGroups = new Map<string, EnrichedAccount[]>();
  for (const acc of crossSellAccounts) {
    const group = accountGroups.get(acc.account_name) || [];
    group.push(acc);
    accountGroups.set(acc.account_name, group);
  }

  // Analyze RMJ → FA pattern
  const rmjToFA: { days: number; triggers: string[] }[] = [];
  for (const [, group] of accountGroups) {
    const rmj = group.find(a => a.product_line === 'RunMyJobs');
    const fa = group.find(a => a.product_line === 'Finance Automation');
    if (rmj && fa) {
      const daysBetween = Math.abs(
        new Date(fa.created_date).getTime() - new Date(rmj.created_date).getTime()
      ) / 86400000;
      rmjToFA.push({
        days: daysBetween,
        triggers: CROSS_SELL_INDICATORS
          .filter(ind => ind.check(rmj))
          .map(ind => ind.label),
      });
    }
  }

  if (rmjToFA.length > 0) {
    const avgDays = Math.round(
      rmjToFA.reduce((s, x) => s + x.days, 0) / rmjToFA.length
    );

    // Count trigger frequency
    const triggerCounts = new Map<string, number>();
    for (const entry of rmjToFA) {
      for (const trigger of entry.triggers) {
        triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1);
      }
    }
    const commonTriggers = [...triggerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    // Conversion rate: accounts with RMJ that also bought FA / all RMJ accounts
    const totalRMJ = accounts.filter(a => a.product_line === 'RunMyJobs').length;
    const conversionRate = totalRMJ > 0 ? rmjToFA.length / totalRMJ : 0;

    patterns.push({
      primaryProduct: 'RunMyJobs',
      crossSellProduct: 'Finance Automation',
      accountCount: rmjToFA.length,
      commonTriggers,
      avgDaysBetweenProducts: avgDays,
      crossSellConversionRate: Math.round(conversionRate * 100),
      description: `${rmjToFA.length} accounts that bought RunMyJobs later engaged with Finance Automation. The trigger was typically ${commonTriggers[0] || 'multi-product content engagement'}.`,
    });
  }

  return patterns;
}

// ---- Opportunity Identification ----

function identifyOpportunities(accounts: EnrichedAccount[]): CrossSellOpportunity[] {
  const opportunities: CrossSellOpportunity[] = [];

  // Find RMJ accounts that might be cross-sell candidates for FA
  const rmjAccounts = accounts.filter(a =>
    a.product_line === 'RunMyJobs' &&
    a.stage !== 'closed_lost'
  );

  // Find accounts that already have FA opps
  const faAccountNames = new Set(
    accounts
      .filter(a => a.product_line === 'Finance Automation')
      .map(a => a.account_name)
  );

  for (const acc of rmjAccounts) {
    const present = CROSS_SELL_INDICATORS.filter(ind => ind.check(acc));
    const missing = CROSS_SELL_INDICATORS.filter(ind => !ind.check(acc));
    const readiness = Math.round((present.length / CROSS_SELL_INDICATORS.length) * 100);

    // Only include accounts with some cross-sell signals
    if (readiness < 15) continue;

    // Check if they already have FA opp
    const hasFA = faAccountNames.has(acc.account_name);
    const faOpp = hasFA
      ? accounts.find(a => a.account_name === acc.account_name && a.product_line === 'Finance Automation')
      : undefined;

    const recommendation = readiness >= 60
      ? `High cross-sell readiness. Initiate Finance Automation conversation — leverage existing RunMyJobs relationship.`
      : readiness >= 35
      ? `Moderate readiness. Send end-to-end process automation content and invite to Finance Automation webinar.`
      : `Early stage. Begin nurturing with Finance Automation awareness content alongside RunMyJobs engagement.`;

    opportunities.push({
      account_id: acc.account_id,
      account_name: acc.account_name,
      currentProduct: 'RunMyJobs',
      currentStage: acc.stage,
      currentDealAmount: acc.deal_amount,
      crossSellProduct: 'Finance Automation',
      crossSellStage: faOpp?.stage,
      crossSellDealAmount: faOpp?.deal_amount,
      readinessScore: readiness,
      indicatorsPresent: present.map(i => i.label),
      indicatorsMissing: missing.map(i => i.label),
      recommendation,
    });
  }

  return opportunities.sort((a, b) => b.readinessScore - a.readinessScore);
}

// ---- Main Entry ----

export function analyzeCrossSell(accounts: EnrichedAccount[]): CrossSellSummary {
  const patterns = detectPatterns(accounts);
  const opportunities = identifyOpportunities(accounts);

  const rmjAccounts = accounts.filter(a => a.product_line === 'RunMyJobs');
  const faAccounts = accounts.filter(a => a.product_line === 'Finance Automation');
  const crossSellNames = new Set(
    accounts.filter(a => a.cross_sell_opportunity_id).map(a => a.account_name)
  );

  return {
    totalCrossSellOpportunities: opportunities.length,
    totalCrossSellPipeline: opportunities
      .filter(o => o.crossSellDealAmount)
      .reduce((s, o) => s + (o.crossSellDealAmount || 0), 0),
    avgReadinessScore: opportunities.length > 0
      ? Math.round(opportunities.reduce((s, o) => s + o.readinessScore, 0) / opportunities.length)
      : 0,
    patterns,
    opportunities,
    productBreakdown: [
      {
        product: 'RunMyJobs' as ProductLine,
        totalAccounts: rmjAccounts.length,
        crossSellAccounts: [...new Set(rmjAccounts.filter(a => crossSellNames.has(a.account_name)).map(a => a.account_name))].length,
        crossSellRate: rmjAccounts.length > 0
          ? Math.round(([...new Set(rmjAccounts.filter(a => crossSellNames.has(a.account_name)).map(a => a.account_name))].length / rmjAccounts.length) * 100)
          : 0,
      },
      {
        product: 'Finance Automation' as ProductLine,
        totalAccounts: faAccounts.length,
        crossSellAccounts: faAccounts.length,
        crossSellRate: 100, // All FA accounts are cross-sell by definition in our data
      },
    ],
  };
}
