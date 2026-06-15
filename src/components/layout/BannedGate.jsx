"use client";
// Blockiert die App für gesperrte Konten (is_banned). Client-Gate für die UI;
// kritische Schreibpfade sind zusätzlich server-seitig abgesichert (z.B. Chat).
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Ban } from "lucide-react";

export function BannedGate() {
  const [banned, setBanned] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;
        const { data } = await supabase.from("profiles").select("is_banned").eq("id", user.id).maybeSingle();
        if (active && data?.is_banned) setBanned(true);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  if (!banned) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(25,22,21,.97)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, textAlign: "center", color: "#fff" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(235,94,85,.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Ban size={30} color="#EB5E55" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", fontFamily: "'General Sans', system-ui, sans-serif" }}>Konto gesperrt</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,.8)", margin: "0 0 22px" }}>
          Dein Konto wurde gesperrt. Wiederholtes Austauschen von Kontaktdaten, um Geschäfte ausserhalb von BEEDARO abzuschliessen, verstösst gegen die Nutzungsbedingungen. Bei Fragen: support@happybuzz.ch
        </p>
        <button onClick={() => supabase.auth.signOut().then(() => { window.location.href = "/login"; })}
          style={{ padding: "11px 24px", borderRadius: 999, border: "none", background: "#F4C03F", color: "#191615", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Abmelden
        </button>
      </div>
    </div>
  );
}
