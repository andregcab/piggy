import { createContext } from 'react';
import type {
  SpendingChartType,
  TransactionsPerPage,
  TransactionsSortOrder,
} from '@/lib/user-preferences';

export type UserPreferencesState = {
  transactionsPerPage: TransactionsPerPage;
  transactionsSortOrder: TransactionsSortOrder;
  dashboardMonth: { year: number; month: number; lastSelectedAt?: number } | null;
  transactionsFromDate: string;
  transactionsToDate: string;
  spendingChartType: SpendingChartType;
  gettingStartedDismissed: boolean;
  gettingStartedConfettiShown: boolean;
};

export type UserPreferencesContextValue = UserPreferencesState & {
  setTransactionsPerPage: (limit: TransactionsPerPage) => void;
  setTransactionsSortOrder: (order: TransactionsSortOrder) => void;
  setDashboardMonth: (year: number, month: number) => void;
  setTransactionsDateRange: (from: string, to: string) => void;
  dashboardSelectionIsFromPreviousMonth: () => boolean;
  setSpendingChartType: (type: SpendingChartType) => void;
  setGettingStartedDismissed: (dismissed: boolean) => void;
  setGettingStartedConfettiShown: (shown: boolean) => void;
};

export const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);
