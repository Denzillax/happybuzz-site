import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#FAFAF8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#191615" }}>
      <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 480 }}>
        <div style={{ fontSize: 72, fontWeight: 900, fontFamily: "'General Sans', sans-serif", color: "#F4C03F", letterSpacing: ".05em", lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "16px 0 8px", fontFamily: "'General Sans', sans-serif", letterSpacing: ".03em" }}>SEITE NICHT GEFUNDEN</h1>
        <p style={{ fontSize: 14, color: "#8a8078", margin: "0 0 28px", lineHeight: 1.6 }}>
          Diese Seite existiert nicht oder wurde verschoben. Vielleicht findest du was du suchst auf dem Marktplatz.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: 8, background: "#F4C03F", color: "#191615", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Manrope', sans-serif" }}>
            Zur Startseite
          </Link>
          <Link href="/search" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: 8, border: "1.5px solid #e0d6c8", background: "#fff", color: "#191615", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Manrope', sans-serif" }}>
            Zum Marktplatz
          </Link>
        </div>
      </div>
    </div>
  );
}
