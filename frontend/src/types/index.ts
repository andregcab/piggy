/** Account - full shape from API */
export type Account = {
  id: string;
  name: string;
  type?: string;
  institution?: string | null;
  isDefault?: boolean;
  createdAt?: string;
};

/** Category - minimal shape (id, name) used in dropdowns and transactions */
export type CategoryMinimal = {
  id: string;
  name: string;
};

/** Category - full shape from API for category management */
export type Category = CategoryMinimal & {
  isDefault?: boolean;
  isActive?: boolean;
  isFixed?: boolean;
  keywords?: string[];
  userId?: string | null;
};

/** Category budget from API */
export type CategoryBudget = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

/** Transaction row from API */
export type TransactionRow = {
  id: string;
  date: string;
  description: string;
  amount: string;
  myShare: string | null;
  type: string;
  category: CategoryMinimal | null;
  notes: string | null;
  isExcluded: boolean;
};

/** Monthly summary from analytics API */
export type MonthlySummary = {
  year: number;
  month: number;
  totalSpend: number;
  totalRevenue: number;
  savings: number;
  byCategory: {
    id: string;
    name: string;
    total: number;
    budget: number;
    isFixed: boolean;
  }[];
};

/** Single point in trends (one month) from analytics trends API */
export type TrendsPoint = {
  year: number;
  month: number;
  savings: number;
};

/** Trends API response: array of points, oldest first */
export type TrendsResponse = TrendsPoint[];

/** Additional income item from revenue API */
export type AdditionalIncomeItem = {
  id: string;
  amount: number;
  description: string | null;
};

/** Expected fixed expense item */
export type ExpectedFixedItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
};

/** Paginated transactions response */
export type TransactionsResponse = {
  items: TransactionRow[];
  total: number;
  page: number;
  limit: number;
};

/** Import result from CSV import */
export type ImportResult = {
  jobId: string;
  imported: number;
  skipped: number;
  errors: number;
};
