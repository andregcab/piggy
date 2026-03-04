import {
  Chart,
  PolarAreaController,
  BarController,
  PieController,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  BarElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PIE_COLORS, barColorByRatio } from '@/lib/chart-config';
import type { ChartCategory } from '@/hooks/useDashboardData';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { collapseForPie } from '@/lib/chart-utils';
import { formatCurrency } from '@/lib/transaction-utils';
import type { TrendsResponse } from '@/types';

// Register the pieces of Chart.js we actually use.
/** Auto-hide pie tooltip after a short delay on tap/click so mobile users get predictable behavior (show for ~2.5s then dismiss). */
const PIE_TOOLTIP_AUTO_HIDE_MS = 2500;

type ChartWithPiePlugin = Chart & {
  __pieTooltipHideTimeout?: ReturnType<typeof setTimeout>;
  __pieTooltipLockedUntil?: number;
  __pieTooltipLockedElements?: {
    datasetIndex: number;
    index: number;
  }[];
  __pieTooltipLockedPosition?: { x: number; y: number };
};

const pieTooltipAutoHidePlugin = {
  id: 'pieTooltipAutoHide',
  afterEvent(
    chart: Chart,
    args: {
      event: { type: string; x?: number; y?: number };
      replay: boolean;
    },
  ) {
    const config = (chart as { config?: { type?: string } }).config;
    if (config?.type !== 'pie') return;
    const tooltip = chart.tooltip;
    if (!tooltip) return;
    const ch = chart as ChartWithPiePlugin;
    const { event } = args;

    // On click/tap: pin the current tooltip and schedule auto-hide so desktop (click) and mobile (tap) behave the same.
    if (event?.type === 'click' || event?.type === 'touchend') {
      const active = chart.getActiveElements();
      if (active.length > 0) {
        if (ch.__pieTooltipHideTimeout)
          clearTimeout(ch.__pieTooltipHideTimeout);
        ch.__pieTooltipLockedElements = active.map((el) => ({
          datasetIndex: el.datasetIndex,
          index: el.index,
        }));
        ch.__pieTooltipLockedPosition = {
          x: event.x ?? 0,
          y: event.y ?? 0,
        };
        ch.__pieTooltipLockedUntil =
          Date.now() + PIE_TOOLTIP_AUTO_HIDE_MS;
        tooltip.setActiveElements(
          ch.__pieTooltipLockedElements,
          ch.__pieTooltipLockedPosition,
        );
        chart.update('none');
        ch.__pieTooltipHideTimeout = setTimeout(() => {
          ch.__pieTooltipHideTimeout = undefined;
          ch.__pieTooltipLockedUntil = undefined;
          ch.__pieTooltipLockedElements = undefined;
          ch.__pieTooltipLockedPosition = undefined;
          chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
          chart.update('none');
        }, PIE_TOOLTIP_AUTO_HIDE_MS);
      }
      return;
    }

    // While locked (e.g. after a click), ignore hover so the tooltip stays pinned until the timer ends.
    if (
      ch.__pieTooltipLockedUntil != null &&
      Date.now() < ch.__pieTooltipLockedUntil &&
      ch.__pieTooltipLockedElements?.length
    ) {
      tooltip.setActiveElements(
        ch.__pieTooltipLockedElements,
        ch.__pieTooltipLockedPosition ?? { x: 0, y: 0 },
      );
      chart.update('none');
    }
  },
};

Chart.register(
  PolarAreaController,
  BarController,
  PieController,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  BarElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  ChartDataLabels,
  pieTooltipAutoHidePlugin,
);

export type PolarSpendingData = ChartData<
  'polarArea',
  number[],
  string
>;
export type BarSpendingData = ChartData<'bar', number[], string>;
export type PieSpendingData = ChartData<'pie', number[], string>;
export type TrendsLineData = ChartData<'line', number[], string>;

export type ChartJsThemeColors = {
  surface: string;
  border: string;
  grid: string;
  text: string;
};

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('oklch(') && !color.includes('/')) {
    // Turn "oklch(L C H)" into "oklch(L C H / A)"
    return color.replace(')', ` / ${alpha})`);
  }
  return color;
}

function getCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || '';
}

export function getChartJsThemeColors(): ChartJsThemeColors {
  if (typeof document === 'undefined') {
    return {
      surface: 'rgba(15,23,42,0.96)',
      border: 'rgba(51,65,85,0.85)',
      grid: 'rgba(148,163,184,0.45)',
      text: 'rgba(226,232,240,1)',
    };
  }

  const foreground = getCssVar('--foreground');
  const card = getCssVar('--card');
  const border = getCssVar('--border');
  const muted = getCssVar('--muted-foreground');

  return {
    text: foreground || 'rgba(15,23,42,1)',
    surface: card || 'rgba(255,255,255,0.96)',
    border: border || 'rgba(209,213,219,0.9)',
    grid: muted || 'rgba(229,231,235,0.9)',
  };
}

