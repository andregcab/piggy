import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitleWithInfo } from '@/components/ui/card-title-with-info';
import { Button } from '@/components/ui/button';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  barColorByRatio,
  chartConfig,
  PIE_COLORS,
} from '@/lib/chart-config';
import { collapseForPie } from '@/lib/chart-utils';
import { PieSelectedSliceSummary } from '@/lib/chart-pie-labels';
import {
  renderPieActiveShape,
  renderPieLabel,
  renderPieLabelLine,
} from '@/lib/chart-pie-renderers';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/transaction-utils';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { CalendarRange } from 'lucide-react';
import type { ChartCategory } from '@/hooks/useDashboardData';

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
  const [pieActiveIndex, setPieActiveIndex] = useState<
    number | undefined
  >(undefined);

  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobileView(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [mobileTooltip, setMobileTooltip] = useState<{
    payload: {
      value: number;
      name: string;
      dataKey: string;
      payload: { name: string; total: number };
    }[];
    coordinate: { x: number; y: number };
  } | null>(null);
  const tooltipDismissRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const MOBILE_TOOLTIP_DURATION_MS = 2500;

  const handleMobileBarClick = (
    data: { name: string; total: number },
    _index: number,
    event: React.MouseEvent,
  ) => {
    if (tooltipDismissRef.current)
      clearTimeout(tooltipDismissRef.current);
    const payload = [
      {
        value: data.total,
        name: data.name,
        dataKey: 'total',
        payload: data,
      },
    ];
    setMobileTooltip({
      payload,
      coordinate: { x: event.clientX, y: event.clientY },
    });
    tooltipDismissRef.current = setTimeout(() => {
      setMobileTooltip(null);
      tooltipDismissRef.current = null;
    }, MOBILE_TOOLTIP_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (tooltipDismissRef.current)
        clearTimeout(tooltipDismissRef.current);
    };
  }, []);

  const handleChartTypeChange = (type: 'bar' | 'pie') => {
    setSpendingChartType(type);
    setPieActiveIndex(undefined);
    setMobileTooltip(null);
    if (tooltipDismissRef.current) {
      clearTimeout(tooltipDismissRef.current);
      tooltipDismissRef.current = null;
    }
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

  const pieData = collapseForPie(sortedVariableCategories);
  const pieChartConfig: ChartConfig = (() => {
    const config: ChartConfig = { ...chartConfig };
    pieData.forEach((c, i) => {
      config[c.name] = {
        label: c.name,
        color: PIE_COLORS[i % PIE_COLORS.length],
      };
    });
    return config;
  })();

  if (variableCategories.length === 0) {
    return null;
  }

  return (
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
                Your budgets are ready. When you add transactions, your chart
                will show up here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-1">
                {(['bar', 'pie'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? 'secondary' : 'ghost'}
                    size="sm"
                    className="capitalize"
                    onClick={() => handleChartTypeChange(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              <ChartContainer
            config={
              chartType === 'bar' ? chartConfig : pieChartConfig
            }
            className={cn(
              'w-full',
              chartType === 'bar'
                ? '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent'
                : '',
              chartType === 'bar' && !isMobileView && 'h-[340px]',
              chartType === 'bar' && isMobileView && 'min-h-[200px]',
              chartType === 'pie' && 'h-[340px]',
            )}
            style={
              chartType === 'bar' && isMobileView
                ? {
                    height: Math.max(
                      200,
                      Math.min(
                        400,
                        sortedVariableCategories.length * 36,
                      ),
                    ),
                  }
                : undefined
            }
          >
            {chartType === 'bar' ? (
              isMobileView ? (
                <BarChart
                  layout="vertical"
                  data={
                    sortedVariableCategories as {
                      name: string;
                      total: number;
                    }[]
                  }
                  margin={{ left: 8, right: 12, top: 4, bottom: 4 }}
                >
                  <ChartTooltip
                    active={mobileTooltip != null}
                    payload={mobileTooltip?.payload}
                    coordinate={mobileTooltip?.coordinate}
                    content={
                      <ChartTooltipContent
                        labelKey="name"
                        nameKey="name"
                        formatter={(value) =>
                          formatCurrency(Number(value))
                        }
                      />
                    }
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => formatCurrency(Number(v))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value: string) =>
                      value.length > 14
                        ? `${value.slice(0, 13)}…`
                        : value
                    }
                  />
                  <Bar
                    dataKey="total"
                    radius={[0, 4, 4, 0]}
                    onClick={handleMobileBarClick}
                  >
                    {sortedVariableCategories.map((entry, index) => {
                      const maxTotal = Math.max(
                        ...sortedVariableCategories.map(
                          (c) => c.total,
                        ),
                        1,
                      );
                      const ratio = entry.total / maxTotal;
                      return (
                        <Cell
                          key={index}
                          fill={barColorByRatio(ratio)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={
                    sortedVariableCategories as {
                      name: string;
                      total: number;
                    }[]
                  }
                  margin={{ left: 12, right: 12 }}
                >
                  <ChartTooltip
                    trigger="hover"
                    content={
                      <ChartTooltipContent
                        labelKey="name"
                        nameKey="name"
                        formatter={(value) =>
                          formatCurrency(Number(value))
                        }
                      />
                    }
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {sortedVariableCategories.map((entry, index) => {
                      const maxTotal = Math.max(
                        ...sortedVariableCategories.map(
                          (c) => c.total,
                        ),
                        1,
                      );
                      const ratio = entry.total / maxTotal;
                      return (
                        <Cell
                          key={index}
                          fill={barColorByRatio(ratio)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              )
            ) : (
              <PieChart
                margin={{
                  top: 40,
                  right: 100,
                  bottom: 40,
                  left: 100,
                }}
              >
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="name"
                      nameKey="name"
                      formatter={(value) =>
                        formatCurrency(Number(value))
                      }
                    />
                  }
                />
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={0}
                  stroke="var(--border)"
                  strokeWidth={1.5}
                  animationDuration={prefersReducedMotion ? 0 : 300}
                  animationEasing="ease-in-out"
                  activeIndex={pieActiveIndex}
                  label={renderPieLabel}
                  labelLine={renderPieLabelLine}
                  activeShape={renderPieActiveShape}
                  onClick={(_, index) =>
                    setPieActiveIndex(
                      pieActiveIndex === index ? undefined : index,
                    )
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ChartContainer>
            {chartType === 'pie' &&
            pieActiveIndex !== undefined &&
            pieData[pieActiveIndex] && (
              <PieSelectedSliceSummary
                slice={
                  pieData[pieActiveIndex] as {
                    name: string;
                    total: number;
                    _otherCategories?: { name: string }[];
                  }
                }
              />
            )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
