import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

export interface ParsedRow {
  date: Date;
  description: string;
  amount: string;
  type: string;
  balance?: string;
  category?: string;
}

// Column aliases for common bank CSV export formats
const HEADER_ALIASES: Record<string, string> = {
  date: 'date',
  'post date': 'date',
  'transaction date': 'date',
  description: 'description',
  details: 'description',
  transaction: 'description',
  amount: 'amount',
  type: 'type',
  balance: 'balance',
  category: 'category',
  'chase category': 'category',
  'transaction category': 'category',
  'category type': 'category',
  'category name': 'category',
};

function normalizeHeader(h: string): string {
  return HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase();
}

function parseAmount(value: string): string {
  const cleaned = value.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return '0';
  return num.toFixed(2);
}

function parseDate(value: string): Date {
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return d;
}

/**
 * Parses a bank CSV export. Expects columns: Date (or Post Date, Transaction Date),
 * Description (or Details, Transaction), Amount. Optional: Type, Balance, Category.
 * Compatible with exports from many major banks.
 */
export function parseBankCsv(csvContent: string): ParsedRow[] {
  const rows = parse<Record<string, string>>(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (rows.length === 0) return [];

  const rawHeaders = Object.keys(rows[0]);
  const colMap: Record<string, string> = {};
  rawHeaders.forEach((h) => {
    const norm = normalizeHeader(h);
    colMap[norm] = h;
  });

  const dateCol = colMap.date ?? colMap['post date'];
  const descCol = colMap.description ?? colMap.details ?? colMap.transaction;
  const amountCol = colMap.amount;

  if (!dateCol || !descCol || !amountCol) {
    throw new Error(
      'CSV must have columns: Date (or Post Date), Description (or Details), Amount',
    );
  }

  const typeCol = colMap.type;
  const balanceCol = colMap.balance;
  const categoryCol = colMap.category;

  const result: ParsedRow[] = [];
  for (const row of rows) {
    const dateStr = row[dateCol];
    const description = (row[descCol] ?? '').trim() || 'Unknown';
    const amountStr = row[amountCol];
    if (!dateStr || amountStr === undefined || amountStr === '') continue;
    try {
      result.push({
        date: parseDate(dateStr),
        description,
        amount: parseAmount(amountStr),
        type: typeCol ? (row[typeCol] ?? '').trim() : '',
        balance: balanceCol ? row[balanceCol] : undefined,
        category: categoryCol
          ? (row[categoryCol] ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim()
          : undefined,
      });
    } catch {
      // skip bad row
    }
  }
  return result;
}

/** Input string for {@link externalId} (includes CSV row index so identical lines differ). */
export function importFingerprint(
  accountId: string,
  row: ParsedRow,
  rowIndex: number,
): string {
  return `${accountId}|${row.date.toISOString().slice(0, 10)}|${row.description}|${row.amount}|${rowIndex}`;
}

/** Deterministic id per CSV row (SHA-256 of {@link importFingerprint}). */
export function externalId(
  accountId: string,
  row: ParsedRow,
  rowIndex: number,
): string {
  const str = importFingerprint(accountId, row, rowIndex);
  return `ext-${createHash('sha256').update(str, 'utf8').digest('hex')}`;
}
