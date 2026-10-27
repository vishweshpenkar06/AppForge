# Component Patterns Reference

## Button (primitive)

```tsx
// components/ui/Button.tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:     "bg-brand text-white hover:bg-brand-hover active:bg-brand-active shadow-sm",
  secondary:   "bg-bg-raised text-text-primary border border-border hover:bg-bg-subtle",
  ghost:       "text-text-secondary hover:bg-bg-raised hover:text-text-primary",
  destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizes: Record<Size, string> = {
  sm: "h-8  px-3 text-sm  gap-1.5",
  md: "h-10 px-4 text-sm  gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-md",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  )
);
```

## Card (with depth)

```tsx
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function Card({ children, className, interactive }: CardProps) {
  return (
    <div className={cn(
      "bg-bg-base rounded-xl border border-border shadow-sm",
      "p-6",
      interactive && [
        "cursor-pointer",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong",
        "active:translate-y-0 active:shadow-sm",
      ],
      className,
    )}>
      {children}
    </div>
  );
}
```

## Empty State

```tsx
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-raised flex items-center justify-center text-text-muted mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
```

## Input (with all states)

```tsx
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

export function Input({ label, error, hint, prefix, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full h-10 rounded-md border bg-bg-base px-3 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-subtle",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-border hover:border-border-strong",
            prefix && "pl-9",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
```

## Badge

```tsx
type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-bg-raised text-text-secondary border border-border",
  success: "bg-green-50  text-green-700 dark:bg-green-950 dark:text-green-300",
  warning: "bg-amber-50  text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  error:   "bg-red-50    text-red-700   dark:bg-red-950   dark:text-red-300",
  info:    "bg-blue-50   text-blue-700  dark:bg-blue-950  dark:text-blue-300",
};

export function Badge({ variant = "default", children, className }: {
  variant?: BadgeVariant; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      badgeVariants[variant],
      className,
    )}>
      {children}
    </span>
  );
}
```
