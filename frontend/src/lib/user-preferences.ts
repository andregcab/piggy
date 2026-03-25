const STORAGE_KEY = "budget-tracker-preferences";

const DEFAULT_TRANSACTIONS_PER_PAGE = 25;
const VALID_LIMITS = [25, 50, 100] as const;

export type TransactionsPerPage = (typeof VALID_LIMITS)[number];

const TRANSACTION_SORT_ORDERS = ['asc', 'desc'] as const;
export type TransactionsSortOrder = (typeof TRANSACTION_SORT_ORDERS)[number];
const DEFAULT_TRANSACTIONS_SORT_ORDER: TransactionsSortOrder = 'desc';

export const SPENDING_CHART_TYPES = ['bar', 'pie'] as const;
export type SpendingChartType = (typeof SPENDING_CHART_TYPES)[number];

const DEFAULT_SPENDING_CHART_TYPE: SpendingChartType = 'bar';

type UserPrefs = {
  transactionsPerPage?: number;
  spendingChartType?: string;
  gettingStartedDismissed?: boolean;
  gettingStartedConfettiShown?: boolean;
  dashboardYear?: number;
  dashboardMonth?: number;
  /** When the dashboard month was last selected (ms). Used to detect "entered new month". */
  dashboardLastSelectedAt?: number;
  transactionsFromDate?: string;
  transactionsToDate?: string;
  transactionsSortOrder?: string;
};

function getAllPreferences(): Record<string, UserPrefs> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function setUserPrefs(userId: string, updater: (prefs: UserPrefs) => void) {
  if (typeof window === "undefined") return;
  try {
    const all = getAllPreferences();
    const user = (all[userId] ?? {}) as UserPrefs;
    updater(user);
    all[userId] = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function getUserPrefs(userId: string | null | undefined): UserPrefs {
  if (!userId) return {};
  return (getAllPreferences()[userId] ?? {}) as UserPrefs;
}

export function getTransactionsPerPage(userId: string | null | undefined): TransactionsPerPage {
  const prefs = getUserPrefs(userId);
  const val = prefs.transactionsPerPage;
  if (typeof val === "number" && VALID_LIMITS.includes(val as TransactionsPerPage)) {
    return val as TransactionsPerPage;
  }
  return DEFAULT_TRANSACTIONS_PER_PAGE;
}

export function setTransactionsPerPage(
  userId: string | null | undefined,
  limit: TransactionsPerPage,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.transactionsPerPage = limit;
  });
}

export function getTransactionsSortOrder(
  userId: string | null | undefined,
): TransactionsSortOrder {
  const prefs = getUserPrefs(userId);
  const val = prefs.transactionsSortOrder;
  if (
    typeof val === 'string' &&
    TRANSACTION_SORT_ORDERS.includes(val as TransactionsSortOrder)
  ) {
    return val as TransactionsSortOrder;
  }
  return DEFAULT_TRANSACTIONS_SORT_ORDER;
}

export function setTransactionsSortOrder(
  userId: string | null | undefined,
  order: TransactionsSortOrder,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.transactionsSortOrder = order;
  });
}

export function getSpendingChartType(userId: string | null | undefined): SpendingChartType {
  const prefs = getUserPrefs(userId);
  const val = prefs.spendingChartType;
  if (typeof val === 'string' && SPENDING_CHART_TYPES.includes(val as SpendingChartType)) {
    return val as SpendingChartType;
  }
  return DEFAULT_SPENDING_CHART_TYPE;
}

export function setSpendingChartType(
  userId: string | null | undefined,
  type: SpendingChartType,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.spendingChartType = type;
  });
}

export function getGettingStartedDismissed(userId: string | null | undefined): boolean {
  return getUserPrefs(userId).gettingStartedDismissed === true;
}

export function setGettingStartedDismissed(
  userId: string | null | undefined,
  dismissed: boolean,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.gettingStartedDismissed = dismissed;
  });
}

export function getGettingStartedConfettiShown(userId: string | null | undefined): boolean {
  return getUserPrefs(userId).gettingStartedConfettiShown === true;
}

export function setGettingStartedConfettiShown(
  userId: string | null | undefined,
  shown: boolean,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.gettingStartedConfettiShown = shown;
  });
}

export function getDashboardMonth(
  userId: string | null | undefined,
): { year: number; month: number; lastSelectedAt?: number } | null {
  const p = getUserPrefs(userId);
  const y = p.dashboardYear;
  const m = p.dashboardMonth;
  if (typeof y === 'number' && typeof m === 'number' && m >= 1 && m <= 12) {
    return {
      year: y,
      month: m,
      lastSelectedAt: p.dashboardLastSelectedAt,
    };
  }
  return null;
}

export function setDashboardMonth(
  userId: string | null | undefined,
  year: number,
  month: number,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.dashboardYear = year;
    p.dashboardMonth = month;
    p.dashboardLastSelectedAt = Date.now();
  });
}

export function getTransactionsDateRange(
  userId: string | null | undefined,
): { from: string; to: string } {
  const p = getUserPrefs(userId);
  const from = typeof p.transactionsFromDate === 'string' ? p.transactionsFromDate : '';
  const to = typeof p.transactionsToDate === 'string' ? p.transactionsToDate : '';
  return { from, to };
}

export function setTransactionsDateRange(
  userId: string | null | undefined,
  from: string,
  to: string,
) {
  if (!userId) return;
  setUserPrefs(userId, (p) => {
    p.transactionsFromDate = from;
    p.transactionsToDate = to;
  });
}

/** True if last selection was in a previous calendar month (user has "entered" a new month) */
export function dashboardSelectionIsFromPreviousMonth(
  userId: string | null | undefined,
): boolean {
  const p = getUserPrefs(userId);
  const at = p.dashboardLastSelectedAt;
  if (typeof at !== 'number') return true;
  const then = new Date(at);
  const now = new Date();
  return (
    then.getFullYear() < now.getFullYear() ||
    (then.getFullYear() === now.getFullYear() &&
      then.getMonth() < now.getMonth())
  );
}
