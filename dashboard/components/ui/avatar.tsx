"use client";

import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  // Show image if src is provided and hasn't errored
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover bg-surface-elevated",
          sizeClasses[size],
          className
        )}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback to initials
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: { src?: string; name: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ avatars, max = 4, size = "md" }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full bg-surface-elevated flex items-center justify-center font-medium text-muted ring-2 ring-background",
            {
              "w-6 h-6 text-xs": size === "sm",
              "w-8 h-8 text-xs": size === "md",
              "w-10 h-10 text-sm": size === "lg",
            }
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
