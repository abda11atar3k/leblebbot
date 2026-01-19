"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    const { isRTL } = useTranslation();
    
    return (
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none",
            isRTL ? "right-3" : "left-3"
          )}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          dir="auto"
          className={cn(
            "w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted",
            "transition-colors duration-150",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-error focus:border-error focus:ring-error/10",
            icon && (isRTL ? "pr-10" : "pl-10"),
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        dir="auto"
        className={cn(
          "w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted",
          "transition-colors duration-150 resize-none",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-error focus:border-error focus:ring-error/10",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
