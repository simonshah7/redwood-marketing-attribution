"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
  message: string;
  suggestion: string;
}

export function EmptyState({ message, suggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
        <SearchX className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground/60">{suggestion}</p>
    </div>
  );
}
