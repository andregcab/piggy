import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CalendarPlus, FileDown, List } from 'lucide-react';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { IncomeEditDialog } from '@/components/dashboard/IncomeEditDialog';
import { ExpectedFixedCard } from '@/components/dashboard/ExpectedFixedCard';
import { SpendingChartCard } from '@/components/dashboard/SpendingChartCard';
import { getInitialMonth } from '@/lib/dashboard-month';

const INVALIDATE_KEYS = [
  'analytics',
  'revenue',
  'expected-fixed-expenses',
];

export function Dashboard() {
  const { user } = useAuth();
  const {
    dashboardMonth,
    setDashboardMonth,
    dashboardSelectionIsFromPreviousMonth,
  } = useUserPreferences();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const initial = getInitialMonth(
    { dashboardMonth, dashboardSelectionIsFromPreviousMonth },
    currentYear,
    currentMonth,
  );
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  // Sync local year/month state when user preferences (or "current month") change so the picker and data stay in sync.
  useEffect(() => {
    if (!dashboardMonth) return;
    const enteredNewMonth = dashboardSelectionIsFromPreviousMonth();
    const target = enteredNewMonth
      ? { year: currentYear, month: currentMonth }
      : { year: dashboardMonth.year, month: dashboardMonth.month };
    if (enteredNewMonth) setDashboardMonth(currentYear, currentMonth);
    if (year !== target.year || month !== target.month) {
      queueMicrotask(() => {
        setYear(target.year);
        setMonth(target.month);
      });
    }
  }, [
    dashboardMonth,
    dashboardSelectionIsFromPreviousMonth,
    currentYear,
    currentMonth,
    year,
    month,
    setDashboardMonth,
  ]);
  const maxMonthForYear = year === currentYear ? currentMonth : 12;
  const effectiveMonth = Math.min(month, maxMonthForYear);

  const {
    data,
    override,
    isLoading,
    chartData,
    variableCategories,
    fixedCategories,
    fixedTotal,
    variableTotal,
    expectedFixed,
    expectedByCategoryId,
    fixedCategoriesForPicker,
  } = useDashboardData(year, effectiveMonth);

  const hasOverride = override != null;
  const defaultIncome = user?.monthlyIncome ?? 0;
  const isViewingCurrentMonth =
    year === currentYear && effectiveMonth === currentMonth;
  const hasNoTransactions = (data?.totalSpend ?? 0) === 0;
  const monthName = new Date(year, effectiveMonth - 1).toLocaleString(
    'default',
    { month: 'long' },
  );

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LoadingSpinner className="mt-4" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-1">
        Spending and savings overview for {monthName} {year}.
      </p>

      <div className="mt-4">
        <MonthYearPicker
          year={year}
          month={effectiveMonth}
          onYearChange={(y) => {
            setYear(y);
            setDashboardMonth(y, month);
          }}
          onMonthChange={(m) => {
            setMonth(m);
            setDashboardMonth(year, m);
          }}
          onJumpToCurrent={() => {
            setYear(currentYear);
            setMonth(currentMonth);
            setDashboardMonth(currentYear, currentMonth);
          }}
          currentYear={currentYear}
          currentMonth={currentMonth}
        />
      </div>

      {data && (
        <SummaryCard
          key={`${year}-${effectiveMonth}`}
          income={data.totalRevenue ?? 0}
          expenses={fixedTotal + variableTotal}
          savings={
            (data.totalRevenue ?? 0) - (fixedTotal + variableTotal)
          }
          incomeAmountSlot={
            <IncomeEditDialog
              year={year}
              month={effectiveMonth}
              monthName={monthName}
              defaultIncome={defaultIncome}
              hasOverride={hasOverride}
              overrideAmount={override?.amount ?? null}
              invalidateKeys={INVALIDATE_KEYS}
            />
          }
        />
      )}

      <ExpectedFixedCard
        year={year}
        month={effectiveMonth}
        fixedCategories={fixedCategories}
        expectedFixed={expectedFixed}
        expectedByCategoryId={expectedByCategoryId}
        fixedCategoriesForPicker={fixedCategoriesForPicker}
        fixedTotal={fixedTotal}
        invalidateKeys={INVALIDATE_KEYS}
      />

      <SpendingChartCard
        year={year}
        month={effectiveMonth}
        variableCategories={variableCategories}
        variableTotal={variableTotal}
      />

      {data && isViewingCurrentMonth && hasNoTransactions && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <CalendarPlus
                className="h-14 w-14 text-primary/70"
                strokeWidth={1.25}
              />
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Welcome to {monthName}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                It’s {monthName}! When you’re ready, add transactions
                and your spending view will fill in. You can import
                from your bank’s CSV or add entries manually.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="default" size="sm">
                  <Link
                    to="/import"
                    className="inline-flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Import from CSV
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/transactions"
                    className="inline-flex items-center gap-2"
                  >
                    <List className="h-4 w-4" />
                    Transactions
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {data && !isViewingCurrentMonth && chartData.length === 0 && (
        <Card className="mt-6 nudge-attention">
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              No spending data for this month. Import a CSV from the{' '}
              <Link to="/import" className="underline">
                Import
              </Link>{' '}
              page to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
