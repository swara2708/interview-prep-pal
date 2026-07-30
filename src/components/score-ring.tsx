export function ScoreRing({
  value,
  max = 10,
  size = 140,
  label = "Overall",
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
}) {
  const stroke = size / 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="stroke-cat-overall transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tracking-tight tabular-nums">
          {value.toFixed(1)}
        </span>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}