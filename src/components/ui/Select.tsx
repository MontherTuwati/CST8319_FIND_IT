import type { SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, options, className = "", id, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
