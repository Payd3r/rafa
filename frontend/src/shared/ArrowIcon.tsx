export function ArrowIcon({ direction = "right", size = 24 }: {
  direction?: "left" | "right" | "up-right";
  size?: number;
}) {
  const path = direction === "left" ? "M20 12H4m6-6-6 6 6 6"
    : direction === "up-right" ? "M5 19 19 5M5 5h14v14"
    : "M4 12h16m-6-6 6 6-6 6";
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}><path d={path} /></svg>;
}
