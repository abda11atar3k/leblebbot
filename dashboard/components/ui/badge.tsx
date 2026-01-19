import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        {
          "bg-surface-elevated text-muted": variant === "default",
          "bg-primary/10 text-primary": variant === "primary",
          "bg-surface-elevated text-foreground border border-border": variant === "secondary",
          "bg-success/10 text-success": variant === "success",
          "bg-warning/10 text-warning": variant === "warning",
          "bg-error/10 text-error": variant === "error",
          "px-1.5 py-0.5 text-xs": size === "sm",
          "px-2 py-0.5 text-xs": size === "md",
        },
        className
      )}
      {...props}
    />
  );
}

interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away";
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full",
        {
          "bg-success": status === "online",
          "bg-muted": status === "offline",
          "bg-error": status === "busy",
          "bg-warning": status === "away",
        },
        className
      )}
    />
  );
}
