"use client";
import Link from "next/link";
import { FileText } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function TermsPage() {
  const S = { h2: { fontSize: 18, fontWeight: 800, margin: "32px 0 12px", color: colors.dark }, p: { fontSize: 14, color: colors.muted, lineHeight: 1.7, margin: "0 0 12px" } };
  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <FileText size={24} color={colors.yellow} />
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: fonts.head, margin: 0 }}>Allgemeine Geschäftsbedingungen</h1>
        </div>
        <p style={{ fontSize: 13, color: colors.muted, marginBottom: 32 }}>Gültig ab 1. Juni 2026 · BEEDARO, Gemeindehausstrasse 11B, 6010 Kriens</p>

        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: "28px 28px 20px" }}>
          <h2 style={S.h2}>1. Geltungsbereich</h2>
          <p style={S.p}>Diese AGB regeln die Nutzung der Plattform BEEDARO (beedaro.ch). Mit der Registrierung akzeptiert der Nutzer diese Bedingungen. BEEDARO ist ein Schweizer Peer-to-Peer Marktplatz für den Kauf, Verkauf, die Vermietung und das Verschenken von Secondhand-Artikeln.</p>

          <h2 style={S.h2}>2. Registrierung & Konto</h2>
          <p style={S.p}>Nutzer müssen mindestens 18 Jahre alt sein und ihren Wohnsitz in der Schweiz oder im Fürstentum Liechtenstein haben. Jede Person darf nur ein Konto besitzen. Die Angabe wahrheitsgemässer Daten ist Pflicht. BEEDARO behält sich das Recht vor, Konten bei Verstössen zu sperren.</p>

          <h2 style={S.h2}>3. Inserate & Inhalte</h2>
          <p style={S.p}>Verkäufer sind für die Richtigkeit ihrer Angaben verantwortlich. Verboten sind: illegale Waren, Waffen, Drogen, gefälschte Produkte, pornografische Inhalte und alles, was gegen Schweizer Recht verstösst. BEEDARO kann Inserate ohne Vorankündigung entfernen.</p>

          <h2 style={S.h2}>4. Bee-Rate & Gebühren</h2>
          <p style={S.p}>Das Erstellen von Inseraten ist kostenlos. Bei erfolgreichem Verkauf fällt die selbst gewählte Bee-Rate an (3%, 5%, 7% oder 10%). Die Gebühr wird vom Verkaufserlös abgezogen. 20% der Gebühr fliessen als Bee-Impact in Schweizer Naturschutzprojekte. Gebühren sind innerhalb von 30 Tagen zu begleichen.</p>

          <h2 style={S.h2}>5. Zahlung & Versand</h2>
          <p style={S.p}>Die Zahlung erfolgt direkt zwischen Käufer und Verkäufer per Banküberweisung, TWINT oder Barzahlung bei Abholung. BEEDARO ist nicht am Zahlungsprozess beteiligt und übernimmt keine Haftung für Zahlungsausfälle. Der Versand liegt in der Verantwortung des Verkäufers.</p>

          <h2 style={S.h2}>6. Bewertungen</h2>
          <p style={S.p}>Nach Abschluss einer Transaktion können beide Parteien eine Bewertung abgeben. Bewertungen müssen wahrheitsgemäss sein. Beleidigungen, Drohungen oder falsche Angaben führen zur Löschung der Bewertung und können Konsequenzen für das Konto haben.</p>

          <h2 style={S.h2}>7. Haftungsausschluss</h2>
          <p style={S.p}>BEEDARO vermittelt lediglich zwischen Käufern und Verkäufern. Für die Qualität, Echtheit und Zustand der angebotenen Artikel übernimmt BEEDARO keine Haftung. Streitigkeiten zwischen Nutzern sind direkt zu klären. BEEDARO stellt keine Garantie für die ununterbrochene Verfügbarkeit der Plattform.</p>

          <h2 style={S.h2}>8. Datenschutz</h2>
          <p style={S.p}>Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäss unserer <Link href="/privacy" style={{ color: colors.yellow, fontWeight: 700 }}>Datenschutzerklärung</Link> und dem Schweizer Datenschutzgesetz (DSG).</p>

          <h2 style={S.h2}>9. Änderungen der AGB</h2>
          <p style={S.p}>BEEDARO behält sich das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden per E-Mail und auf der Plattform angekündigt. Bei Weiternutzung nach Inkrafttreten gelten die neuen AGB als akzeptiert.</p>

          <h2 style={S.h2}>10. Gerichtsstand & Recht</h2>
          <p style={S.p}>Es gilt Schweizer Recht. Gerichtsstand ist Kriens, Kanton Luzern, Schweiz.</p>
        </div>
      </div>
    </div>
  );
}
