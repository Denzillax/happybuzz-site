"use client";

// ── Katalog-Design-Tokens ──
const INK = "#14110D";
const SAND = "#F9F4EC";
const PAPER = "#FBF8F2";
const PETROL = "#0B5E5C";
const MUTED = "rgba(20,17,13,0.62)";
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const BODY = "'Manrope', system-ui, sans-serif";

export default function ImprintPage() {
  const L = { fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 };
  const V = { fontSize: 14, color: INK, lineHeight: 1.65, marginBottom: 20 };
  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>
      <div style={{
        background: SAND, padding: "52px 24px 44px", borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 10 }}>Rechtliches</div>
          <h1 style={{ fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>Impressum</h1>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, margin: 0, letterSpacing: ".03em" }}>Stand: Juni 2026</p>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${INK}`, padding: "30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 40px" }}>
            <div>
              <p style={L}>Betreiber</p>
              <p style={V}>MOQRO by Denis Mihaljevic<br />Einzelfirma<br />BEEDARO ist eine Marke von MOQRO.</p>
            </div>
            <div>
              <p style={L}>Handelsregister</p>
              <p style={V}>UID: CHE-237.380.784<br />Handelsregister des Kantons Luzern</p>
            </div>
            <div>
              <p style={L}>Adresse</p>
              <p style={V}>Gemeindehausstrasse 11B<br />6010 Kriens<br />Schweiz</p>
            </div>
            <div>
              <p style={L}>Kontakt</p>
              <p style={V}>E-Mail: info@beedaro.ch<br />Support: support@beedaro.ch<br />Mutterfirma: hello@moqro.ch</p>
            </div>
            <div>
              <p style={L}>Verantwortlich für Inhalte</p>
              <p style={V}>Denis Mihaljevic<br />Gemeindehausstrasse 11B<br />6010 Kriens</p>
            </div>
            <div>
              <p style={L}>Hosting</p>
              <p style={V}>Vercel Inc.<br />San Francisco, CA, USA<br />vercel.com</p>
            </div>
            <div>
              <p style={L}>Datenbank</p>
              <p style={V}>Supabase Inc.<br />San Francisco, CA, USA<br />supabase.com</p>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${INK}1f`, paddingTop: 20, marginTop: 4 }}>
            <p style={L}>Haftungsausschluss</p>
            <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: 0 }}>
              BEEDARO ist eine Vermittlungsplattform und eine Marke von MOQRO by Denis Mihaljevic. Für die Inhalte der Inserate und die Abwicklung von Transaktionen zwischen Nutzern übernimmt MOQRO keine Haftung. Trotz sorgfältiger Kontrolle übernehmen wir keine Gewähr für die Richtigkeit externer Links.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${INK}1f`, paddingTop: 20, marginTop: 20 }}>
            <p style={L}>Marke und Betreiberin</p>
            <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: 0 }}>
              BEEDARO wird betrieben von MOQRO by Denis Mihaljevic, Gemeindehausstrasse 11B, 6010 Kriens.
              Weitere Angaben zur Betreiberin unter{" "}
              <a href="https://www.moqro.ch/impressum/" target="_blank" rel="noopener noreferrer" style={{ color: INK, textDecoration: "underline" }}>
                moqro.ch/impressum
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
