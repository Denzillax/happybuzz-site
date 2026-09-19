// Bienen-Logo (Denis 19.09.2026): die flache Frontal-Biene als einfarbige Silhouette.
// Augen, Nase und Streifen sind ausgespart, dort scheint der Grund durch (auf Gelb also gelb).
// Die Farbe kommt aus currentColor, Standard ist Ink. Dieselbe Figur fliegt als
// public/bee-flach.svg über die Seite.
import { useId } from "react";

export default function BeeLogo({ size = 40, title = "BEEDARO", style }) {
  // Eigene Masken-ID pro Exemplar, sonst teilen sich mehrere Logos auf einer Seite eine Maske.
  // useId liefert auf Server und Browser dieselbe ID (kein Hydration-Fehler).
  const id = `bee-logo-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={(size * 200) / 240} viewBox="0 0 240 200" role="img" aria-label={title} style={{ display: "block", color: "#191615", ...style }}>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="200">
        <rect width="240" height="200" fill="#fff" />
        <circle cx="97" cy="66" r="10.5" fill="#000" />
        <circle cx="143" cy="66" r="10.5" fill="#000" />
        <circle cx="120" cy="83" r="6.5" fill="#000" />
        <rect x="72" y="103" width="96" height="19" rx="7" fill="#000" />
        <rect x="72" y="131" width="96" height="19" rx="7" fill="#000" />
      </mask>
      <g fill="currentColor" stroke="none" mask={`url(#${id})`}>
        <circle cx="40" cy="104" r="38" />
        <circle cx="200" cy="104" r="38" />
        <circle cx="80" cy="13" r="10" />
        <circle cx="160" cy="13" r="10" />
        <path d="M103 166 L137 166 Q129 190 120 195 Q111 190 103 166Z" />
        <rect x="69" y="32" width="102" height="84" rx="34" />
        <rect x="63" y="94" width="114" height="80" rx="26" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M106 40 Q100 22 84 16" />
        <path d="M134 40 Q140 22 156 16" />
      </g>
    </svg>
  );
}
