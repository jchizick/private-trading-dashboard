interface SectionPanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionPanel({
  title,
  description,
  action,
  children,
  className
}: SectionPanelProps) {
  return (
    <section className={`sectionPanel ${className ?? ""}`.trim()}>
      <header className="sectionPanel__header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="sectionPanel__action">{action}</div> : null}
      </header>
      <div className="sectionPanel__body">{children}</div>
    </section>
  );
}
