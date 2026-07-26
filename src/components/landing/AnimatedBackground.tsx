export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div
        className="blob blob-1 -left-24 -top-24 h-[380px] w-[380px]"
        style={{ background: "var(--color-signal)" }}
      />
      <div
        className="blob blob-2 -right-32 top-40 h-[420px] w-[420px]"
        style={{ background: "var(--color-relay)" }}
      />
      <div
        className="blob blob-1 left-1/3 top-[60%] h-[300px] w-[300px]"
        style={{ background: "var(--color-signal-dim)", animationDelay: "-8s" }}
      />
    </div>
  );
}
