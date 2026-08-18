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

const S = {
  h2: { fontSize: 17, fontWeight: 700, fontFamily: HEAD, margin: "30px 0 10px", color: INK, letterSpacing: "-0.01em" },
  p: { fontSize: 14, color: MUTED, lineHeight: 1.7, margin: "0 0 12px" },
};

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>
      <div style={{
        background: SAND, padding: "52px 24px 44px", borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 10 }}>Rechtliches</div>
          <h1 style={{ fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>Datenschutzerklärung</h1>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, margin: 0, letterSpacing: ".03em" }}>Gültig ab 1. Juni 2026 · MOQRO by Denis Mihaljevic, Gemeindehausstrasse 11B, 6010 Kriens</p>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${INK}`, padding: "30px 30px 22px" }}>
          <h2 style={S.h2}>1. Verantwortliche Stelle</h2>
          <p style={S.p}>Verantwortlich für die Datenbearbeitung ist: MOQRO by Denis Mihaljevic (Einzelfirma), Gemeindehausstrasse 11B, 6010 Kriens, Schweiz. Kontakt: datenschutz@beedaro.ch</p>
          <p style={S.p}>BEEDARO ist eine Marke von MOQRO. Nennungen von BEEDARO in dieser Erklärung beziehen sich auf MOQRO als verantwortliche Stelle.</p>

          <h2 style={S.h2}>2. Welche Daten wir erheben</h2>
          <p style={S.p}>Bei der Registrierung: E-Mail-Adresse, Anzeigename. Optional: Vorname, Nachname, Telefonnummer, Postadresse, IBAN, Profilbild, ID-Dokument (zur Verifizierung). Bei Unternehmenskonten zusätzlich Firmenname und UID. Bei der Nutzung: IP-Adresse, Browser-Typ, Zugriffszeitpunkte, aufgerufene Seiten. Bei Transaktionen: Inserat-Daten, Nachrichten, Bewertungen, Zahlungsinformationen.</p>

          <h2 style={S.h2}>3. Zweck der Datenbearbeitung</h2>
          <p style={S.p}>Wir verwenden deine Daten ausschliesslich für: Bereitstellung und Betrieb der Plattform, Abwicklung von Transaktionen, Kommunikation zwischen Nutzern, Verifizierung und Trust Level, Gebührenabrechnung, Sicherheit und Betrugsprävention sowie zur Verbesserung unseres Angebots. Zur Betriebsüberwachung sehen Administratoren in Echtzeit, welche angemeldeten Nutzer die Plattform gerade nutzen und in welchem Bereich sie sich befinden; diese Angaben werden nicht gespeichert.</p>

          <h2 style={S.h2}>4. Datenweitergabe</h2>
          <p style={S.p}>Wir geben deine Daten nicht an Dritte weiter, ausser: bei einer bestätigten Transaktion (Adresse und IBAN an Käufer bzw. Verkäufer), bei rechtlichen Verpflichtungen (Behörden auf Anordnung), an Dienstleister, die für den Betrieb notwendig sind (Supabase für die Datenbank, Vercel für das Hosting). Wir verkaufen keine Daten und zeigen keine personalisierte Werbung.</p>

          <h2 style={S.h2}>5. Datenspeicherung</h2>
          <p style={S.p}>Deine Daten werden auf Servern in der EU bzw. Schweiz gespeichert (Supabase). Wir speichern Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist. Nach Löschung deines Kontos werden deine persönlichen Daten innerhalb von 30 Tagen gelöscht. Transaktionsdaten werden für die gesetzlich vorgeschriebene Aufbewahrungsfrist (10 Jahre) archiviert.</p>

          <h2 style={S.h2}>6. ID-Verifizierung</h2>
          <p style={S.p}>ID-Dokumente werden in einem privaten, verschlüsselten Storage gespeichert. Nur der Nutzer selbst und autorisierte Administratoren haben Zugriff. Nach erfolgreicher Verifizierung wird nur der Status (verifiziert / nicht verifiziert) gespeichert. Bei Ablehnung wird das Dokument sofort gelöscht.</p>

          <h2 style={S.h2}>7. Cookies</h2>
          <p style={S.p}>BEEDARO verwendet nur technisch notwendige Cookies für Login-Sessions und Funktionalität. Wir setzen keine Tracking-Cookies, keine Analyse-Tools von Drittanbietern und keine Werbe-Cookies ein.</p>

          <h2 style={S.h2}>8. Deine Rechte</h2>
          <p style={S.p}>Du hast jederzeit das Recht auf: Auskunft über deine gespeicherten Daten, Berichtigung falscher Daten, Löschung deiner Daten, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerruf deiner Einwilligung. Kontaktiere uns unter datenschutz@beedaro.ch.</p>

          <h2 style={S.h2}>9. Änderungen</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version ist immer auf dieser Seite verfügbar.</p>
        </div>
      </div>
    </div>
  );
}
