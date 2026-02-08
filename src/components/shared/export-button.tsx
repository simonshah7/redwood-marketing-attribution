"use client";

import { useRef } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportChartAsPng } from "@/lib/export-chart";
import { exportTableAsCsv } from "@/lib/export-csv";

interface ChartExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
  activeFilters?: string;
}

export function ChartExportButton({
  chartRef,
  filename,
  activeFilters,
}: ChartExportButtonProps) {
  async function handleExport() {
    if (!chartRef.current) return;
    const ok = await exportChartAsPng(chartRef.current, filename, activeFilters);
    if (ok) {
      toast.success("Chart exported as PNG");
    } else {
      toast.error("Export failed — try a screenshot instead");
    }
  }

  return (
    <button
      onClick={handleExport}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
      title="Export chart as PNG"
    >
      <Download className="h-3.5 w-3.5" />
    </button>
  );
}

interface CsvExportButtonProps {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  filterContext?: string;
  modelName?: string;
}

export function CsvExportButton({
  headers,
  rows,
  filename,
  filterContext,
  modelName,
}: CsvExportButtonProps) {
  function handleExport() {
    const count = exportTableAsCsv(headers, rows, filename, filterContext, modelName);
    toast.success(`CSV downloaded — ${count} rows`);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
    >
      <FileSpreadsheet className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}
