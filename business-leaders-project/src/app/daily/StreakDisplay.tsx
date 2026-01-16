"use client";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalVisits: number;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  totalVisits,
}: StreakDisplayProps) {
  // Determine celebration state
  const isHot = currentStreak >= 7;
  const isBurning = currentStreak >= 30;
  const isLegendary = currentStreak >= 100;

  const getFlameEmoji = () => {
    if (isLegendary) return "🌟";
    if (isBurning) return "🔥";
    if (isHot) return "🔥";
    if (currentStreak > 0) return "✨";
    return "💫";
  };

  const getStreakColor = () => {
    if (isLegendary) return "var(--hermes)";
    if (isBurning) return "var(--hermes)";
    if (isHot) return "var(--tan)";
    return "var(--text-muted)";
  };

  return (
    <div className="flex justify-center gap-6 mb-8">
      {/* Current Streak */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">{getFlameEmoji()}</span>
          <span
            className="text-3xl font-bold"
            style={{ color: getStreakColor() }}
          >
            {currentStreak}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {currentStreak === 1 ? "day" : "day streak"}
        </p>
      </div>

      {/* Longest Streak */}
      {longestStreak > currentStreak && (
        <div className="text-center opacity-60">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-lg">🏆</span>
            <span className="text-xl font-medium text-[var(--text-muted)]">
              {longestStreak}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">best</p>
        </div>
      )}

      {/* Total Visits */}
      <div className="text-center opacity-60">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-lg">📅</span>
          <span className="text-xl font-medium text-[var(--text-muted)]">
            {totalVisits}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">total</p>
      </div>
    </div>
  );
}
