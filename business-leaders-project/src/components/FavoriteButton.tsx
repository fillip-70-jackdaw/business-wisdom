"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  isFavorited: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function FavoriteButton({
  isFavorited,
  onClick,
  size = "md",
}: FavoriteButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-lg
        bg-white/5 hover:bg-white/10
        transition-all duration-150
        ${isAnimating ? "scale-110" : "scale-100"}
      `}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`
          ${iconSizes[size]}
          transition-all duration-150
          ${isFavorited
            ? "text-red-500 fill-red-500"
            : "text-white/40 fill-transparent hover:text-white/60"
          }
        `}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
