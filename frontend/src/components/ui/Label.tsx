
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11.5px] font-mono font-medium uppercase tracking-[0.08em] text-text-muted">
      {children}
    </span>
  );
}