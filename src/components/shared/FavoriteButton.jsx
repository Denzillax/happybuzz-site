"use client";
import { Heart } from "lucide-react";
import { colors } from "@/lib/theme";

export function FavoriteButton({ isFav, onToggle, size = 32, style = {} }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle?.(); }}
      style={{
        width: size, height: size, borderRadius: size / 4,
        background: "rgba(255,255,255,.9)", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: isFav ? colors.red : "#bbb", backdropFilter: "blur(4px)",
        transition: "all .15s", ...style,
      }}
    >
      <Heart size={size * 0.5} fill={isFav ? "currentColor" : "none"} />
    </button>
  );
}
