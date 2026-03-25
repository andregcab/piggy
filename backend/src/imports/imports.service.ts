import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { externalId, parseBankCsv, ParsedRow } from './bank-csv.parser';
import {
  matchCategoryDetailed,
  type CategoryMatchInput,
} from './category-matcher';

export interface ImportResult {
  jobId: string;
  imported: number;
  skipped: number;
  errors: number;
  message?: string;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async importFromCsv(
    userId: string,
    accountId: string,
    filename: string,
    buffer: Buffer,
  ): Promise<ImportResult> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    let rows: ParsedRow[];
    try {
      rows = parseBankCsv(buffer.toString('utf-8'));
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Invalid CSV format',
      );
    }

    const job = await this.prisma.importJob.create({
      data: {
        userId,
        accountId,
        filename,
        status: 'processing',
      },
    });

    await this.categoriesService.ensureUserCategories(userId);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const categoryByName = new Map<string, string>();
    const categoriesWithKeywords: { id: string; keywords: string[] }[] = [];
    const loadCategories = async () => {
      // Use only user categories so transactions get user IDs and match the dropdown
      const list = await this.prisma.category.findMany({
        where: { userId, isActive: true },
        select: { id: true, name: true, keywords: true },
        orderBy: { name: 'asc' },
      });
      list.forEach((c) => categoryByName.set(c.name.toLowerCase(), c.id));
      list.forEach((c) => {
        const explicit = c.keywords?.filter((k) => k?.trim()) ?? [];
        const effective = [
          ...new Set(explicit.map((k) => k.toLowerCase().trim())),
        ].filter(Boolean);
        categoriesWithKeywords.push({ id: c.id, keywords: effective });
      });
    };
    await loadCategories();

    const matchInput: CategoryMatchInput = {
      categoryByName,
      categoriesWithKeywords,
    };

    const uncategorizedId =
      categoryByName.get('uncategorized') ??
      (await this.prisma.category
        .findFirst({
          where: { name: 'Uncategorized', isActive: true },
          select: { id: true },
        })
        .then((c) => c?.id ?? null)) ??
      null;

    try {
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const extId = externalId(accountId, row, rowIndex);

        let categoryId: string | null = null;
        const bankDetail = row.category
          ? matchCategoryDetailed(row.category, matchInput)
          : null;
        const descDetail = matchCategoryDetailed(row.description, matchInput);

        // Prefer description keyword matches over the bank column (merchant keywords vs broad bank labels).
        if (descDetail.via === 'keyword' && descDetail.categoryId) {
          categoryId = descDetail.categoryId;
        } else if (row.category && bankDetail?.categoryId) {
          categoryId = bankDetail.categoryId;
        } else if (descDetail.categoryId) {
          categoryId = descDetail.categoryId;
        }
        if (!categoryId) categoryId = uncategorizedId;

        try {
          await this.prisma.transaction.create({
            data: {
              userId,
              accountId,
              date: row.date,
              description: row.description,
              amount: row.amount,
              type:
                row.type || (parseFloat(row.amount) >= 0 ? 'credit' : 'debit'),
              balanceAfter: row.balance ? parseAmount(row.balance) : null,
              categoryId,
              externalId: extId,
            },
          });
          imported++;
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === 'P2002'
          ) {
            skipped++;
          } else {
            errors++;
          }
        }
      }

      await this.prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          summary: {
            imported,
            skipped,
            errors,
            total: rows.length,
          },
        },
      });
    } catch (e) {
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          summary: { imported, skipped, errors, total: rows.length },
        },
      });
      throw e;
    }

    return {
      jobId: job.id,
      imported,
      skipped,
      errors,
    };
  }

  async listJobs(userId: string) {
    return this.prisma.importJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        account: { select: { id: true, name: true } },
      },
    });
  }
}

function parseAmount(value: string): string {
  const cleaned = value.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? '0' : num.toFixed(2);
}