export function buildPolarSpendingData(
  categories: ChartCategory[],
): PolarSpendingData {
  const collapsed = collapseForPie(categories);
  const labels = collapsed.map((c) => c.name);
  const data = collapsed.map((c) => c.total);
  const baseColors = labels.map(
    (_label, i) => PIE_COLORS[i % PIE_COLORS.length],
  );
  // Baseline fairly solid, hover slightly stronger.
  const colors = baseColors.map((c) => withAlpha(c, 0.8));
  const hoverColors = baseColors.map((c) => withAlpha(c, 0.95));

  return {
    labels,
    datasets: [
      {
        // Dataset label is intentionally empty; legend and tooltips
        // will use per-category labels instead.
        label: '',
        data,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 0,
        hoverBorderWidth: 0,
      },
    ],
  };
}

export function buildPieSpendingData(
  categories: ChartCategory[],
): PieSpendingData {
  const collapsed = collapseForPie(categories);
  const labels = collapsed.map((c) => c.name);
  const data = collapsed.map((c) => c.total);
  const baseColors = labels.map(
    (_label, i) => PIE_COLORS[i % PIE_COLORS.length],
  );
  const colors = baseColors.map((c) => withAlpha(c, 0.8));
  const hoverColors = baseColors.map((c) => withAlpha(c, 0.95));

  return {
    labels,
    datasets: [
      {
        label: '',
        data,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 0,
        hoverBorderWidth: 0,
      },
    ],
  };
}

export function buildBarSpendingData(
  categories: ChartCategory[],
): BarSpendingData {
  const collapsed = collapseForPie(categories, 6);
  const labels = collapsed.map((c) => c.name);
  const data = collapsed.map((c) => c.total);
  const max = Math.max(...data, 1);

  return {
    labels,
    datasets: [
      {
        label: '',
        data,
        backgroundColor: data.map((value) => {
          const ratio = value / max;
          return withAlpha(barColorByRatio(ratio), 0.8);
        }),
        hoverBackgroundColor: data.map((value) => {
          const ratio = value / max;
          return withAlpha(barColorByRatio(ratio), 0.9);
        }),
        borderRadius: 0,
        borderSkipped: false,
      },
    ],
  };
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function buildTrendsLineData(
  points: TrendsResponse,
): TrendsLineData {
  const labels = points.map(
    (p) => `${MONTH_SHORT[p.month - 1]} ${String(p.year).slice(2)}`,
  );
  const savingsColor =
    getCssVar('--positive') || 'oklch(0.72 0.14 145)';

  return {
    labels,
    datasets: [
      {
        label: 'Savings',
        data: points.map((p) => p.savings),
        borderColor: savingsColor,
        backgroundColor: withAlpha(savingsColor, 0.1),
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.2,
      },
    ],
  };
}

export function useTrendsLineChartOptions(): ChartOptions<'line'> {
  const prefersReducedMotion = usePrefersReducedMotion();
  const colors = getChartJsThemeColors();

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          color: colors.text,
        },
      },
      tooltip: {
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.surface,
        titleColor: colors.text,
        bodyColor: colors.text,
        padding: 8,
        callbacks: {
          label(item: TooltipItem<'line'>) {
            const raw =
              typeof item.raw === 'number'
                ? item.raw
                : ((item.parsed as { y?: number })?.y ?? Number.NaN);
            if (!Number.isFinite(raw)) return '';
            const label = item.dataset.label ?? '';
            return `${label}: ${formatCurrency(raw)}`;
          },
        },
      },
      datalabels: { display: false },
    },
    scales: {
      x: {
        grid: { color: colors.grid },
        ticks: {
          color: colors.text,
          maxRotation: 45,
          autoSkip: true,
        },
      },
      y: {
        grid: { color: colors.grid },
        ticks: {
          color: colors.text,
          callback(value) {
            const v =
              typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(v)) return '';
            return formatCurrency(v);
          },
        },
      },
    },
    animation: prefersReducedMotion
      ? false
      : {
          duration: 260,
          easing: 'easeInOutCubic',
        },
  };
}

