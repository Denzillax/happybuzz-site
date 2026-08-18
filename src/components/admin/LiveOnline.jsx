"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { chartCard, chartLabel } from "@/components/admin/adminStyles";
import { User } from "lucide-react";

// Wer ist gerade online? Liest den Presence-Kanal "online" (gefuellt vom
// PresenceTracker im Layout) und aktualisiert sich in Echtzeit.
const seitenLabel = (p) => {
  if (!p || p === "/") return "Startseite";
  if (p.startsWith("/listing/")) return "Inserat-Seite";
  if (p.startsWith("/listings/new")) return "Inserieren";
  if (p.startsWith("/listings")) return "Meine Inserate";
  if (p.startsWith("/search")) return "Suche";
  if (p.startsWith("/chat")) return "Nachrichten";
  if (p.startsWith("/favorites")) return "Favoriten";
  if (p.startsWith("/settings")) return "Einstellungen";
  if (p.startsWith("/admin")) return "Admin";
  if (p.startsWith("/order/")) return "Bestellseite";
  if (p.startsWith("/fees")) return "Gebühren";
  if (p.startsWith("/hive")) return "Bienenstock";
  if (p.startsWith("/beta")) return "Beta-Seite";
  if (p.startsWith("/how-it-works")) return "So funktioniert's";
  if (p.startsWith("/about")) return "Über uns";
  if (p.startsWith("/impact")) return "Impact";
  if (p.startsWith("/user/") || p.startsWith("/profile/")) return "Profil-Seite";
  return p;
};

const seitText = (iso) => {
  if (!iso) return "";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "gerade gekommen";
  if (min < 60) return `seit ${min} Min.`;
  return `seit ${Math.floor(min / 60)} Std. ${min % 60} Min.`;
};

export function LiveOnline() {
  const [leute, setLeute] = useState(null); // null = laedt

  useEffect(() => {
    // Der PresenceTracker im Layout haelt den Kanal "online" schon offen.
    // Auf einem abonnierten Kanal darf kein Callback mehr registriert werden,
    // darum wird der bestehende Kanal einfach im Takt ausgelesen.
    let eigener = null;
    const lesen = (ch) => {
      const state = ch.presenceState();
      // Ein Eintrag pro Presence-Key (mehrere Tabs desselben Nutzers = 1 Zeile)
      setLeute(Object.entries(state).map(([key, metas]) => ({ key, ...metas[metas.length - 1] })));
    };
    const tick = () => {
      const vorhanden = supabase.getChannels().find((c) => c.topic === "realtime:online");
      if (vorhanden) { lesen(vorhanden); return; }
      // Fallback: falls kein Tracker laeuft, eigenen Lese-Kanal aufmachen
      if (!eigener) {
        eigener = supabase.channel("online");
        eigener.on("presence", { event: "sync" }, () => lesen(eigener)).subscribe();
      }
    };
    tick();
    const iv = setInterval(tick, 2000);
    return () => { clearInterval(iv); if (eigener) supabase.removeChannel(eigener); };
  }, []);

  const angemeldet = (leute || []).filter((p) => !p.guest).sort((a, b) => +new Date(a.seit || 0) - +new Date(b.seit || 0));
  const gaeste = (leute || []).filter((p) => p.guest).length;

  return (
    <div style={{ ...chartCard, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2E7D32", boxShadow: "0 0 0 3px #2E7D3233", flexShrink: 0 }} />
        <span style={chartLabel}>Gerade online</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
          {leute === null ? "verbinde…" : `${(leute || []).length} online · ${angemeldet.length} angemeldet${gaeste ? ` · ${gaeste} Gast${gaeste > 1 ? "e" : ""}` : ""}`}
        </span>
      </div>
      {leute !== null && (leute.length === 0 ? (
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.muted, fontFamily: fonts.body }}>Gerade niemand auf der Seite.</p>
      ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {angemeldet.map((p) => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, fontFamily: fonts.body }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: colors.yellowSoft, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {p.avatar ? <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={13} color={colors.yellow} />}
              </div>
              <span style={{ fontWeight: 700, color: colors.dark }}>{p.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "2px 8px", borderRadius: 999, background: "#E6F5F5", color: colors.tealDark }}>{seitenLabel(p.path)}</span>
              <span style={{ marginLeft: "auto", color: colors.muted, fontSize: 11, whiteSpace: "nowrap" }}>{seitText(p.seit)}</span>
            </div>
          ))}
          {gaeste > 0 && (
            <p style={{ margin: "2px 0 0 36px", fontSize: 11.5, color: colors.muted, fontFamily: fonts.body }}>
              + {gaeste} anonyme{gaeste > 1 ? "" : "r"} Gast{gaeste > 1 ? "e" : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
