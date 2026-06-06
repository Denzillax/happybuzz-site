"use client";
import { Building } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

export default function ImprintPage() {
  const L = { fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 2 };
  const V = { fontSize: 14, color: colors.muted, lineHeight: 1.6, marginBottom: 16 };
  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <Building size={24} color={colors.yellow} />
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: fonts.head, margin: 0 }}>Impressum</h1>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 40px" }}>
            <div>
              <p style={L}>Betreiber</p>
              <p style={V}>BEEDARO<br />Denis Mihaljevic<br />Einzelunternehmen</p>
            </div>
            <div>
              <p style={L}>Adresse</p>
              <p style={V}>Gemeindehausstrasse 11B<br />6010 Kriens<br />Schweiz</p>
            </div>
            <div>
              <p style={L}>Kontakt</p>
              <p style={V}>E-Mail: info@beedaro.ch<br />Support: support@beedaro.ch</p>
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

          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20, marginTop: 8 }}>
            <p style={L}>Haftungsausschluss</p>
            <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6 }}>
              BEEDARO ist eine Vermittlungsplattform. Für die Inhalte der Inserate und die Abwicklung von Transaktionen zwischen Nutzern übernimmt BEEDARO keine Haftung. Trotz sorgfältiger Kontrolle übernehmen wir keine Gewähr für die Richtigkeit externer Links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
