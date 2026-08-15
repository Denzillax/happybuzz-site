"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#191615" }}>
      <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 480 }}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "'General Sans', sans-serif", color: "#c62828", letterSpacing: ".05em", lineHeight: 1, marginBottom: 8 }}>OOPS</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", fontFamily: "'General Sans', sans-serif", letterSpacing: ".03em" }}>ETWAS IST SCHIEFGELAUFEN</h1>
        <p style={{ fontSize: 14, color: "#8a8078", margin: "0 0 28px", lineHeight: 1.6 }}>
          Ein unerwarteter Fehler ist aufgetreten. Versuche es nochmal oder geh zurück zur Startseite.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => reset()} style={{ padding: "12px 28px", borderRadius: 0, background: "#F4C03F", color: "#191615", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
            Nochmal versuchen
          </button>
          <a href="/" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: 0, border: "1.5px solid #e0d6c8", background: "#fff", color: "#191615", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Manrope', sans-serif" }}>
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
