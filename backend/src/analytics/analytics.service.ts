import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TrendsPointDto = {
  year: number;
  month: number;
  savings: number;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlySummary(userId: string, year: number, month: number) {
    // Use UTC month boundaries so the filter is timezone-independent and matches calendar month.
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const [transactions, revenueOverride, user, additionalIncomes] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: start, lte: end },
            amount: { lt: 0 },
            isExcluded: false,
          },
          include: {
            category: { select: { id: true, name: true, isFixed: true } },
          },
        }),
        this.prisma.revenue.findUnique({
          where: {
            userId_year_month: { userId, year, month },
          },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { monthlyIncome: true },
        }),
        this.prisma.additionalIncome.findMany({
          where: { userId, year, month },
        }),
      ]);

    const budgets = await this.prisma.categoryBudget.findMany({
      where: { userId },
      include: {
        category: {
          select: { id: true, name: true, isFixed: true, isActive: true },
        },
      },
    });
    const budgetByCategory: Record<string, number> = {};
    const isFixedByCategory: Record<string, boolean> = {};
    for (const b of budgets) {
      if (!b.category.isActive) continue;
      budgetByCategory[b.categoryId] = Number(b.amount);
      isFixedByCategory[b.categoryId] = b.category.isFixed;
    }

    const byCategory: Record<
      string,
      { name: string; total: number; budget: number; isFixed: boolean }
    > = {};
    let totalSpend = 0;
    for (const tx of transactions) {
      const amt = Number(tx.myShare ?? tx.amount);
      totalSpend += Math.abs(amt);
      const key = tx.category?.id ?? 'uncategorized';
      const name = tx.category?.name ?? 'Uncategorized';
      if (!byCategory[key]) {
        byCategory[key] = {
          name,
          total: 0,
          budget: budgetByCategory[key] ?? 0,
          isFixed: tx.category?.isFixed ?? isFixedByCategory[key] ?? false,
        };
      }
      byCategory[key].total += Math.abs(amt);
    }
    for (const [catId, budget] of Object.entries(budgetByCategory)) {
      const cat = budgets.find((b) => b.categoryId === catId)?.category;
      if (!cat?.isActive) continue;
      if (!byCategory[catId]) {
        byCategory[catId] = {
          name: cat.name ?? 'Unknown',
          total: 0,
          budget,
          isFixed: isFixedByCategory[catId] ?? false,
        };
      }
    }

    const hasActivity =
      transactions.length > 0 ||
      !!revenueOverride ||
      additionalIncomes.length > 0;

    const baseRevenue = revenueOverride
      ? Number(revenueOverride.amount)
      : hasActivity && user?.monthlyIncome != null
        ? Number(user.monthlyIncome)
        : 0;
    const additionalTotal = additionalIncomes.reduce(
      (sum, i) => sum + Number(i.amount),
      0,
    );
    const totalRevenue = baseRevenue + additionalTotal;
    const savings = totalRevenue - totalSpend;

    return {
      year,
      month,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      byCategory: Object.entries(byCategory).map(
        ([id, { name, total, budget, isFixed }]) => ({
          id,
          name,
          total: Math.round(total * 100) / 100,
          budget: Math.round(budget * 100) / 100,
          isFixed,
        }),
      ),
    };
  }

  /** Last N months ending at (year, month). Each point has savings for that month. */
  async getTrends(
    userId: string,
    year: number,
    month: number,
    months: number = 12,
  ): Promise<TrendsPointDto[]> {
    const points: TrendsPointDto[] = [];
    for (let i = months - 1; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      const summary = await this.getMonthlySummary(userId, y, m);
      points.push({
        year: summary.year,
        month: summary.month,
        savings: summary.savings,
      });
    }
    return points;
  }
}
