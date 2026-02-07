"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DATA, STAGES } from "@/lib/data";
import { fmt } from "@/lib/utils";

function buildFunnelData() {
  const stageCounts: Record<string, { count: number; value: number }> = {};
  STAGES.forEach((s) => {
    stageCounts[s.key] = { count: 0, value: 0 };
  });

  // Count accounts at each stage or that passed through it
  // For funnel, accounts at later stages have passed through earlier stages
  const stageOrder = STAGES.map((s) => s.key);

  DATA.forEach((acc) => {
    const accStageIdx = stageOrder.indexOf(acc.stage);
    // This account is at or has passed through all stages up to its current stage
    for (let i = 0; i <= accStageIdx; i++) {
      stageCounts[stageOrder[i]].count += 1;
      stageCounts[stageOrder[i]].value += acc.deal;
    }
  });

  const maxCount = Math.max(
    ...Object.values(stageCounts).map((s) => s.count)
  );

  return STAGES.map((stage, idx) => {
    const curr = stageCounts[stage.key];
    const prev = idx > 0 ? stageCounts[STAGES[idx - 1].key] : null;
    const dropPct =
      prev && prev.count > 0
        ? (((prev.count - curr.count) / prev.count) * 100).toFixed(0)
        : null;

    return {
      ...stage,
      count: curr.count,
      value: curr.value,
      widthPct: maxCount > 0 ? (curr.count / maxCount) * 100 : 0,
      dropPct,
    };
  });
}

export function PipelineFunnel() {
  const data = buildFunnelData();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Pipeline Funnel
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Deal progression through pipeline stages
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((stage, idx) => (
          <div key={stage.key}>
            {/* Drop annotation */}
            {stage.dropPct && Number(stage.dropPct) > 0 && (
              <div className="mb-1 flex items-center justify-center">
                <span className="text-[10px] font-medium text-red-400">
                  ↓ {stage.dropPct}% drop
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-right">
                <p className="text-xs font-medium text-foreground">
                  {stage.name}
                </p>
              </div>
              <div className="flex-1">
                <div className="relative h-8 w-full overflow-hidden rounded-md bg-secondary">
                  <div
                    className="flex h-full items-center rounded-md px-3 transition-all duration-700"
                    style={{
                      width: `${Math.max(stage.widthPct, 8)}%`,
                      backgroundColor: stage.color,
                    }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {stage.count}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-20 shrink-0">
                <span className="font-mono text-xs text-muted-foreground">
                  {fmt(stage.value)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
