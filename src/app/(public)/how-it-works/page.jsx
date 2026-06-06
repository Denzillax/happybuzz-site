"use client";
import Link from "next/link";
import { Camera, Tag, ShoppingBag, Truck, Star, ArrowRight, Shield, CreditCard, Gavel, Home, Gift } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";

const STEPS_SELL = [
  { icon: Camera, num: "1", title: "Fotografieren", desc: "Mach ein paar Fotos von deinem Artikel. Das Hauptbild entscheidet. Mach es gut." },
  { icon: Tag, num: "2", title: "Inserieren", desc: "Titel, Beschreibung, Kategorie und Preis. Wähle zwischen Festpreis, Auktion, Vermieten oder Verschenken." },
  { icon: ShoppingBag, num: "3", title: "Verkaufen", desc: "Ein Käufer kauft, bietet oder bucht deinen Artikel. Du wirst sofort benachrichtigt." },
  { icon: Truck, num: "4", title: "Versenden", desc: "Versende per Post oder vereinbare eine Abholung. Der Käufer bezahlt per Überweisung oder TWINT." },
  { icon: Star, num: "5", title: "Bewerten", desc: "Nach der Transaktion bewertet ihr euch gegenseitig. Gute Bewertungen = mehr Vertrauen." },
];

const STEPS_BUY = [
  { icon: ShoppingBag, num: "1", title: "Stöbern", desc: "Durchsuche tausende Artikel nach Kategorie, Preis, Zustand oder Standort." },
  { icon: CreditCard, num: "2", title: "Kaufen oder Bieten", desc: "Sofort kaufen zum Festpreis oder bei Auktionen mitbieten. Bei Vermietung: Zeitraum wählen und buchen." },
  { icon: Truck, num: "3", title: "Erhalten", desc: "Dein Artikel wird per Post versendet oder du holst ihn direkt beim Verkäufer ab." },
  { icon: Star, num: "4", title: "Bewerten", desc: "Bestätige den Empfang und bewerte den Verkäufer. So hilfst du der Community." },
];

const TYPES = [
  { icon: Tag, title: "Festpreis", desc: "Sofort kaufen zum festen Preis. Ideal für Artikel mit klarem Marktwert.", color: colors.yellow },
  { icon: Gavel, title: "Auktion", desc: "Bieten lassen und den besten Preis erzielen. Perfekt für Sammlerstücke und Raritäten.", color: "#94B9C9" },
  { icon: Home, title: "Vermieten", desc: "Artikel zeitweise vermieten statt verkaufen. Ideal für Werkzeuge, Geräte, Sportartikel.", color: "#8B6DB0" },
  { icon: Gift, title: "Verschenken", desc: "Gratis abgeben statt wegwerfen. Nur Abholung, keine Gebühren.", color: "#5B8C5A" },
];

function StepCard({ step, index, total }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", display: "flex",
          alignItems: "center", justifyContent: "center",
          background: colors.yellow, color: colors.dark,
          fontSize: 16, fontWeight: 900, fontFamily: fonts.head,
        }}>
          {step.num}
        </div>
        {index < total - 1 && <div style={{ width: 2, height: 32, background: colors.border, margin: "4px 0" }} />}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <step.icon size={16} color={colors.yellow} />
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{step.title}</h3>
        </div>
        <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.dark} 0%, #2a2520 100%)`,
        padding: "56px 20px 64px", textAlign: "center", color: "#fff",
      }}>
        <BeeIcon size={36} color={colors.yellow} />
        <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: fonts.head, margin: "12px 0 8px", letterSpacing: ".03em" }}>
          So funktioniert BEEDARO
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", maxWidth: 500, margin: "0 auto" }}>
          Kaufen, verkaufen, mieten, verschenken. In 5 einfachen Schritten.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* 4 Inserattypen */}
        <div style={{ margin: "40px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>4 Wege</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Was möchtest du tun?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {TYPES.map((t, i) => (
              <div key={i} style={{
                padding: 20, borderRadius: 12, background: "#fff",
                border: `1px solid ${colors.border}`, textAlign: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, margin: "0 auto 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${t.color}18`,
                }}>
                  <t.icon size={20} color={t.color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>{t.title}</h3>
                <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Verkaufen Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, margin: "48px 0" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Für Verkäufer</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 24px" }}>In 5 Schritten verkaufen</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS_SELL.map((s, i) => <StepCard key={i} step={s} index={i} total={STEPS_SELL.length} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Für Käufer</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 24px" }}>In 4 Schritten kaufen</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS_BUY.map((s, i) => <StepCard key={i} step={s} index={i} total={STEPS_BUY.length} />)}
            </div>
          </div>
        </div>

        {/* Bee-Rate Erklärung */}
        <div style={{
          padding: 28, borderRadius: 16, background: "#fff",
          border: `1px solid ${colors.border}`, margin: "32px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <BeeIcon size={24} color={colors.yellow} />
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Die Bee-Rate: Deine Gebühr, deine Wahl</h2>
          </div>
          <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.7, marginBottom: 16 }}>
            Inserieren ist kostenlos. Erst bei erfolgreichem Verkauf fällt die selbst gewählte Bee-Rate an.
            Du entscheidest, wie viel du beitragen möchtest. Das bestimmt auch, wie sichtbar dein Inserat wird.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Fair", pct: "3%", desc: "Einstiegstarif" },
              { label: "Supporter", pct: "5%", desc: "Empfohlen" },
              { label: "Impact", pct: "7%", desc: "Top-Platzierung" },
              { label: "Bee Hero", pct: "10%", desc: "Maximale Power" },
            ].map((r, i) => (
              <div key={i} style={{
                padding: 14, borderRadius: 10, textAlign: "center",
                background: i === 1 ? colors.yellowSoft : colors.cream,
                border: `1.5px solid ${i === 1 ? colors.yellow : colors.border}`,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>{r.pct}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            20% jeder Gebühr fliessen als Bee-Impact in Schweizer Naturschutzprojekte.
          </p>
        </div>

        {/* Sicherheit */}
        <div style={{
          padding: 28, borderRadius: 16, margin: "32px 0",
          background: `linear-gradient(135deg, ${colors.dark} 0%, #2a2520 100%)`, color: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Shield size={22} color={colors.yellow} />
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Sicher handeln auf BEEDARO</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { title: "Trust Level", desc: "Verifiziere dein Konto und zeige anderen, dass du vertrauenswürdig bist." },
              { title: "Bewertungen", desc: "Nach jeder Transaktion bewerten sich Käufer und Verkäufer gegenseitig." },
              { title: "Melden", desc: "Verdächtige Inserate können jederzeit gemeldet werden. Unser Team prüft jede Meldung." },
            ].map((s, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,.06)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px" }}>Bereit?</h2>
          <p style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>Dein Keller hat Inventar. Wir haben Käufer.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/listings/new" style={{
              padding: "14px 28px", borderRadius: 8, background: colors.yellow,
              color: colors.dark, fontSize: 14, fontWeight: 700, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              Jetzt inserieren <ArrowRight size={16} />
            </Link>
            <Link href="/search" style={{
              padding: "14px 28px", borderRadius: 8, background: "#fff",
              border: `1.5px solid ${colors.border}`,
              color: colors.dark, fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>
              Stöbern
            </Link>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 700px) { .hiw-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
