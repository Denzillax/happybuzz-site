"use client";
import { Shield } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

export default function PrivacyPage() {
  const S = { h2: { fontSize: 18, fontWeight: 800, margin: "32px 0 12px", color: colors.dark }, p: { fontSize: 14, color: colors.muted, lineHeight: 1.7, margin: "0 0 12px" } };
  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Shield size={24} color={colors.yellow} />
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: fonts.head, margin: 0 }}>Datenschutzerklärung</h1>
        </div>
        <p style={{ fontSize: 13, color: colors.muted, marginBottom: 32 }}>Gültig ab 1. Juni 2026 · BEEDARO, Gemeindehausstrasse 11B, 6010 Kriens</p>

        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: "28px 28px 20px" }}>
          <h2 style={S.h2}>1. Verantwortliche Stelle</h2>
          <p style={S.p}>Verantwortlich für die Datenbearbeitung ist: Denis Mihaljevic, Gemeindehausstrasse 11B, 6010 Kriens, Schweiz. Kontakt: datenschutz@beedaro.ch</p>

          <h2 style={S.h2}>2. Welche Daten wir erheben</h2>
          <p style={S.p}>Bei der Registrierung: E-Mail-Adresse, Anzeigename. Optional: Vorname, Nachname, Telefonnummer, Postadresse, IBAN, Profilbild, ID-Dokument (zur Verifizierung). Bei der Nutzung: IP-Adresse, Browser-Typ, Zugriffszeitpunkte, aufgerufene Seiten. Bei Transaktionen: Inserat-Daten, Nachrichten, Bewertungen, Zahlungsinformationen.</p>

          <h2 style={S.h2}>3. Zweck der Datenbearbeitung</h2>
          <p style={S.p}>Wir verwenden deine Daten ausschliesslich für: Bereitstellung und Betrieb der Plattform, Abwicklung von Transaktionen, Kommunikation zwischen Nutzern, Verifizierung und Trust Level, Gebührenabrechnung, Sicherheit und Betrugsprävention, sowie zur Verbesserung unseres Angebots.</p>

          <h2 style={S.h2}>4. Datenweitergabe</h2>
          <p style={S.p}>Wir geben deine Daten nicht an Dritte weiter, ausser: bei einer bestätigten Transaktion (Adresse + IBAN an den Käufer/Verkäufer), bei rechtlichen Verpflichtungen (Behörden auf Anordnung), an Dienstleister die für den Betrieb notwendig sind (Supabase für Datenbank, Vercel für Hosting). Wir verkaufen keine Daten und zeigen keine personalisierte Werbung.</p>

          <h2 style={S.h2}>5. Datenspeicherung</h2>
          <p style={S.p}>Deine Daten werden auf Servern in der EU/Schweiz gespeichert (Supabase). Wir speichern Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist. Nach Löschung deines Kontos werden deine persönlichen Daten innerhalb von 30 Tagen gelöscht. Transaktionsdaten werden für die gesetzlich vorgeschriebene Aufbewahrungsfrist (10 Jahre) archiviert.</p>

          <h2 style={S.h2}>6. ID-Verifizierung</h2>
          <p style={S.p}>ID-Dokumente werden in einem privaten, verschlüsselten Storage gespeichert. Nur der Nutzer selbst und autorisierte Administratoren haben Zugriff. Nach erfolgreicher Verifizierung wird nur der Status (verifiziert/nicht verifiziert) gespeichert. Bei Ablehnung wird das Dokument sofort gelöscht.</p>

          <h2 style={S.h2}>7. Cookies</h2>
          <p style={S.p}>BEEDARO verwendet nur technisch notwendige Cookies für Login-Sessions und Funktionalität. Wir setzen keine Tracking-Cookies, keine Analyse-Tools von Drittanbietern und keine Werbe-Cookies ein.</p>

          <h2 style={S.h2}>8. Deine Rechte</h2>
          <p style={S.p}>Du hast jederzeit das Recht auf: Auskunft über deine gespeicherten Daten, Berichtigung falscher Daten, Löschung deiner Daten, Einschränkung der Verarbeitung, Datenübertragbarkeit, und Widerruf deiner Einwilligung. Kontaktiere uns unter datenschutz@beedaro.ch.</p>

          <h2 style={S.h2}>9. Änderungen</h2>
          <p style={S.p}>Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version ist immer auf dieser Seite verfügbar.</p>
        </div>
      </div>
    </div>
  );
}
