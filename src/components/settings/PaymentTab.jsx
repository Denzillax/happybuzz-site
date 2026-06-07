"use client";
import { colors } from "@/lib/theme";
import { Lock } from "lucide-react";
import { Section, Input, Btn } from "./shared";
const C = colors;

  export default function PaymentTab({ form, updateForm, saving, saveProfile, showToast }) {
  return (
    <>
      <Section title="BANKVERBINDUNG" description="Deine IBAN wird Käufern nach einem bestätigten Kauf angezeigt, damit sie per Überweisung bezahlen können.">
        <Input
          label="IBAN"
          placeholder="CH93 0076 2011 6238 5295 7"
          value={form.iban}
          onChange={v => updateForm("iban", v)}
          suffix={<Lock size={14} />}
        />
      </Section>
      <div style={{
        padding: 14, background: C.cream, borderRadius: 10,
        border: `1px solid ${C.border}`, marginBottom: 20,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <Lock size={16} color={C.muted} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
          Deine IBAN wird verschlüsselt gespeichert und nur Käufern nach einem bestätigten Kauf angezeigt. Weitere Zahlungsmethoden (TWINT, Stripe) folgen.
        </div>
      </div>
      <Btn loading={saving} onClick={() => {
        const clean = (form.iban || "").replace(/\s/g, "");
        if (!clean) { saveProfile({ iban: "" }); return; }
        if (!clean.startsWith("CH") || clean.length !== 21) {
          showToast("Ungültige IBAN. Muss mit CH beginnen und 21 Zeichen lang sein");
          return;
        }
        saveProfile({ iban: clean });
      }} style={{ width: "100%" }}>
        IBAN speichern
      </Btn>
    </>
  )
}
