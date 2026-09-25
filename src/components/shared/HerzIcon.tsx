"use client";
import type { CSSProperties } from "react";
import BLogo from "@/components/shared/BLogo";

// Favoriten-Herz im Live-Design (Denis 25.09.2026, wie im neuen Design): das um 90 Grad gedrehte Beedaro-B statt des Lucide-Herzens.
// Nimmt dieselben Props wie das Lucide-Symbol (size, color, fill, style, className, strokeWidth), damit die Aufrufer unverändert
// bleiben: fill ungleich "none" färbt das ganze Zeichen (gesetzt), sonst gilt color bzw. currentColor (Umriss gibt es beim B nicht).
type Props = {
  size?: number;
  color?: string;
  fill?: string;
  style?: CSSProperties;
  className?: string;
  strokeWidth?: number;
  [weitere: string]: unknown;
};

export function HerzIcon({ size = 16, color, fill, style, className, strokeWidth: _s, ...rest }: Props) {
  const farbe = fill && fill !== "none" ? fill : color;
  return (
    <span className={className} style={{ display: "inline-flex", color: farbe || undefined, ...style }} {...rest}>
      <BLogo herz size={size} title="" />
    </span>
  );
}
