export function StatusDot({ variant }: { variant: "error" | "success" | "info" }) {
  const color = variant === "error" ? "bg-danger" : variant === "success" ? "bg-accent" : "bg-blue"
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`}/>;
}
