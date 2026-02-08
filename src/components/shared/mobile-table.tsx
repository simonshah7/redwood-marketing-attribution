"use client";

import { Card, CardContent } from "@/components/ui/card";

interface MobileTableRow {
  title: string;
  subtitle?: string;
  value: string;
  details: { label: string; value: string }[];
}

interface MobileTableProps {
  rows: MobileTableRow[];
}

export function MobileTable({ rows }: MobileTableProps) {
  return (
    <div className="md:hidden space-y-2">
      {rows.map((row, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {row.title}
                </p>
                {row.subtitle && (
                  <p className="text-xs text-muted-foreground">{row.subtitle}</p>
                )}
              </div>
              <p className="font-mono text-sm font-semibold text-foreground">
                {row.value}
              </p>
            </div>
            {row.details.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {row.details.map((d) => (
                  <div key={d.label} className="text-xs text-muted-foreground">
                    {d.label}: <span className="text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
