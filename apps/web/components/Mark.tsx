/** Greenwood mark: a drawn bow with one fletched arrow. */
export function Mark({ className = "brand-mark", title = "Greenwood" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label={title} fill="none">
      <path d="M8 4c9 3 9 21 0 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 4L8 28" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
      <path d="M8 16h18" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 12l5 4-5 4" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 13l-3 3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
