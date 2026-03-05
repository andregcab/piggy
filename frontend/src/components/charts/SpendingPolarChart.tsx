import type { ChartCategory } from '@/hooks/useDashboardData';
import { useTheme } from '@/hooks/useTheme';
import { PolarArea } from 'react-chartjs-2';
import {
  buildPolarSpendingData,
  useChartJsAnimationOptions,
  getChartJsThemeColors,
} from '@/lib/chartjs-helpers';

type SpendingPolarChartProps = {
  categories: ChartCategory[];
  className?: string;
};

export function SpendingPolarChart({
  categories,
  className,
}: SpendingPolarChartProps) {
  const { theme } = useTheme();
  const data = buildPolarSpendingData(categories);
  const baseOptions = useChartJsAnimationOptions();
  const colors = getChartJsThemeColors(theme);

  const options = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...(baseOptions.plugins?.legend ?? {}),
        position: 'top',
      },
    },
    scales: {
      r: {
        grid: {
          color: colors.grid,
        },
        angleLines: {
          color: colors.grid,
        },
        ticks: {
          display: true,
          color: colors.text,
        },
        pointLabels: {
          display: false,
        },
      },
    },
  } as const;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <PolarArea
        data={data}
        options={
          options as import('chart.js').ChartOptions<'polarArea'>
        }
      />
    </div>
  );
}
