"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
  message: string;
  suggestion: string;
}

export function EmptyState({ message, suggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm text-muted-foreground mb-1">{message}</p>
      <p className="text-xs text-muted-foreground/70">{suggestion}</p>
    </div>
  );
}
