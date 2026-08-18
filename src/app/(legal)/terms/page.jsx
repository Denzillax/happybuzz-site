"use client";
import Link from "next/link";

// ── Katalog-Design-Tokens ──
const INK = "#14110D";
const SAND = "#F9F4EC";
const PAPER = "#FBF8F2";
const PETROL = "#0B5E5C";
const MUTED = "rgba(20,17,13,0.62)";
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const BODY = "'Manrope', system-ui, sans-serif";

const S = {
  h2: { fontSize: 17, fontWeight: 700, fontFamily: HEAD, margin: "30px 0 10px", color: INK, letterSpacing: "-0.01em" },
  p: { fontSize: 14, color: MUTED, lineHeight: 1.7, margin: "0 0 12px" },
};

export default function TermsPage() {
  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>
      <div style={{
        background: SAND, padding: "52px 24px 44px", borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 10 }}>Rechtliches</div>
          <h1 style={{ fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>Allgemeine Geschäftsbedingungen</h1>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, margin: 0, letterSpacing: ".03em" }}>Gültig ab 1. Juni 2026 · MOQRO by Denis Mihaljevic, Gemeindehausstrasse 11B, 6010 Kriens</p>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${INK}`, padding: "30px 30px 22px" }}>
          <h2 style={S.h2}>1. Geltungsbereich</h2>
          <p style={S.p}>Diese AGB regeln die Nutzung der Plattform BEEDARO (beedaro.ch). Mit der Registrierung akzeptiert der Nutzer diese Bedingungen. BEEDARO ist ein Schweizer Peer-to-Peer Marktplatz für den Kauf, Verkauf, die Vermietung, das Anbieten von Dienstleistungen und das Verschenken von Secondhand-Artikeln.</p>
          <p style={S.p}>BEEDARO ist eine Marke von MOQRO by Denis Mihaljevic (Einzelfirma), Gemeindehausstrasse 11B, 6010 Kriens, Schweiz. Vertragspartnerin des Nutzers und Betreiberin der Plattform ist MOQRO. Nennungen von BEEDARO in diesen AGB beziehen sich auf MOQRO als Betreiberin.</p>

          <h2 style={S.h2}>2. Registrierung & Konto</h2>
          <p style={S.p}>Nutzer müssen mindestens 18 Jahre alt sein und ihren Wohnsitz in der Schweiz oder im Fürstentum Liechtenstein haben. Konten gibt es als Privat- oder Unternehmenskonto. Jede Person darf nur ein Konto besitzen. Die Angabe wahrheitsgemässer Daten ist Pflicht. BEEDARO behält sich das Recht vor, Konten bei Verstössen zu sperren.</p>

          <h2 style={S.h2}>3. Inserate & Inhalte</h2>
          <p style={S.p}>Verkäufer sind für die Richtigkeit ihrer Angaben verantwortlich. Inserate werden vor der Veröffentlichung von BEEDARO geprüft. Verboten sind: illegale Waren, Waffen, Drogen, gefälschte Produkte, pornografische Inhalte und alles, was gegen Schweizer Recht verstösst. BEEDARO kann Inserate ohne Vorankündigung ablehnen oder entfernen.</p>

          <h2 style={S.h2}>4. Bee-Rate & Gebühren</h2>
          <p style={S.p}>Das Erstellen von Inseraten ist kostenlos. Bei erfolgreichem Verkauf fällt die selbst gewählte Bee-Rate an (3%, 5%, 7% oder 10%). Die Gebühr wird vom Verkaufserlös abgezogen. 20% der Gebühr fliessen als Bee-Impact in Schweizer Naturschutzprojekte. Gebühren sind innerhalb von 30 Tagen zu begleichen.</p>

          <h2 style={S.h2}>5. Zahlung & Versand</h2>
          <p style={S.p}>Die Zahlung erfolgt direkt zwischen Käufer und Verkäufer per Banküberweisung, TWINT oder Barzahlung bei Abholung. BEEDARO ist nicht am Zahlungsprozess beteiligt und übernimmt keine Haftung für Zahlungsausfälle. Der Versand liegt in der Verantwortung des Verkäufers.</p>

          <h2 style={S.h2}>6. Bewertungen</h2>
          <p style={S.p}>Nach Abschluss einer Transaktion können beide Parteien eine Bewertung abgeben. Bewertungen müssen wahrheitsgemäss sein. Beleidigungen, Drohungen oder falsche Angaben führen zur Löschung der Bewertung und können Konsequenzen für das Konto haben.</p>

          <h2 style={S.h2}>7. Haftungsausschluss</h2>
          <p style={S.p}>BEEDARO vermittelt lediglich zwischen Käufern und Verkäufern. Für die Qualität, Echtheit und den Zustand der angebotenen Artikel übernimmt BEEDARO keine Haftung. Streitigkeiten zwischen Nutzern sind direkt zu klären. BEEDARO stellt keine Garantie für die ununterbrochene Verfügbarkeit der Plattform.</p>

          <h2 style={S.h2}>8. Datenschutz</h2>
          <p style={S.p}>Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäss unserer <Link href="/privacy" style={{ color: PETROL, fontWeight: 700 }}>Datenschutzerklärung</Link> und dem Schweizer Datenschutzgesetz (DSG).</p>

          <h2 style={S.h2}>9. Änderungen der AGB</h2>
          <p style={S.p}>BEEDARO behält sich das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden per E-Mail und auf der Plattform angekündigt. Bei Weiternutzung nach Inkrafttreten gelten die neuen AGB als akzeptiert.</p>

          <h2 style={S.h2}>10. Gerichtsstand & Recht</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Es gilt Schweizer Recht. Gerichtsstand ist Kriens, Kanton Luzern, Schweiz.</p>
        </div>
      </div>
    </div>
  );
}
