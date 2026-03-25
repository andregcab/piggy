/**
 * Category matching for CSV imports.
 *
 * Uses normalization + keyword matching only. No manual bank mapping.
 * Keywords come from category definitions (default-categories + user custom).
 *
 * Two data sources:
 * - CSV category column: Bank's pre-categorization (e.g. "Food & Drink")
 * - Description: Merchant/memo (e.g. "STARBUCKS #12345")
 *
 * Both use the same logic: normalize text, then match against category keywords
 * (longest match wins).
 */

/** Normalize text for matching: strip CSV quotes/BOM, lowercase, &→and, collapse whitespace */
export function normalizeForMatch(text: string): string {
  if (!text?.trim()) return '';
  return text
    .replace(/\uFEFF/g, '') // BOM
    .replace(/^["'\s]+|["'\s]+$/g, '') // strip surrounding CSV-style quotes and whitespace
    .toLowerCase()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CategoryMatchInput {
  categoryByName: Map<string, string>;
  categoriesWithKeywords: { id: string; keywords: string[] }[];
}

export type CategoryMatchVia = 'exact_name' | 'keyword' | 'none';

export interface CategoryMatchDetail {
  categoryId: string | null;
  via: CategoryMatchVia;
  /** Normalized input used for matching (when non-empty). */
  normalizedText?: string;
  /** Winning keyword after normalization (keyword path only). */
  matchedKeyword?: string;
}

/**
 * Match bank category or description to our category.
 * Uses: exact name match first, then keyword match (longest wins).
 */
export function matchCategory(
  text: string,
  input: CategoryMatchInput,
): string | null {
  return matchCategoryDetailed(text, input).categoryId;
}

/**
 * Same as {@link matchCategory} but includes how the match was resolved (for logging).
 */
export function matchCategoryDetailed(
  text: string,
  input: CategoryMatchInput,
): CategoryMatchDetail {
  const normalized = normalizeForMatch(text);
  if (!normalized) return { categoryId: null, via: 'none' };

  const exactId = input.categoryByName.get(normalized);
  if (exactId) {
    return {
      categoryId: exactId,
      via: 'exact_name',
      normalizedText: normalized,
    };
  }

  const kw = matchByKeywords(normalized, input.categoriesWithKeywords);
  if (kw) {
    return {
      categoryId: kw.categoryId,
      via: 'keyword',
      normalizedText: normalized,
      matchedKeyword: kw.matchedKeyword,
    };
  }

  return { categoryId: null, via: 'none', normalizedText: normalized };
}

function matchByKeywords(
  normalizedText: string,
  categoriesWithKeywords: { id: string; keywords: string[] }[],
): { categoryId: string; matchedKeyword: string } | null {
  let best: {
    categoryId: string;
    matchLen: number;
    matchedKeyword: string;
  } | null = null;

  for (const cat of categoriesWithKeywords) {
    for (const kw of cat.keywords) {
      const kwNorm = normalizeForMatch(kw);
      if (!kwNorm || kwNorm.length < 2) continue;

      const matches =
        normalizedText.includes(kwNorm) || kwNorm.includes(normalizedText);
      if (matches && (!best || kwNorm.length > best.matchLen)) {
        best = {
          categoryId: cat.id,
          matchLen: kwNorm.length,
          matchedKeyword: kwNorm,
        };
      }
    }
  }
  return best
    ? { categoryId: best.categoryId, matchedKeyword: best.matchedKeyword }
    : null;
}
