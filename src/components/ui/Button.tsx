import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
  secondary:
    "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  danger: "bg-danger text-white hover:bg-red-700 shadow-sm",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800",
  success: "bg-success text-white hover:bg-green-700 shadow-sm",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
