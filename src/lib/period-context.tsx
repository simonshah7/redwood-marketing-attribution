'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ReportingPeriod = 'oct-2025' | 'nov-2025' | 'dec-2025' | 'jan-2026';

export interface PeriodContextValue {
  period: ReportingPeriod;
  setPeriod: (p: ReportingPeriod) => void;
  periodLabel: string;
  periodEndDate: string;
  periodIndex: number;
}

const PERIOD_META: Record<ReportingPeriod, { label: string; endDate: string; index: number }> = {
  'oct-2025': { label: 'Oct 2025', endDate: '2025-10-31', index: 0 },
  'nov-2025': { label: 'Nov 2025', endDate: '2025-11-30', index: 1 },
  'dec-2025': { label: 'Dec 2025', endDate: '2025-12-31', index: 2 },
  'jan-2026': { label: 'Jan 2026', endDate: '2026-01-31', index: 3 },
};

export const PERIODS: ReportingPeriod[] = ['oct-2025', 'nov-2025', 'dec-2025', 'jan-2026'];

export function getPeriodMeta(period: ReportingPeriod) {
  return PERIOD_META[period];
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<ReportingPeriod>('jan-2026');

  const setPeriod = useCallback((p: ReportingPeriod) => {
    setPeriodState(p);
  }, []);

  const meta = PERIOD_META[period];

  return (
    <PeriodContext.Provider
      value={{
        period,
        setPeriod,
        periodLabel: meta.label,
        periodEndDate: meta.endDate,
        periodIndex: meta.index,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider');
  return ctx;
}
