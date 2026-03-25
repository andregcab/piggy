import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getMonthRangeFor } from '@/api/transactions';
import {
  dashboardSelectionIsFromPreviousMonth,
  getDashboardMonth,
  getGettingStartedConfettiShown,
  getGettingStartedDismissed,
  getSpendingChartType,
  getTransactionsPerPage,
  getTransactionsSortOrder,
  getTransactionsDateRange,
  setDashboardMonth,
  setGettingStartedConfettiShown,
  setGettingStartedDismissed,
  setSpendingChartType,
  setTransactionsPerPage,
  setTransactionsSortOrder as setTransactionsSortOrderStorage,
  setTransactionsDateRange as setTransactionsDateRangeStorage,
} from '@/lib/user-preferences';
import type {
  SpendingChartType,
  TransactionsPerPage,
  TransactionsSortOrder,
} from '@/lib/user-preferences';
import {
  UserPreferencesContext,
  type UserPreferencesContextValue,
  type UserPreferencesState,
} from '@/contexts/user-preferences-context';

function readPrefs(userId: string): UserPreferencesState {
  const { from, to } = getTransactionsDateRange(userId);
  return {
    transactionsPerPage: getTransactionsPerPage(userId),
    transactionsSortOrder: getTransactionsSortOrder(userId),
    dashboardMonth: getDashboardMonth(userId),
    transactionsFromDate: from,
    transactionsToDate: to,
    spendingChartType: getSpendingChartType(userId),
    gettingStartedDismissed: getGettingStartedDismissed(userId),
    gettingStartedConfettiShown: getGettingStartedConfettiShown(userId),
  };
}

function getDefaultPrefs(): UserPreferencesState {
  return {
    transactionsPerPage: 25,
    transactionsSortOrder: 'desc',
    dashboardMonth: null,
    transactionsFromDate: '',
    transactionsToDate: '',
    spendingChartType: 'bar',
    gettingStartedDismissed: false,
    gettingStartedConfettiShown: false,
  };
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [prefs, setPrefs] = useState<UserPreferencesState>(() =>
    userId ? readPrefs(userId) : getDefaultPrefs(),
  );

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => setPrefs(getDefaultPrefs()));
      return;
    }
    queueMicrotask(() => setPrefs(readPrefs(userId)));
  }, [userId]);

  const setTransactionsPerPagePref = useCallback(
    (limit: TransactionsPerPage) => {
      if (!userId) return;
      setTransactionsPerPage(userId, limit);
      setPrefs((p) => ({ ...p, transactionsPerPage: limit }));
    },
    [userId],
  );

  const setTransactionsSortOrderPref = useCallback(
    (order: TransactionsSortOrder) => {
      if (!userId) return;
      setTransactionsSortOrderStorage(userId, order);
      setPrefs((p) => ({ ...p, transactionsSortOrder: order }));
    },
    [userId],
  );

  const setDashboardMonthPref = useCallback(
    (year: number, month: number) => {
      if (!userId) return;
      setDashboardMonth(userId, year, month);
      const { from, to } = getMonthRangeFor(year, month);
      setTransactionsDateRangeStorage(userId, from, to);
      setPrefs((p) => ({
        ...p,
        dashboardMonth: { year, month, lastSelectedAt: Date.now() },
        transactionsFromDate: from,
        transactionsToDate: to,
      }));
    },
    [userId],
  );

  const dashboardSelectionIsFromPreviousMonthFn = useCallback(() => {
    return dashboardSelectionIsFromPreviousMonth(userId);
  }, [userId]);

  const setSpendingChartTypePref = useCallback(
    (type: SpendingChartType) => {
      if (!userId) return;
      setSpendingChartType(userId, type);
      setPrefs((p) => ({ ...p, spendingChartType: type }));
    },
    [userId],
  );

  const setGettingStartedDismissedPref = useCallback(
    (dismissed: boolean) => {
      if (!userId) return;
      setGettingStartedDismissed(userId, dismissed);
      setPrefs((p) => ({ ...p, gettingStartedDismissed: dismissed }));
    },
    [userId],
  );

  const setGettingStartedConfettiShownPref = useCallback(
    (shown: boolean) => {
      if (!userId) return;
      setGettingStartedConfettiShown(userId, shown);
      setPrefs((p) => ({ ...p, gettingStartedConfettiShown: shown }));
    },
    [userId],
  );

  const setTransactionsDateRangePref = useCallback(
    (from: string, to: string) => {
      if (!userId) return;
      setTransactionsDateRangeStorage(userId, from, to);
      setPrefs((p) => ({
        ...p,
        transactionsFromDate: from,
        transactionsToDate: to,
      }));
    },
    [userId],
  );

  const value: UserPreferencesContextValue = {
    ...prefs,
    setTransactionsPerPage: setTransactionsPerPagePref,
    setTransactionsSortOrder: setTransactionsSortOrderPref,
    setDashboardMonth: setDashboardMonthPref,
    setTransactionsDateRange: setTransactionsDateRangePref,
    dashboardSelectionIsFromPreviousMonth: dashboardSelectionIsFromPreviousMonthFn,
    setSpendingChartType: setSpendingChartTypePref,
    setGettingStartedDismissed: setGettingStartedDismissedPref,
    setGettingStartedConfettiShown: setGettingStartedConfettiShownPref,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}
