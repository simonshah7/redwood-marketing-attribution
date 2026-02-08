"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DATA, STAGES } from "@/lib/data";
import { cn, fmt } from "@/lib/utils";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

function buildFunnelData() {
  const stageCounts: Record<string, { count: number; value: number }> = {};
  STAGES.forEach((s) => {
    stageCounts[s.key] = { count: 0, value: 0 };
  });

  const stageOrder = STAGES.map((s) => s.key);

  DATA.forEach((acc) => {
    const accStageIdx = stageOrder.indexOf(acc.stage);
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
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          Pipeline Funnel
          <HelpTip text={HELP_TEXT.pipeline_funnel} />
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Deal progression through pipeline stages
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((stage) => (
          <div key={stage.key}>
            {/* Drop annotation */}
            {stage.dropPct && Number(stage.dropPct) > 0 && (
              <div className="mb-1 flex items-center justify-center">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {stage.dropPct}% drop
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
                <div className="relative h-7 w-full overflow-hidden rounded-md bg-secondary">
                  <div
                    className={cn(
                      "flex h-full items-center rounded-md px-3 transition-all duration-700",
                      stage.key === "closed_won" &&
                        "ring-1 ring-primary/30"
                    )}
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
