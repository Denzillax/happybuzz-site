// Pixel-B (Logo-Entwurf von Denis, 19.09.2026): ein B, das links in Quadrate zerfällt.
// Um 90 Grad gegen den Uhrzeiger gedreht liegen die zwei Bögen oben und die Quadrate bilden
// die Spitze: So dient dasselbe Zeichen als Favoriten-Herz (herz).
// Farbe aus currentColor. Die zwei Aussparungen im B sind echte Löcher (Maske), dort scheint
// der Grund durch. Raster: 43 px, fünf Reihen.
import { useId } from "react";

export default function BLogo({ size = 40, herz = false, title = "BEEDARO", style, className }) {
  const id = `b-logo-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size} height={herz ? size : (size * 213) / 224} viewBox={herz ? "0 0 213 224" : "0 0 224 213"}
      role="img" aria-label={title || undefined} aria-hidden={title ? undefined : true}
      className={className} style={{ display: "block", ...style }}
    >
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="224" height="213">
        <rect width="224" height="213" fill="#fff" />
        <rect x="86" y="43" width="43" height="43" fill="#000" />
        <rect x="86" y="129" width="43" height="43" fill="#000" />
      </mask>
      {/* Herz: erst um den Ursprung drehen, dann nach unten in die Fläche schieben */}
      <g transform={herz ? "translate(0 224) rotate(-90)" : undefined}>
        <g fill="currentColor" mask={`url(#${id})`}>
          <rect x="86" y="0" width="80" height="213" />
          <circle cx="160" cy="52" r="52" />
          <circle cx="168.5" cy="158.5" r="54.5" />
        </g>
        <g fill="currentColor">
          <rect x="43" y="43" width="43" height="43" />
          <rect x="0" y="86" width="43" height="43" />
          <rect x="43" y="129" width="43" height="43" />
        </g>
      </g>
    </svg>
  );
}
