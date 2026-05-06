interface PlaceholderFrameProps {
  label: string;
  hideLabel?: boolean;
  meta?: string;
  variant?: "chart" | "gamma" | "upload";
  children?: React.ReactNode;
}

export function PlaceholderFrame({
  hideLabel = false,
  label,
  meta,
  variant = "upload",
  children
}: PlaceholderFrameProps) {
  return (
    <div className={`placeholderFrame placeholderFrame--${variant}`} aria-label={label}>
      <div className="placeholderFrame__texture" />
      {children}
      {hideLabel ? null : (
        <div className="placeholderFrame__label">
          <span>{label}</span>
          {meta ? <small>{meta}</small> : null}
        </div>
      )}
    </div>
  );
}
