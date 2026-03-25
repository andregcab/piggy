import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getTransactions,
  getMonthRangeFor,
} from '@/api/transactions';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export function useTransactions() {
  const {
    transactionsPerPage: limit,
    setTransactionsPerPage,
    transactionsSortOrder: sortOrder,
    setTransactionsSortOrder: setTransactionsSortOrderPref,
    dashboardMonth,
    transactionsFromDate,
    transactionsToDate,
    setTransactionsDateRange,
  } = useUserPreferences();

  const { fromDate, toDate } = useMemo(() => {
    if (transactionsFromDate || transactionsToDate) {
      return {
        fromDate: transactionsFromDate,
        toDate: transactionsToDate,
      };
    }
    if (dashboardMonth) {
      const { from, to } = getMonthRangeFor(
        dashboardMonth.year,
        dashboardMonth.month,
      );
      return { fromDate: from, toDate: to };
    }
    return { fromDate: '', toDate: '' };
  }, [transactionsFromDate, transactionsToDate, dashboardMonth]);

  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [page, setPage] = useState(1);
  const setSortOrder = (
    next: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc'),
  ) => {
    const resolved =
      typeof next === 'function' ? next(sortOrder) : next;
    setTransactionsSortOrderPref(resolved);
    setPage(1);
  };

  const setFromDate = (v: string) => {
    setTransactionsDateRange(v, toDate);
    setPage(1);
  };
  const setToDate = (v: string) => {
    setTransactionsDateRange(fromDate, v);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      'transactions',
      accountId,
      categoryId,
      fromDate,
      toDate,
      page,
      limit,
      sortOrder,
    ],
    queryFn: () =>
      getTransactions({
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit,
        sortOrder,
      }),
  });

  const handleLimitChange = (next: 25 | 50 | 100) => {
    setTransactionsPerPage(next);
    setPage(1);
  };

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.ceil(total / limit);

  return {
    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    page,
    setPage,
    limit,
    setLimit: handleLimitChange,
    sortOrder,
    setSortOrder,
    isLoading,
    items,
    total,
    totalPages,
  };
}
