"use client";
import { useState } from "react";
import { Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Mail size={32} color={colors.yellow} style={{ marginBottom: 8 }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: fonts.head, margin: "0 0 8px" }}>Kontakt</h1>
          <p style={{ fontSize: 15, color: colors.muted }}>Fragen, Feedback oder Probleme? Wir helfen dir gerne.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
          {/* Form */}
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: 28 }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <CheckCircle size={48} color={colors.green} style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>Nachricht gesendet</h3>
                <p style={{ fontSize: 14, color: colors.muted }}>Wir melden uns innerhalb von 24 Stunden bei dir.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Name</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dein Name" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>E-Mail</label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="deine@email.ch" type="email" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Betreff</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                    <option value="">Bitte wählen...</option>
                    <option value="account">Mein Konto</option>
                    <option value="buy">Frage zum Kauf</option>
                    <option value="sell">Frage zum Verkauf</option>
                    <option value="fees">Gebühren & Zahlung</option>
                    <option value="report">Meldung / Betrug</option>
                    <option value="bug">Technisches Problem</option>
                    <option value="feedback">Feedback & Vorschläge</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Nachricht</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Beschreibe dein Anliegen..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", minHeight: 140, resize: "vertical" }} />
                </div>
                <button onClick={() => { if (form.name && form.email && form.message) setSent(true); }} style={{
                  width: "100%", padding: "14px", borderRadius: 8, border: "none",
                  background: form.name && form.email && form.message ? colors.yellow : "#ddd",
                  color: colors.dark, fontSize: 14, fontWeight: 700, cursor: form.name && form.email && form.message ? "pointer" : "default",
                  fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <Send size={16} /> Nachricht senden
                </button>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Mail size={16} color={colors.yellow} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>E-Mail</span>
              </div>
              <a href="mailto:support@beedaro.ch" style={{ fontSize: 14, color: colors.yellow, fontWeight: 600, textDecoration: "none" }}>support@beedaro.ch</a>
              <p style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Antwort innerhalb von 24 Stunden</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <MapPin size={16} color={colors.yellow} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Adresse</span>
              </div>
              <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, margin: 0 }}>BEEDARO<br />Gemeindehausstrasse 11B<br />6010 Kriens, Schweiz</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Clock size={16} color={colors.yellow} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Erreichbarkeit</span>
              </div>
              <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, margin: 0 }}>Mo-Fr: 09:00 - 18:00<br />Sa-So: Geschlossen</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 700px) { .contact-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
