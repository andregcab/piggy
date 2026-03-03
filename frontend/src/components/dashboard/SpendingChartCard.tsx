import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitleWithInfo } from '@/components/ui/card-title-with-info';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/transaction-utils';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { CalendarRange } from 'lucide-react';
import type { ChartCategory } from '@/hooks/useDashboardData';
import { SpendingBarChart } from '@/components/charts/SpendingBarChart';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SpendingChartCardProps = {
  variableCategories: ChartCategory[];
  variableTotal: number;
};

export function SpendingChartCard({
  variableCategories,
  variableTotal,
}: SpendingChartCardProps) {
  const { spendingChartType: chartType, setSpendingChartType } =
    useUserPreferences();
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleChartTypeChange = (type: 'bar' | 'pie') => {
    setSpendingChartType(type);
  };

  // Table/chart order: budgeted categories first, then non-budgeted; alphabetical within each group.
  const sortedVariableCategories = [...variableCategories].sort(
    (a, b) => {
      const aHasBudget = a.budget > 0;
      const bHasBudget = b.budget > 0;
      if (aHasBudget !== bHasBudget) return aHasBudget ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
    },
  );

  if (variableCategories.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }
      }
    >
      <Card className="mt-6">
        <CardHeader>
          <CardTitleWithInfo
            title="Spending"
            infoContent={
              <>
                Groceries, dining, shopping — set budgets in{' '}
                <Link to="/categories" className="underline">
                  Categories
                </Link>
                . Over-budget items are highlighted.
              </>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full min-w-0 space-y-2">
            <div className="space-y-3">
              {sortedVariableCategories.map((c) => {
                const pct =
                  c.budget > 0
                    ? Math.min((c.total / c.budget) * 100, 100)
                    : 0;
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          c.over
                            ? 'font-medium text-destructive'
                            : 'font-medium'
                        }
                      >
                        {c.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(c.total)}
                        {c.budget > 0 && (
                          <>
                            {' '}
                            / {formatCurrency(c.budget)}
                            <span
                              className={
                                c.over
                                  ? 'ml-1 font-medium text-destructive'
                                  : 'ml-1 text-[var(--positive)]'
                              }
                            >
                              {c.over ? 'Over' : 'Under'}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    {c.budget > 0 && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.over ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
              <span>Total</span>
              <span>{formatCurrency(variableTotal)}</span>
            </div>
          </div>

          <div className="mt-16 space-y-3 min-w-0 overflow-visible">
            {variableTotal === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 px-6 text-center"
                aria-hidden
              >
                <CalendarRange
                  className="h-12 w-12 text-muted-foreground/60"
                  strokeWidth={1.25}
                />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No spending yet this month
                </p>
                <p className="mt-1 max-w-[260px] text-sm text-muted-foreground">
                  Your budgets are ready. When you add transactions,
                  your chart will show up here.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-1">
                  {(['bar', 'pie'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={
                        chartType === type ? 'secondary' : 'ghost'
                      }
                      size="sm"
                      className="capitalize"
                      onClick={() => handleChartTypeChange(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <div
                  className={cn(
                    'w-full',
                    chartType === 'bar'
                      ? 'h-[320px] md:h-[360px]'
                      : 'h-[460px] md:h-[560px]',
                  )}
                >
                  {chartType === 'bar' ? (
                    <SpendingBarChart
                      categories={sortedVariableCategories}
                      className="w-full h-full"
                    />
                  ) : (
                    <SpendingPieChart
                      categories={sortedVariableCategories}
                      className="w-full h-full"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
