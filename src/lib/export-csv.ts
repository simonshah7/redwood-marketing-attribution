// ============================================================
// TABLE CSV EXPORT — SPEC3 B2
// ============================================================

import { DATA_SNAPSHOT_DATE } from '@/components/shared/freshness';

export function exportTableAsCsv(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  filterContext?: string,
  modelName?: string,
) {
  const lines: string[] = [];

  // Add metadata comment rows
  if (filterContext) {
    lines.push(`# Filters: ${filterContext}`);
  }
  lines.push(`# Data as of: ${DATA_SNAPSHOT_DATE}`);
  if (modelName) {
    lines.push(`# Attribution Model: ${modelName}`);
  }
  lines.push('');

  // Header row
  lines.push(headers.map(escapeCsv).join(','));

  // Data rows
  for (const row of rows) {
    lines.push(row.map(v => escapeCsv(String(v))).join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `redwood-attribution-${filename}-${DATA_SNAPSHOT_DATE}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  return rows.length;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
