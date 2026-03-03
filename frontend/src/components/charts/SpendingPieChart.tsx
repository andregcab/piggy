import { useState, useEffect } from 'react';
import type { ChartCategory } from '@/hooks/useDashboardData';
import { Pie } from 'react-chartjs-2';
import {
  buildPieSpendingData,
  useChartJsAnimationOptions,
  getChartJsThemeColors,
  getPieDataLabelsOptions,
} from '@/lib/chartjs-helpers';

type SpendingPieChartProps = {
  categories: ChartCategory[];
  className?: string;
};

export function SpendingPieChart({
  categories,
  className,
}: SpendingPieChartProps) {
  const data = buildPieSpendingData(categories);
  const baseOptions = useChartJsAnimationOptions();
  const colors = getChartJsThemeColors();
  const [underTablet, setUnderTablet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setUnderTablet(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const options = {
    ...(baseOptions as import('chart.js').ChartOptions<'pie'>),
    layout: {
      padding: { top: 50, right: 42, bottom: 50, left: 42 },
    },
    plugins: {
      ...baseOptions.plugins,
      datalabels: underTablet
        ? { display: false }
        : getPieDataLabelsOptions(colors.text),
      legend: { display: false },
    },
  } as const;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Pie
        data={data}
        options={options as import('chart.js').ChartOptions<'pie'>}
      />
    </div>
  );
}
