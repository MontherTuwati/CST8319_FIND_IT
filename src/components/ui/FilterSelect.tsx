import { useEffect, useId, useRef, useState } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom filter dropdown: the open list is HTML/CSS, unlike a native `select`. */
export default function FilterSelect({ id, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex min-h-[2.75rem] w-full items-center justify-between gap-2 rounded-xl border border-slate-200/90",
          "bg-linear-to-b from-white to-slate-50/95 px-4 py-2.5 text-left text-sm font-medium text-slate-800",
          "shadow-sm shadow-slate-900/5 transition-[border-color,box-shadow,transform] duration-200",
          "hover:border-primary/40 hover:shadow-md hover:shadow-slate-900/10",
          "focus:border-primary focus:shadow-md focus:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25",
          "dark:border-slate-600 dark:from-slate-900 dark:to-slate-900/95 dark:text-slate-100 dark:shadow-slate-950/40",
          open && "border-primary/50 shadow-md ring-1 ring-primary/15 dark:ring-primary/25",
        ].join(" ")}
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className={[
            "absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200/90",
            "bg-white py-1 shadow-xl shadow-slate-900/15 ring-1 ring-slate-900/5",
            "dark:border-slate-600 dark:bg-slate-900 dark:ring-slate-800",
          ].join(" ")}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <li key={opt.value} role="presentation" className="px-1">
                <button
                  type="button"
                  id={id ? `${id}-option-${opt.value}` : undefined}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 font-medium text-primary dark:bg-primary/20"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  {isSelected ? <Check /> : <span className="w-4 shrink-0" aria-hidden />}
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
