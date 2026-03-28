import type { ReactNode } from "react";

type Variant = "default" | "elevated" | "interactive";

interface Props {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<Variant, string> = {
  default:
    "rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900",
  elevated:
    "rounded-lg border border-gray-200 border-l-4 border-l-primary bg-white shadow-md dark:border-slate-700 dark:bg-slate-900",
  interactive:
    "cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary",
};

export default function Card({ variant = "default", className = "", children, onClick }: Props) {
  return (
    <div className={`${variantStyles[variant]} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
