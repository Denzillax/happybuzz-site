import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: "#F4F4F2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#191615" }}>
      <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 520 }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#8a8078", marginBottom: 18 }}>
          Fehler 404 · Seite entfernt
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badge-cutting-prices.png" alt="Cutting Prices, Saving Flowers" style={{ width: 280, maxWidth: "72vw", height: "auto", margin: "0 auto 24px", display: "block" }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", fontFamily: "'General Sans', sans-serif", letterSpacing: ".03em" }}>DIESE SEITE WURDE WEGGESCHNITTEN</h1>
        <p style={{ fontSize: 14, color: "#8a8078", margin: "0 0 28px", lineHeight: 1.6 }}>
          Den Blumen geht es gut. Der Link leider nicht: er existiert nicht oder wurde verschoben.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: 10, background: "#F4C03F", color: "#191615", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Manrope', sans-serif", border: "1px solid #E4E0D8", boxShadow: "0 2px 8px rgba(25,22,21,.15)" }}>
            Zur Startseite
          </Link>
          <Link href="/search" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: 10, border: "1px solid #E4E0D8", background: "#fff", color: "#191615", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Manrope', sans-serif" }}>
            Zum Marktplatz
          </Link>
        </div>
      </div>
    </div>
  );
}
