// ============================================================
// VIEW PDF EXPORT — SPEC3 B3
// ============================================================

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { DATA_SNAPSHOT_DATE } from '@/components/shared/freshness';

export async function exportViewAsPdf(
  viewElement: HTMLElement,
  viewTitle: string,
  filterSummary?: string,
) {
  const dateLabel = new Date(DATA_SNAPSHOT_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Capture the view at 2x for sharp text
  const dataUrl = await toPng(viewElement, {
    pixelRatio: 2,
    backgroundColor: '#09090b',
  });

  // Create landscape A4 PDF
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Header
  pdf.setFontSize(14);
  pdf.setTextColor(227, 52, 47); // Redwood red
  pdf.text('Redwood', 15, 15);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.text('RunMyJobs Marketing Attribution', 45, 15);
  pdf.setFontSize(9);
  pdf.setTextColor(160, 160, 160);
  pdf.text(`${viewTitle} · Data as of: ${dateLabel}`, 15, 22);
  if (filterSummary) {
    pdf.text(`Filters: ${filterSummary}`, 15, 27);
  }

  // Content image
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const contentY = filterSummary ? 32 : 27;
  const maxW = pageW - 30;
  const maxH = pageH - contentY - 15;
  const aspectRatio = img.width / img.height;
  let imgW = maxW;
  let imgH = imgW / aspectRatio;
  if (imgH > maxH) {
    imgH = maxH;
    imgW = imgH * aspectRatio;
  }

  pdf.addImage(dataUrl, 'PNG', 15, contentY, imgW, imgH);

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Confidential — Redwood Software', 15, pageH - 5);
  pdf.text(`Page 1`, pageW - 25, pageH - 5);

  pdf.save(`redwood-rmj-attribution-${viewTitle.toLowerCase().replace(/\s+/g, '-')}-${DATA_SNAPSHOT_DATE}.pdf`);
}
