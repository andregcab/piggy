import { parseBankCsv } from './bank-csv.parser';

describe('parseBankCsv', () => {
  it('parses CSV with Date, Description, Amount', () => {
    const csv = `Date,Description,Amount
2024-01-15,COFFEE SHOP,-5.99
2024-01-16,PAYCHECK,2500.00`;
    const rows = parseBankCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].description).toBe('COFFEE SHOP');
    expect(rows[0].amount).toBe('-5.99');
    expect(rows[1].amount).toBe('2500.00');
  });

  it('throws when required columns missing', () => {
    const csv = `Col1,Col2
a,b`;
    expect(() => parseBankCsv(csv)).toThrow('CSV must have columns');
  });

  it('handles optional Type and Category', () => {
    const csv = `Date,Description,Amount,Type,Category
2024-01-01,Grocery,50.00,Debit,Groceries`;
    const rows = parseBankCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('Debit');
    expect(rows[0].category).toBe('Groceries');
  });

  it('recognizes Transaction Date and vendor-specific category column', () => {
    const csv = `Transaction Date,Post Date,Description,Amount,Chase Category
2024-01-15,2024-01-16,AMAZON MKTPL*077QS1DE3,-42.99,Shopping`;
    const rows = parseBankCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('AMAZON MKTPL*077QS1DE3');
    expect(rows[0].category).toBe('Shopping');
  });

  it('strips dollar signs and commas from amount', () => {
    const csv = `Date,Description,Amount
2024-01-01,Test,"$1,234.56"`;
    const rows = parseBankCsv(csv);
    expect(rows[0].amount).toBe('1234.56');
  });
});
