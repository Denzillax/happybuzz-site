"use client";
import { useState } from "react";
import BLogo from "@/components/shared/BLogo";

export function FavoriteButton({ isFav, onToggle, size = 32, style = {} }) {
  // Herz springt kurz an, wenn man es setzt (nicht beim Laden, nicht beim Entfernen)
  const [pop, setPop] = useState(0);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isFav) setPop((n) => n + 1); onToggle?.(); }}
      aria-pressed={!!isFav}
      aria-label={isFav ? "Aus den Favoriten entfernen" : "Zu den Favoriten"}
      className="eckig kein-akzent"
      style={{
        // Meeko-Design (20.09.2026): Favoriten sind app-weit das um 90 Grad gedrehte B. Ruhig: Ink auf Weiss, gesetzt:
        // Himbeer auf Rosa (Gelb auf Weiss war zu schwach). Gilt für Karte, Inserat, Meine Inserate und die Favoriten-Seite.
        width: size, height: size, borderRadius: 999, padding: 0,
        background: isFav ? "#FFE3FB" : "#fff", border: "1px solid #1D1D1D",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: isFav ? "#C2255C" : "#1D1D1D",
        transition: "background .15s, color .15s", ...style,
      }}
    >
      <span key={pop} className={pop ? "bd-fx-heart" : undefined} style={{ display: "flex" }}><BLogo herz size={size * 0.5} title="" /></span>
    </button>
  );
}
