import type { ChartCategory } from '@/hooks/useDashboardData';
import { useTheme } from '@/hooks/useTheme';
import { Bar } from 'react-chartjs-2';
import {
  buildBarSpendingData,
  useChartJsAnimationOptions,
  getChartJsThemeColors,
  getBarDataLabelsOptions,
} from '@/lib/chartjs-helpers';

type SpendingBarChartProps = {
  categories: ChartCategory[];
  className?: string;
};

export function SpendingBarChart({
  categories,
  className,
}: SpendingBarChartProps) {
  useTheme(); // re-render when theme toggles so chart colors update
  const data = buildBarSpendingData(categories);
  const baseOptions =
    useChartJsAnimationOptions() as import('chart.js').ChartOptions<'bar'>;
  const colors = getChartJsThemeColors();

  const options = {
    ...baseOptions,
    indexAxis: 'x' as const,
    plugins: {
      ...baseOptions.plugins,
      datalabels: getBarDataLabelsOptions(colors.text),
      tooltip: { enabled: false },
      legend: {
        ...(baseOptions.plugins?.legend ?? {}),
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 40,
          minRotation: 0,
          autoSkip: true,
          color: colors.text,
          callback: (_value: unknown, index: number) => {
            const label = data.labels?.[index];
            if (typeof label !== 'string') return String(label ?? '');
            return label.length > 10
              ? `${label.slice(0, 9)}…`
              : label;
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: colors.grid,
        },
        ticks: {
          precision: 0,
          color: colors.text,
        },
      },
    },
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Bar
        data={data}
        options={options as import('chart.js').ChartOptions<'bar'>}
      />
    </div>
  );
}
