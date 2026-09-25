"use client";
import BLogo from "@/components/shared/BLogo";

// Favoriten-Herz im Live-Design (Denis 25.09.2026, wie im neuen Design): das um 90 Grad gedrehte Beedaro-B statt des Lucide-Herzens.
// Nimmt dieselben Props wie das Lucide-Symbol (size, color, fill, style, className), damit die Aufrufer unverändert bleiben:
// fill ungleich "none" färbt das ganze Zeichen (gesetzt), sonst gilt color bzw. currentColor (Umriss gibt es beim B nicht).
export function HerzIcon({ size = 16, color, fill, style, className, strokeWidth, ...rest }) {
  const farbe = fill && fill !== "none" ? fill : color;
  return (
    <span className={className} style={{ display: "inline-flex", color: farbe || undefined, ...style }} {...rest}>
      <BLogo herz size={size} title="" />
    </span>
  );
}
