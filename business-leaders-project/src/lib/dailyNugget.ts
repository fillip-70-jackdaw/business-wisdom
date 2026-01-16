/**
 * Deterministic daily nugget selection
 * Uses date as seed to ensure same nugget for all users on a given day
 */

/**
 * Seeded random number generator (Linear Congruential Generator)
 * Same algorithm used in Feed.tsx for consistency
 */
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Convert date to numeric seed
 * Format: YYYYMMDD as integer
 */
export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

/**
 * Get today's date in UTC (normalized to midnight)
 */
export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Select daily nugget deterministically based on date
 * @param nuggetIds - Array of published nugget IDs
 * @param date - The date to select for (defaults to today UTC)
 * @returns The selected nugget ID, or null if no nuggets available
 */
export function selectDailyNuggetId(
  nuggetIds: string[],
  date: Date = getTodayUTC()
): string | null {
  if (nuggetIds.length === 0) return null;

  const seed = dateToSeed(date);
  const rng = seededRandom(seed);

  // Generate a random index based on date seed
  const index = Math.floor(rng() * nuggetIds.length);
  return nuggetIds[index];
}

/**
 * Format date as YYYY-MM-DD for database storage
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0];
}
