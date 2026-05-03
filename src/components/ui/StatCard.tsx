interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "positive" | "negative" | "neutral";
}

export function StatCard({ label, value, detail, tone = "neutral" }: StatCardProps) {
  return (
    <div className={`statCard statCard--${tone}`}>
      <span className="statCard__label">{label}</span>
      <strong>{value}</strong>
      {detail ? <span className="statCard__detail">{detail}</span> : null}
    </div>
  );
}
