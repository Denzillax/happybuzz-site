"use client";
// Rechtes Pane wenn kein Gespräch gewählt ist (Desktop). Auf Mobile zeigt die
// Shell stattdessen die Liste (dieses Pane ist dort ausgeblendet).
// Auth + Gesprächsliste liegen im chat/layout.jsx.
import { MessageCircle } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

export default function ChatIndex() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, background: colors.cream, fontFamily: fonts.body }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: colors.surface, border: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <MessageCircle size={32} color={colors.teal} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 800, color: colors.dark, margin: "0 0 4px", fontFamily: fonts.head }}>Wähle ein Gespräch</p>
      <p style={{ fontSize: 13, color: colors.muted, margin: 0, maxWidth: 280 }}>Links ein Gespräch auswählen, um den Chat zu öffnen.</p>
    </div>
  );
}
