/**
 * Streak calculation utilities
 */

import { getTodayUTC, formatDateForDB } from "./dailyNugget";

export interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  last_visit_date: string;
  total_visits: number;
  streakMaintained: boolean; // True if streak continued (same day or consecutive)
  streakBroken: boolean; // True if streak was reset (missed a day)
  isNewStreak: boolean; // True if starting fresh (first visit or after break)
  milestoneReached: number | null; // 7, 14, 30, etc.
}

const MILESTONES = [7, 14, 30, 60, 100, 365];

/**
 * Calculate streak update based on current state and visit
 */
export function calculateStreakUpdate(
  currentStreak: number,
  longestStreak: number,
  lastVisitDate: string | null,
  totalVisits: number
): StreakUpdate {
  const today = getTodayUTC();
  const todayStr = formatDateForDB(today);

  // If already visited today, no streak change
  if (lastVisitDate === todayStr) {
    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_visit_date: todayStr,
      total_visits: totalVisits,
      streakMaintained: true,
      streakBroken: false,
      isNewStreak: false,
      milestoneReached: null,
    };
  }

  const newTotalVisits = totalVisits + 1;

  // First ever visit
  if (!lastVisitDate) {
    return {
      current_streak: 1,
      longest_streak: Math.max(longestStreak, 1),
      last_visit_date: todayStr,
      total_visits: newTotalVisits,
      streakMaintained: false,
      streakBroken: false,
      isNewStreak: true,
      milestoneReached: null,
    };
  }

  // Calculate days since last visit
  const lastVisit = new Date(lastVisitDate + "T00:00:00Z");
  const diffTime = today.getTime() - lastVisit.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let newCurrentStreak: number;
  let streakMaintained = false;
  let streakBroken = false;
  let isNewStreak = false;

  if (diffDays === 1) {
    // Consecutive day - continue streak
    newCurrentStreak = currentStreak + 1;
    streakMaintained = true;
  } else if (diffDays === 0) {
    // Same day (shouldn't reach here due to early return, but safety)
    newCurrentStreak = currentStreak;
    streakMaintained = true;
  } else {
    // Streak broken - reset to 1
    newCurrentStreak = 1;
    streakBroken = currentStreak > 1;
    isNewStreak = true;
  }

  const newLongestStreak = Math.max(longestStreak, newCurrentStreak);

  // Check for milestone
  const milestoneReached =
    MILESTONES.find((m) => newCurrentStreak === m) || null;

  return {
    current_streak: newCurrentStreak,
    longest_streak: newLongestStreak,
    last_visit_date: todayStr,
    total_visits: newTotalVisits,
    streakMaintained,
    streakBroken,
    isNewStreak,
    milestoneReached,
  };
}

/**
 * Get milestone message for celebrations
 */
export function getMilestoneMessage(milestone: number): string {
  switch (milestone) {
    case 7:
      return "One week of wisdom! You're building a powerful habit.";
    case 14:
      return "Two weeks strong! Your commitment is inspiring.";
    case 30:
      return "A full month! You're a true seeker of wisdom.";
    case 60:
      return "Two months of daily wisdom! Extraordinary dedication.";
    case 100:
      return "100 days! You've achieved something remarkable.";
    case 365:
      return "A full year of daily wisdom! You are a master of consistency.";
    default:
      return `${milestone} day streak! Keep it going!`;
  }
}
