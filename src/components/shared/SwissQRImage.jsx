"use client";
import { qrImageUrl } from "@/lib/swissQR";

// Swiss-QR-Code MIT Schweizer Kreuz in der Mitte, wie es der Standard
// verlangt (schwarzes Quadrat, weisses Kreuz, 7 von 46 Einheiten ~ 15%).
// Der QR wird mit ECC-Stufe M erzeugt, das Kreuz liegt damit sicher im
// Fehlerkorrektur-Budget. Eine Komponente fuer ALLE Zahlteile.
export default function SwissQRImage({ payload, size = 200, style = {} }) {
  const url = qrImageUrl(payload, size);
  if (!url) return null;
  return (
    <span style={{ position: "relative", display: "inline-block", lineHeight: 0, ...style }}>
      <img src={url} alt="QR-Zahlteil" style={{ width: "100%", height: "auto", display: "block" }} />
      <svg viewBox="0 0 32 32" aria-hidden
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "15%", height: "15%" }}>
        <rect width="32" height="32" fill="#000" />
        <rect x="4" y="4" width="24" height="24" fill="#000" stroke="#fff" strokeWidth="1.5" />
        <rect x="13.2" y="7" width="5.6" height="18" fill="#fff" />
        <rect x="7" y="13.2" width="18" height="5.6" fill="#fff" />
      </svg>
    </span>
  );
}
