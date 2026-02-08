// ============================================================
// NUMBER FORMATTING UTILITIES — SPEC3 D4
// Consistent formatting across all components
// ============================================================

// Currency - abbreviated in cards/charts, full in tables
export function fmtCurrency(n: number, abbreviated = true): string {
  if (abbreviated) {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
  }
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Percentages - always 1 decimal
export function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

// Deltas - always show direction
export function fmtDelta(n: number, unit: string = ''): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}${unit}`;
}

// Counts - with thousand separators
export function fmtCount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// Days - with "days" suffix
export function fmtDays(n: number): string {
  const rounded = Math.round(n);
  return `${rounded} day${rounded !== 1 ? 's' : ''}`;
}

// Multiplier - e.g. "14.2x"
export function fmtMultiplier(n: number): string {
  return n.toFixed(1) + 'x';
}
