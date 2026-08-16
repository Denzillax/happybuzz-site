"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Logo } from "@/components/shared/Logo";
import { K, MONO, HEAD, BODY, card, btnPrimary } from "@/lib/katalog";

// Betriebsmodus-Gate um den öffentlichen Bereich.
//   live    → alle rein (Normalfall, ein Query beim Laden)
//   beta    → nur Konten mit profiles.beta_access (Staff ist per Seed frei)
//   wartung → nur Staff (beta_access deckt Staff mit ab)
//
// Ehrliche Einordnung: das ist ein UI-Gate für die geschlossene Beta, kein
// Daten-Lockdown. Schreibzugriffe schützt weiterhin RLS; wer die API kennt,
// kann öffentliche Lesedaten sehen. Für "Testnutzer rein, Rest sieht die
// Startseite nicht" ist das genau das richtige Werkzeug.
//
// /login liegt ausserhalb des (public)-Layouts und bleibt immer erreichbar,
// sonst könnten sich Testnutzer nicht anmelden.
export default function SiteGate({ children }) {
  const [state, setState] = useState({ loading: true, allowed: true, mode: "live", message: null, loggedIn: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: s } = await supabase.from("site_settings").select("mode, message").eq("id", 1).maybeSingle();
        const mode = s?.mode || "live";
        if (mode === "live") { if (alive) setState({ loading: false, allowed: true, mode, message: null, loggedIn: false }); return; }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (alive) setState({ loading: false, allowed: false, mode, message: s?.message, loggedIn: false }); return; }

        const { data: p } = await supabase.from("profiles").select("beta_access").eq("id", session.user.id).maybeSingle();
        if (alive) setState({ loading: false, allowed: !!p?.beta_access, mode, message: s?.message, loggedIn: true });
      } catch {
        // Im Zweifel NICHT aussperren: ein kaputter Settings-Read darf die
        // Seite nicht lahmlegen.
        if (alive) setState({ loading: false, allowed: true, mode: "live", message: null, loggedIn: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) return null;
  if (state.allowed) return children;

  const wartung = state.mode === "wartung";
  return (
    <div style={{ minHeight: "100vh", background: K.sand, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...card, maxWidth: 460, width: "100%", padding: "36px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Logo width={150} /></div>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: K.petrol, margin: "0 0 10px" }}>
          {wartung ? "Wartungsarbeiten" : "Geschlossene Beta"}
        </p>
        <h1 style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 700, color: K.ink, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          {wartung ? "Wir sind gleich zurück." : "BEEDARO startet bald."}
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 14, color: "rgba(20,17,13,0.65)", lineHeight: 1.7, margin: "0 0 22px" }}>
          {state.message
            || (wartung
              ? "Die Seite wird gerade gewartet. Danke für deine Geduld."
              : state.loggedIn
                ? "Dein Konto wartet auf die Freigabe fürs Testen. Wir melden uns, sobald es losgeht."
                : "Der Katalog der zweiten Leben öffnet in Kürze. Testerinnen und Tester melden sich hier an.")}
        </p>
        {!wartung && !state.loggedIn && (
          <a href="/login" style={{ ...btnPrimary, display: "inline-block", width: "auto", padding: "12px 28px", textDecoration: "none", fontSize: 14 }}>
            Anmelden
          </a>
        )}
        {state.loggedIn && (
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 13, fontWeight: 700, color: K.petrol, textDecoration: "underline" }}>
            Anderes Konto anmelden
          </button>
        )}
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: "rgba(20,17,13,0.45)", margin: "26px 0 0", textTransform: "uppercase" }}>
          Kaufen. Verkaufen. Gutes tun.
        </p>
      </div>
    </div>
  );
}
