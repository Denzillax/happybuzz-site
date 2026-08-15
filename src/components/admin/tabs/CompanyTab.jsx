"use client";
import { useState } from "react";
import { colors, fonts, radius } from "@/lib/theme";

const FIELDS = [
  { group: "Firma", items: [["name", "Firmenname"], ["uid", "UID / MwSt-Nr (CHE-…)"]] },
  { group: "Adresse", items: [["street", "Strasse + Nr."], ["postal_code", "PLZ"], ["city", "Ort"], ["country", "Land"]] },
  { group: "Zahlung", items: [["iban", "IBAN"]] },
  { group: "Kontakt", items: [["contact_email", "E-Mail"], ["contact_phone", "Telefon"]] },
];

export function CompanyTab({ admin }) {
  const { company, saveCompany } = admin;
  const [form, setForm] = useState(company);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const ibanClean = (form.iban || "").replace(/\s/g, "").toUpperCase();
  const ibanOk = ibanClean === "" || /^(CH|LI)[0-9A-Z]{19}$/.test(ibanClean);
  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 18px" }}>Diese Angaben erscheinen als Empfänger auf den Gebühren-QR-Rechnungen (FEE).</p>
      {FIELDS.map(g => (
        <div key={g.group} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 10 }}>{g.group}</div>
          <div style={{ display: "grid", gridTemplateColumns: g.items.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
            {g.items.map(([k, label]) => (
              <label key={k} style={{ fontSize: 12, fontWeight: 600, color: colors.dark }}>
                {label}
                <input value={form[k] || ""} onChange={e => set(k, e.target.value)} style={{ width: "100%", marginTop: 4, border: `1px solid ${k === "iban" && !ibanOk ? "#EB5E55" : colors.border}`, borderRadius: 0, padding: "9px 11px", fontSize: 13, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
                {k === "iban" && !ibanOk && <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "#EB5E55" }}>IBAN sollte mit CH/LI beginnen (21 Zeichen).</span>}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => saveCompany({ ...form, iban: ibanClean })} style={{ padding: "10px 22px", borderRadius: 999, border: "none", background: colors.teal, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
    </div>
  );
}