export function useChartJsAnimationOptions():
  | ChartOptions<'polarArea'>
  | ChartOptions<'bar'> {
  const prefersReducedMotion = usePrefersReducedMotion();
  const colors = getChartJsThemeColors();

  const common: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          color: colors.text,
          generateLabels: (chart) => {
            const labels = chart.data.labels ?? [];
            const dataset = chart.data.datasets[0] ?? {};
            const background =
              (dataset as { backgroundColor?: string | string[] })
                .backgroundColor ?? [];

            return labels.map((text, index) => {
              const color =
                Array.isArray(background) && background[index]
                  ? background[index]
                  : typeof dataset.borderColor === 'string'
                    ? dataset.borderColor
                    : colors.text;

              return {
                text: String(text),
                fillStyle: color,
                strokeStyle: color,
                lineWidth: 1,
                hidden: false,
                index,
              };
            });
          },
        },
      },
      tooltip: {
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.surface,
        titleColor: colors.text,
        bodyColor: colors.text,
        padding: 6,
        displayColors: false,
        titleMarginBottom: 2,
        callbacks: {
          title(items) {
            const first = items[0];
            if (!first) return '';

            const chartType = (
              first.chart as { config: { type?: string } }
            ).config.type;
            if (chartType === 'pie' || chartType === 'polarArea') {
              const dataset = first.chart.data.datasets[
                first.datasetIndex
              ] as {
                data?: number[];
              };
              const arr = dataset?.data ?? [];
              const total = arr.reduce(
                (sum, v) => sum + (typeof v === 'number' ? v : 0),
                0,
              );
              const raw =
                typeof first.raw === 'number'
                  ? first.raw
                  : Number(first.parsed as number);
              const pct = total > 0 ? (raw / total) * 100 : 0;
              const pctText = `${pct.toFixed(1)}%`;
              return first.label
                ? `${first.label} (${pctText})`
                : pctText;
            }

            return first.label ?? '';
          },
          label(
            item: TooltipItem<
              keyof import('chart.js').ChartTypeRegistry
            >,
          ) {
            const raw =
              typeof item.raw === 'number'
                ? item.raw
                : Number(item.parsed as number);
            if (!Number.isFinite(raw)) return '';
            return formatCurrency(raw);
          },
        },
      },
    },
    animation: prefersReducedMotion
      ? false
      : {
          duration: 260,
          easing: 'easeInOutCubic',
        },
  };

  return common as ChartOptions<'polarArea'> | ChartOptions<'bar'>;
}

const PIE_LABEL_HIDE_BELOW_PERCENT = 4;

/** DataLabels plugin: pie labels outside the circle (no box, no connector). Anchor at slice edge, offset outward. */
export function getPieDataLabelsOptions(textColor: string) {
  return {
    display: (ctx: {
      chart: { data: { datasets: { data?: number[] }[] } };
      dataIndex: number;
      dataset: { data?: number[] };
    }) => {
      const dataArr =
        ctx.dataset?.data ?? ctx.chart.data.datasets[0]?.data ?? [];
      const total = dataArr.reduce(
        (s, v) => s + (typeof v === 'number' ? v : 0),
        0,
      );
      const value =
        typeof dataArr[ctx.dataIndex] === 'number'
          ? dataArr[ctx.dataIndex]
          : 0;
      const pct = total > 0 ? (value / total) * 100 : 0;
      return pct >= PIE_LABEL_HIDE_BELOW_PERCENT;
    },
    color: textColor,
    backgroundColor: 'transparent',
    borderWidth: 0,
    font: { size: 12, weight: 'bold' as const },
    padding: 4,
    clamp: false,
    anchor: 'end' as const,
    align: 'end' as const,
    offset: 8,
    formatter(
      value: number,
      ctx: {
        chart: {
          data: {
            labels?: string[];
            datasets: { data?: number[] }[];
          };
        };
        dataIndex: number;
      },
    ) {
      const dataArr = ctx.chart.data.datasets[0]?.data ?? [];
      const total = dataArr.reduce(
        (s, v) => s + (typeof v === 'number' ? v : 0),
        0,
      );
      const pct = total > 0 ? (value / total) * 100 : 0;
      const label = ctx.chart.data.labels?.[ctx.dataIndex] ?? '';
      return `${label}\n${pct.toFixed(1)}% · ${formatCurrency(value)}`;
    },
  };
}

/** DataLabels plugin options for bar: dollar amount above each bar. */
export function getBarDataLabelsOptions(textColor: string) {
  return {
    color: textColor,
    font: { size: 11, weight: 'normal' as const },
    formatter: (value: number) => formatCurrency(value),
    anchor: 'end' as const,
    align: 'top' as const,
    offset: 2,
  };
}
