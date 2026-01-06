"use client";

import { useState } from "react";
import Image from "next/image";

interface LeaderAvatarProps {
  name: string;
  photoUrl: string;
  size?: number;
  className?: string;
}

/**
 * LeaderAvatar with fallback
 *
 * Displays the leader's photo, falling back to a generated
 * initials avatar if the image fails to load.
 */
export function LeaderAvatar({
  name,
  photoUrl,
  size = 56,
  className = "",
}: LeaderAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Generate initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color based on name
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = 25 + (hash % 20); // Warm brown/tan range
  const saturation = 30 + (hash % 20);
  const lightness = 25 + (hash % 15);

  // Check if photoUrl is already a data URL (generated avatar)
  const isDataUrl = photoUrl.startsWith("data:");

  if (hasError || isDataUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        }}
      >
        <span
          className="font-serif font-medium"
          style={{
            fontSize: size * 0.4,
            color: `hsl(${hue}, 20%, 85%)`,
          }}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={photoUrl}
        alt={name}
        fill
        className="object-cover"
        sizes={`${size}px`}
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  );
}
