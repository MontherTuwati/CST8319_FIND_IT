import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Align with `FilterSelect` on filter toolbars */
  variant?: "default" | "toolbar";
}

export default function Input({
  label,
  error,
  className = "",
  id,
  variant = "default",
  ...props
}: Props) {
  const defaultStyles = `rounded-lg border px-3 py-2 text-sm transition-colors duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
    error ? "border-red-400" : "border-gray-300"
  }`;

  const toolbarStyles = [
    "min-h-[2.75rem] rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-800",
    "bg-linear-to-b from-white to-slate-50/95 shadow-sm shadow-slate-900/5",
    "transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-slate-400",
    "hover:border-primary/40 hover:shadow-md hover:shadow-slate-900/10",
    "focus:border-primary focus:shadow-md focus:shadow-primary/10 focus:ring-2 focus:ring-primary/25",
    error ? "border-red-400" : "border-slate-200/90",
  ].join(" ");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${variant === "toolbar" ? toolbarStyles : defaultStyles} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
