type Variant = "open" | "in_review" | "resolved" | "hidden" | "lost" | "found" | "pending" | "approved" | "denied";

const styles: Record<Variant, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  in_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200",
  hidden: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
  lost: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  found: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200",
  denied: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const labels: Record<Variant, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  hidden: "Hidden",
  lost: "Lost",
  found: "Found",
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

interface Props {
  variant: Variant;
  className?: string;
}

export default function Badge({ variant, className = "" }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`}
    >
      {labels[variant]}
    </span>
  );
}
