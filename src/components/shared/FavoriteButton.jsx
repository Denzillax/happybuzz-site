"use client";
import { useState } from "react";
import {  } from "lucide-react";
import { HerzIcon as Heart } from "@/components/shared/HerzIcon";
import { colors } from "@/lib/theme";

export function FavoriteButton({ isFav, onToggle, size = 32, style = {} }) {
  // Herz springt kurz an, wenn man es setzt (nicht beim Laden, nicht beim Entfernen)
  const [pop, setPop] = useState(0);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isFav) setPop((n) => n + 1); onToggle?.(); }}
      style={{
        width: size, height: size, borderRadius: size / 4,
        background: "rgba(255,255,255,.9)", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        // Favoriten sind app-weit HONEY (nicht rot): gleiche Farbe wie
        // ListingClient, Meine Inserate und die Favoriten-Seite.
        color: isFav ? colors.yellow : "#9AA0A6", backdropFilter: "blur(4px)",
        transition: "all .15s", ...style,
      }}
    >
      <span key={pop} className={pop ? "bd-fx-heart" : undefined} style={{ display: "flex" }}><Heart size={size * 0.5} fill={isFav ? "currentColor" : "none"} /></span>
    </button>
  );
}
