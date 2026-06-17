"use client";
import { useState } from "react";
import { Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";

// ── Katalog-Design-Tokens ──
const INK = "#14110D";
const SAND = "#ECE3D2";
const PAPER = "#FBF8F2";
const PETROL = "#0B5E5C";
const MOSS = "#5B8C5A";
const MUTED = "rgba(20,17,13,0.6)";
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const BODY = "'Manrope', system-ui, sans-serif";

const labelStyle = { fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "11px 13px", borderRadius: 8, border: `1.5px solid ${INK}`, fontSize: 14, fontFamily: BODY, outline: "none", boxSizing: "border-box", background: "#fff", color: INK };
const sideCard = { background: "#fff", borderRadius: 12, border: `1px solid ${INK}`, padding: 20, marginBottom: 14 };

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const ready = form.name && form.email && form.message;

  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>

      {/* ── Hero ── */}
      <div style={{
        background: SAND, padding: "56px 24px 52px", textAlign: "center",
        borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 10 }}>Schreib uns</div>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>Kontakt</h1>
        <p style={{ fontSize: 15, color: MUTED, margin: 0 }}>Fragen, Feedback oder Probleme? Wir helfen dir gerne.</p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "44px 24px 80px" }}>
        <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>

          {/* Form */}
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${INK}`, padding: 28 }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "44px 0" }}>
                <CheckCircle size={46} color={MOSS} style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: HEAD, color: INK, margin: "0 0 8px" }}>Nachricht gesendet</h3>
                <p style={{ fontSize: 14, color: MUTED }}>Wir melden uns innerhalb von 24 Stunden bei dir.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dein Name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>E-Mail</label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="deine@email.ch" type="email" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Betreff</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={inputStyle}>
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
                  <label style={labelStyle}>Nachricht</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Beschreibe dein Anliegen..." style={{ ...inputStyle, minHeight: 140, resize: "vertical" }} />
                </div>
                <button onClick={() => { if (ready) setSent(true); }} className="bd-btn" style={{
                  width: "100%", padding: "14px", borderRadius: 10, border: `1.5px solid ${INK}`,
                  background: ready ? INK : "#cfcabf",
                  color: ready ? PAPER : "#8a857c", fontSize: 14.5, fontWeight: 700, cursor: ready ? "pointer" : "default",
                  fontFamily: BODY, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Send size={16} /> Nachricht senden
                </button>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={sideCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Mail size={16} color={PETROL} />
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: HEAD }}>E-Mail</span>
              </div>
              <a href="mailto:support@beedaro.ch" style={{ fontSize: 14, color: PETROL, fontWeight: 700, textDecoration: "none" }}>support@beedaro.ch</a>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Antwort innerhalb von 24 Stunden</p>
            </div>
            <div style={sideCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <MapPin size={16} color={PETROL} />
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: HEAD }}>Adresse</span>
              </div>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>BEEDARO<br />Gemeindehausstrasse 11B<br />6010 Kriens, Schweiz</p>
            </div>
            <div style={{ ...sideCard, marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Clock size={16} color={PETROL} />
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: HEAD }}>Erreichbarkeit</span>
              </div>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>Mo bis Fr: 09:00 - 18:00<br />Sa und So: geschlossen</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 760px) { .contact-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
