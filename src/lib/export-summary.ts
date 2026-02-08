// ============================================================
// EXECUTIVE SUMMARY PDF — SPEC3 B4
// ============================================================

import { jsPDF } from 'jspdf';
import { DATA_SNAPSHOT_DATE } from '@/components/shared/freshness';
import { fmtCurrency, fmtPct } from '@/lib/format';
import type { AttributionResult } from '@/lib/attribution';
import type { Channel } from '@/lib/data';

interface SummaryData {
  totalPipeline: number;
  closedWon: number;
  winRate: number;
  opps: number;
  avgTouches: number;
  modelName: string;
  channelAttribution: Record<Channel, AttributionResult>;
  channelNames: Record<string, string>;
  insights: { severity: 'red' | 'yellow' | 'green'; title: string; recommendation: string }[];
}

export function generateExecutiveSummary(data: SummaryData) {
  const dateLabel = new Date(DATA_SNAPSHOT_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();

  let y = 15;

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(227, 52, 47);
  pdf.text('RUNMYJOBS MARKETING ATTRIBUTION — EXECUTIVE SUMMARY', 15, y);
  y += 7;
  pdf.setFontSize(9);
  pdf.setTextColor(160, 160, 160);
  pdf.text(`Data as of: ${dateLabel}`, 15, y);
  y += 4;
  pdf.text('Filters: RMJ Enterprise New Logo', 15, y);
  y += 8;

  // Separator
  pdf.setDrawColor(100, 100, 100);
  pdf.line(15, y, pageW - 15, y);
  y += 6;

  // Key Metrics section
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text('KEY METRICS', 15, y);
  y += 6;

  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  const metrics = [
    ['Total Pipeline:', fmtCurrency(data.totalPipeline)],
    ['Closed Won:', fmtCurrency(data.closedWon)],
    ['Win Rate:', fmtPct(data.winRate)],
    ['Opportunities:', String(data.opps)],
    ['Avg Touches:', data.avgTouches.toFixed(1)],
  ];

  for (const [label, value] of metrics) {
    pdf.setTextColor(160, 160, 160);
    pdf.text(label, 20, y);
    pdf.setTextColor(255, 255, 255);
    pdf.text(value, 65, y);
    y += 5;
  }
  y += 4;

  // Separator
  pdf.setDrawColor(100, 100, 100);
  pdf.line(15, y, pageW - 15, y);
  y += 6;

  // Attribution Highlights
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text(`ATTRIBUTION HIGHLIGHTS (${data.modelName})`, 15, y);
  y += 6;

  const totalPipeline = Object.values(data.channelAttribution).reduce((s, v) => s + v.pipeline, 0);
  const ranked = Object.entries(data.channelAttribution)
    .sort(([, a], [, b]) => b.pipeline - a.pipeline)
    .slice(0, 3);

  pdf.setFontSize(9);
  for (const [ch, result] of ranked) {
    const pct = totalPipeline > 0 ? ((result.pipeline / totalPipeline) * 100).toFixed(1) : '0.0';
    const name = data.channelNames[ch] || ch;
    pdf.setTextColor(255, 255, 255);
    pdf.text(`• ${name} drives ${pct}% of pipeline (${fmtCurrency(result.pipeline)})`, 20, y);
    y += 5;
  }
  y += 4;

  // Separator
  pdf.setDrawColor(100, 100, 100);
  pdf.line(15, y, pageW - 15, y);
  y += 6;

  // Top Insights
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text('TOP INSIGHTS', 15, y);
  y += 6;

  pdf.setFontSize(9);
  for (const insight of data.insights.slice(0, 3)) {
    const emoji = insight.severity === 'red' ? '[!]' : insight.severity === 'yellow' ? '[~]' : '[+]';
    pdf.setTextColor(
      insight.severity === 'red' ? 220 : insight.severity === 'yellow' ? 200 : 100,
      insight.severity === 'red' ? 80 : insight.severity === 'yellow' ? 180 : 200,
      insight.severity === 'red' ? 80 : insight.severity === 'yellow' ? 80 : 120,
    );
    pdf.text(`${emoji} ${insight.title}`, 20, y);
    y += 5;
    pdf.setTextColor(160, 160, 160);
    pdf.text(`Recommendation: ${insight.recommendation}`, 25, y);
    y += 7;
  }

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.text('Confidential — Redwood Software', 15, pageH - 5);

  pdf.save(`redwood-rmj-executive-summary-${DATA_SNAPSHOT_DATE}.pdf`);
}
