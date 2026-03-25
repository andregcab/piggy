import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getTransactionsPerPage,
  setTransactionsPerPage,
  getTransactionsSortOrder,
  setTransactionsSortOrder,
  getSpendingChartType,
  setSpendingChartType,
  SPENDING_CHART_TYPES,
} from './user-preferences';

const STORAGE_KEY = 'budget-tracker-preferences';

describe('user-preferences', () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockLocalStorage).forEach(
      (k) => delete mockLocalStorage[k],
    );
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        Object.keys(mockLocalStorage).forEach(
          (k) => delete mockLocalStorage[k],
        );
      },
      length: 0,
      key: () => null,
    });
    delete mockLocalStorage[STORAGE_KEY];
  });

  describe('getTransactionsPerPage', () => {
    it('returns default when no userId', () => {
      expect(getTransactionsPerPage(null)).toBe(25);
      expect(getTransactionsPerPage(undefined)).toBe(25);
    });

    it('returns default when no stored preference', () => {
      expect(getTransactionsPerPage('user-1')).toBe(25);
    });

    it('returns stored value when valid', () => {
      setTransactionsPerPage('user-1', 50);
      expect(getTransactionsPerPage('user-1')).toBe(50);
    });

    it('returns default for invalid stored value', () => {
      mockLocalStorage[STORAGE_KEY] = JSON.stringify({
        'user-1': { transactionsPerPage: 999 },
      });
      expect(getTransactionsPerPage('user-1')).toBe(25);
    });
  });

  describe('getTransactionsSortOrder', () => {
    it('returns default when no userId', () => {
      expect(getTransactionsSortOrder(null)).toBe('desc');
    });

    it('returns default when no stored preference', () => {
      expect(getTransactionsSortOrder('user-1')).toBe('desc');
    });

    it('returns stored value when valid', () => {
      setTransactionsSortOrder('user-1', 'asc');
      expect(getTransactionsSortOrder('user-1')).toBe('asc');
    });

    it('returns default for invalid stored value', () => {
      mockLocalStorage[STORAGE_KEY] = JSON.stringify({
        'user-1': { transactionsSortOrder: 'invalid' },
      });
      expect(getTransactionsSortOrder('user-1')).toBe('desc');
    });
  });

  describe('setTransactionsPerPage', () => {
    it('persists and retrieves', () => {
      setTransactionsPerPage('user-1', 100);
      expect(getTransactionsPerPage('user-1')).toBe(100);
    });

    it('does nothing when userId is null', () => {
      setTransactionsPerPage(null, 50);
      expect(getTransactionsPerPage('user-1')).toBe(25);
    });
  });

  describe('getSpendingChartType', () => {
    it('returns default when no stored preference', () => {
      expect(getSpendingChartType('user-1')).toBe('bar');
    });

    it('returns stored value when valid', () => {
      setSpendingChartType('user-1', 'pie');
      expect(getSpendingChartType('user-1')).toBe('pie');
    });
  });

  describe('constants', () => {
    it('SPENDING_CHART_TYPES includes bar and pie', () => {
      expect(SPENDING_CHART_TYPES).toContain('bar');
      expect(SPENDING_CHART_TYPES).toContain('pie');
    });
  });
});
