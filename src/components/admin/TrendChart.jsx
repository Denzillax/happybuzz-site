// Selbstgebauter SVG-Trendchart fuer eine Tagesreihe data=[{date, value}]. type: area | line | bar.
export function TrendChart({ data = [], color = "#0E9493", type = "area", height = 70 }) {
  const W = 240, H = height, pad = 6;
  const n = data.length;
  const max = Math.max(1, ...data.map(d => d.value));
  const x = (i) => n <= 1 ? W / 2 : (i / (n - 1)) * W;
  const y = (v) => H - pad - (v / max) * (H - pad * 2);

  if (type === "bar") {
    const bw = n > 0 ? (W / n) * 0.7 : 0;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const bx = n <= 1 ? W / 2 - bw / 2 : (i / n) * W + ((W / n) - bw) / 2;
          const by = y(d.value);
          return (
            <rect key={i} x={bx} y={by} width={bw} height={Math.max(0, H - pad - by)} rx="1.5" fill={color}>
              <title>{d.date}: {Math.round(d.value)}</title>
            </rect>
          );
        })}
      </svg>
    );
  }

  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {type === "area" && <polygon points={`0,${H} ${pts} ${W},${H}`} fill={color} fillOpacity="0.16" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
