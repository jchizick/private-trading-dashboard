type BadgeTone = "positive" | "negative" | "neutral" | "warning";

interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
}

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`statusBadge statusBadge--${tone}`}>{children}</span>;
}
