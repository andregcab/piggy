import { useEffect, useState } from 'react';

/**
 * Local calendar year and month (1–12). Re-renders at the next local midnight and when the tab/window regains
 * focus so a long-lived page does not keep a stale “today” until unrelated UI updates.
 */
export function useLocalCalendarMonth(): { year: number; month: number } {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const scheduleNextLocalMidnight = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      const t = new Date();
      const nextMidnight = new Date(
        t.getFullYear(),
        t.getMonth(),
        t.getDate() + 1,
      );
      timeoutId = setTimeout(() => {
        bump();
        scheduleNextLocalMidnight();
      }, Math.max(1, nextMidnight.getTime() - t.getTime()));
    };
    scheduleNextLocalMidnight();
    const onVisible = () => {
      if (document.visibilityState === 'visible') bump();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', bump);
    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', bump);
    };
  }, []);

  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
