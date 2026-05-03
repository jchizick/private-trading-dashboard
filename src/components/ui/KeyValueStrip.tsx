interface KeyValueItem {
  label: string;
  value: React.ReactNode;
}

interface KeyValueStripProps {
  items: KeyValueItem[];
  columns?: "two" | "three" | "four";
  className?: string;
}

export function KeyValueStrip({
  items,
  columns = "three",
  className
}: KeyValueStripProps) {
  return (
    <div className={`keyValueStrip keyValueStrip--${columns} ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <div key={item.label} className="keyValueStrip__item">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
