// ============================================================
// CHART PNG EXPORT — SPEC3 B1
// ============================================================

import { toPng } from 'html-to-image';
import { DATA_SNAPSHOT_DATE } from '@/components/shared/freshness';

export async function exportChartAsPng(
  elementRef: HTMLElement,
  filename: string,
  activeFilters?: string,
) {
  // Create branding overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end;padding:16px 24px;pointer-events:none;z-index:10;';
  overlay.innerHTML = `
    <span style="font-size:10px;color:rgba(255,255,255,0.5);font-family:system-ui;">RunMyJobs Marketing Attribution · Data as of ${new Date(DATA_SNAPSHOT_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:system-ui;">Redwood</span>
  `;

  if (activeFilters) {
    const filterBadge = document.createElement('div');
    filterBadge.style.cssText = 'position:absolute;top:8px;right:24px;font-size:9px;color:rgba(255,255,255,0.4);font-family:system-ui;';
    filterBadge.textContent = activeFilters;
    overlay.appendChild(filterBadge);
  }

  // Temporarily make container relative and add overlay
  const original = elementRef.style.position;
  elementRef.style.position = 'relative';
  elementRef.appendChild(overlay);

  try {
    const dataUrl = await toPng(elementRef, {
      pixelRatio: 2,
      backgroundColor: '#09090b',
      style: { padding: '24px' },
    });

    const link = document.createElement('a');
    link.download = `redwood-attribution-${filename}-${DATA_SNAPSHOT_DATE}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch {
    return false;
  } finally {
    elementRef.removeChild(overlay);
    elementRef.style.position = original;
  }
}
