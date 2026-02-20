'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface GuideContextValue {
  guideMode: boolean;
  toggleGuideMode: () => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

const STORAGE_KEY = 'redwood-guide-mode';

export function GuideProvider({ children }: { children: ReactNode }) {
  const [guideMode, setGuideMode] = useState(true);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setGuideMode(stored === 'true');
      }
    } catch {}
  }, []);

  const toggleGuideMode = useCallback(() => {
    setGuideMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <GuideContext.Provider value={{ guideMode, toggleGuideMode }}>
      {children}
    </GuideContext.Provider>
  );
}

export function useGuide(): GuideContextValue {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error('useGuide must be used within GuideProvider');
  return ctx;
}
