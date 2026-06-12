/**
 * Editorial trust marker — gold hairline, no colored pill
 */
export const LiveBadge = ({ label = "12 Anfragen heute" }: { label?: string }) => (
  <span
    className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/70"
    role="status"
    aria-live="polite"
  >
    <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />
    <span className="h-px w-6 bg-gold/40" aria-hidden />
    {label}
  </span>
);

export default LiveBadge;
