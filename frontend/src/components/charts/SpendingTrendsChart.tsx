import type { TrendsResponse } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { Line } from 'react-chartjs-2';
import {
  buildTrendsLineData,
  useTrendsLineChartOptions,
} from '@/lib/chartjs-helpers';
import { TrendingUp } from 'lucide-react';

type SpendingTrendsChartProps = {
  points: TrendsResponse;
  className?: string;
};

function hasNoTrendData(points: TrendsResponse): boolean {
  if (points.length === 0) return true;
  return points.every((p) => p.savings === 0);
}

export function SpendingTrendsChart({
  points,
  className,
}: SpendingTrendsChartProps) {
  useTheme();

  const data = buildTrendsLineData(points);
  const options = useTrendsLineChartOptions();

  if (hasNoTrendData(points)) {
    return (
      <div
        className={className}
        role="img"
        aria-label="No trend data for this period"
      >
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 px-6 text-center">
          <TrendingUp
            className="h-12 w-12 text-muted-foreground/60"
            strokeWidth={1.25}
          />
          <p className="mt-3 text-sm font-medium text-foreground">
            No trend data for this period
          </p>
          <p className="mt-1 max-w-[260px] text-sm text-muted-foreground">
            When you have income and transactions across multiple
            months, your savings trend will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Line data={data} options={options} />
    </div>
  );
}
