"use client";

// Start-Animation fuer die installierte App (PWA im Standalone-Modus):
// Das Logo baut sich aus seinen Kacheln auf, dann die Wortmarke (LogoAnimiert), ~1.9s, dann Ausblenden (Denis 25.09.2026).
// Zeigt sich NUR beim App-Start (einmal pro Sitzung), nie im normalen
// Browser. Zum Testen im Browser: /?splash=1 anhaengen.
import { useEffect, useState } from "react";
import { LogoAnimiert } from "@/components/shared/LogoAnimiert";

export default function AppSplash() {
  const [phase, setPhase] = useState("aus");   // aus | an | weg

  useEffect(() => {
    let standalone = false;
    try {
      standalone = window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true
        || new URLSearchParams(window.location.search).has("splash");
    } catch {}
    if (!standalone) return;
    // Flag erst beim Ausblenden setzen: wuerde es sofort gesetzt, liefe der
    // doppelte Dev-Mount (StrictMode) in den Guard und die Timer fehlten,
    // der Splash bliebe haengen.
    try { if (sessionStorage.getItem("beedaro_splash")) return; } catch {}
    setPhase("an");
    const t1 = setTimeout(() => {
      setPhase("weg");
      try { sessionStorage.setItem("beedaro_splash", "1"); } catch {}
    }, 1900);
    const t2 = setTimeout(() => setPhase("aus"), 2350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "aus") return null;
  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#FFFFFF",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
      opacity: phase === "weg" ? 0 : 1, transition: "opacity .45s ease",
      pointerEvents: phase === "weg" ? "none" : "auto",
    }}>
      <LogoAnimiert width={200} />
      <p className="bd-splash-claim" style={{
        margin: 0, fontFamily: "'Manrope', sans-serif",
        fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(20,17,13,0.5)",
      }}>
        Kaufen. Verkaufen. Gutes tun.
      </p>
    </div>
  );
}
