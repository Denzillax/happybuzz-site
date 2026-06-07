"use client";
import { colors } from "@/lib/theme";
import { Check, Shield, MapPin, Lock } from "lucide-react";
import { Section, TrustMeter } from "./shared";
const C = colors;

  export default function VerifyTab({ profile, emailSending, setEmailSending, supabase, showToast, setActiveTab, idUploading, setIdUploading, setProfile }) {
  const emailVerified = !!profile?.is_verified;
    const phoneVerified = !!profile?.phone;
    const addressVerified = !!(profile?.street && profile?.postal_code && profile?.city);
    const idVerified = !!profile?.id_verified;
    const trustCount = [emailVerified, phoneVerified, addressVerified, idVerified].filter(Boolean).length;
  return (
    <>
      <TrustMeter level={trustCount} />
      <div style={{ height: 20 }} />
      <Section
        title="VERIFIZIERUNGEN"
        description={`${trustCount}/4 verifiziert. Je mehr, desto höher dein Trust Level.`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* 1. E-Mail */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10,
            background: emailVerified ? C.greenSoft : C.cream,
            border: `1px solid ${emailVerified ? "#B8D8B8" : C.border}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: emailVerified ? C.green : C.border, color: emailVerified ? "#fff" : C.muted, flexShrink: 0 }}>
              {emailVerified ? <Check size={18} /> : <Shield size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>E-Mail-Adresse</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{emailVerified ? "Bestätigt" : "Bestätigungsmail prüfen oder erneut senden"}</div>
            </div>
            {emailVerified ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: C.green, color: "#fff" }}>Verifiziert</span>
            ) : (
              <button onClick={async () => {
                setEmailSending(true);
                await supabase.auth.resend({ type: "signup", email: profile?.email });
                setEmailSending(false);
                showToast("Bestätigungsmail gesendet");
              }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.yellow, color: C.dark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif", opacity: emailSending ? 0.5 : 1 }}>
                {emailSending ? "Sende..." : "Mail senden"}
              </button>
            )}
          </div>

          {/* 2. Telefon */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10,
            background: phoneVerified ? C.greenSoft : C.cream,
            border: `1px solid ${phoneVerified ? "#B8D8B8" : C.border}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: phoneVerified ? C.green : C.border, color: phoneVerified ? "#fff" : C.muted, flexShrink: 0 }}>
              {phoneVerified ? <Check size={18} /> : <Shield size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Telefonnummer</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{phoneVerified ? `${profile.phone.slice(0, 7)}*** bestätigt` : "Unter Adresse hinterlegen"}</div>
            </div>
            {phoneVerified ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: C.green, color: "#fff" }}>Verifiziert</span>
            ) : (
              <button onClick={() => setActiveTab("address")} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: C.dark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
                Hinterlegen
              </button>
            )}
          </div>

          {/* 3. Postadresse */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10,
            background: addressVerified ? C.greenSoft : C.cream,
            border: `1px solid ${addressVerified ? "#B8D8B8" : C.border}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: addressVerified ? C.green : C.border, color: addressVerified ? "#fff" : C.muted, flexShrink: 0 }}>
              {addressVerified ? <Check size={18} /> : <MapPin size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Postadresse</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{addressVerified ? `${profile.street}, ${profile.postal_code} ${profile.city}` : "Vollständige Adresse hinterlegen"}</div>
            </div>
            {addressVerified ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: C.green, color: "#fff" }}>Verifiziert</span>
            ) : (
              <button onClick={() => setActiveTab("address")} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: C.dark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
                Ausfüllen
              </button>
            )}
          </div>

          {/* 4. Identität (ID) */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10,
            background: idVerified ? C.greenSoft : profile?.id_document_url ? C.yellowSoft : C.cream,
            border: `1px solid ${idVerified ? "#B8D8B8" : profile?.id_document_url ? "#F0D68A" : C.border}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: idVerified ? C.green : profile?.id_document_url ? C.yellow : C.border, color: idVerified ? "#fff" : profile?.id_document_url ? C.dark : C.muted, flexShrink: 0 }}>
              {idVerified ? <Check size={18} /> : <Shield size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Identität (ID)</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {idVerified ? "ID verifiziert" : profile?.id_document_url ? "Wird geprüft, wir melden uns" : "Pass oder ID hochladen"}
              </div>
            </div>
            {idVerified ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: C.green, color: "#fff" }}>Verifiziert</span>
            ) : profile?.id_document_url ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: C.yellow, color: C.dark }}>Wird geprüft</span>
            ) : (
              <label style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.yellow, color: C.dark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif", opacity: idUploading ? 0.5 : 1 }}>
                {idUploading ? "Lädt..." : "ID hochladen"}
                <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIdUploading(true);
                  const ext = file.name.split(".").pop();
                  const path = `${profile.id}/id-document.${ext}`;
                  const { error: upErr } = await supabase.storage.from("id-documents").upload(path, file, { upsert: true });
                  if (!upErr) {
                    const { data: urlData } = await supabase.storage.from("id-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
                    const docUrl = urlData?.signedUrl || path;
                    await supabase.from("profiles").update({ id_document_url: docUrl }).eq("id", profile.id);
                    setProfile(prev => ({ ...prev, id_document_url: docUrl }));
                    showToast("ID hochgeladen. Wird vom Admin geprüft");
                  } else {
                    showToast("Upload fehlgeschlagen");
                  }
                  setIdUploading(false);
                }} />
              </label>
            )}
          </div>
        </div>
      </Section>

      <div style={{
        padding: 16, background: C.cream, borderRadius: 10,
        border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <Lock size={18} color={C.muted} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 2 }}>Deine Daten sind sicher</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Persönliche Daten werden verschlüsselt gespeichert und nie an Dritte weitergegeben.
            Nur Verifizierungs-Badges sind öffentlich.
          </div>
        </div>
      </div>
    </>
  )
}
