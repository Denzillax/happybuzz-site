"use client";
import { useState } from "react";
import { colors } from "@/lib/theme";
import { Camera, Eye, Percent } from "lucide-react";
import { BeeLevelCard } from "@/components/shared/BeeLevel";
import { Section, Input, Btn } from "./shared";
import { supabase } from "@/lib/supabase/supabase";
const C = colors;

  export default function ProfileTab({ form, updateForm, profile, saving, saveProfile, fileInputRef, handleAvatarUpload, setShowPublicProfile }) {
    const initial = (form.display_name || profile?.username || "?")[0].toUpperCase();
    const [bundleMin, setBundleMin] = useState(String(profile?.bundle_min_items || ""));
    const [bundlePct, setBundlePct] = useState(String(profile?.bundle_discount_pct || ""));
    const [bundleSaving, setBundleSaving] = useState(false);
    const [bundleSaved, setBundleSaved] = useState(false);
    const saveBundle = async () => {
      if (!profile?.id) return;
      setBundleSaving(true);
      try {
        await supabase.from("profiles").update({
          bundle_min_items: parseInt(bundleMin) || 0,
          bundle_discount_pct: Math.min(90, parseInt(bundlePct) || 0),
        }).eq("id", profile.id);
        setBundleSaved(true); setTimeout(() => setBundleSaved(false), 2500);
      } catch (e) { console.error(e); } finally { setBundleSaving(false); }
    };
    return (
      <>
        {/* Bee-Level */}
        <div style={{ marginBottom: 20 }}>
          <BeeLevelCard xp={profile?.xp_total || 0} />
        </div>

        <Section title="ÖFFENTLICHES PROFIL" description="So sehen andere dich auf BEEDARO.">
          {/* Avatar card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20, padding: 20,
            background: C.cream, borderRadius: 12, marginBottom: 20,
          }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
                background: profile?.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : `linear-gradient(135deg, ${C.yellow}, #E8A820)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: C.dark,
                fontFamily: "'General Sans', sans-serif",
              }}>
                {!profile?.avatar_url && initial}
              </div>
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 28, height: 28, borderRadius: "50%",
                background: C.yellow, border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Camera size={13} /></div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.dark }}>
                {form.display_name || profile?.username || "—"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                Mitglied seit {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("de-CH", { month: "long", year: "numeric" })
                  : "—"}
              </div>
              <button
                onClick={() => setShowPublicProfile(true)}
                style={{
                  marginTop: 6, padding: "4px 0", fontSize: 12,
                  color: C.yellow, background: "none", border: "none",
                  cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Eye size={13} /> Öffentliches Profil ansehen
              </button>
            </div>
          </div>

          <Input
            label="Anzeigename"
            value={form.display_name}
            onChange={v => updateForm("display_name", v)}
            maxLength={30}
          />
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 700, color: C.muted,
              marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px",
            }}>Über mich</label>
            <textarea
              value={form.bio}
              onChange={e => updateForm("bio", e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Erzähl was über dich – was verkaufst du gerne?"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 8,
                border: `1.5px solid ${C.border}`, background: "#fff",
                fontSize: 14, fontFamily: "'Manrope', sans-serif",
                color: C.dark, resize: "vertical", outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => { e.target.style.borderColor = C.yellow; }}
              onBlur={e => { e.target.style.borderColor = C.border; }}
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: "right" }}>
              {(form.bio || "").length}/200
            </div>
          </div>
        </Section>

        <Section title="MENGENRABATT" description="Belohne Käufer, die mehrere deiner Artikel zusammen im Warenkorb kaufen.">
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Input label="Ab Anzahl Artikel" value={bundleMin} onChange={setBundleMin} placeholder="z.B. 3" />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Rabatt in %" value={bundlePct} onChange={setBundlePct} placeholder="z.B. 10" />
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px" }}>
            <Percent size={12} style={{ verticalAlign: "text-bottom" }} /> {parseInt(bundleMin) > 0 && parseInt(bundlePct) > 0
              ? `Ab ${parseInt(bundleMin)} Artikeln erhalten Käufer ${Math.min(90, parseInt(bundlePct))}% Rabatt.`
              : "Leer lassen, um keinen Mengenrabatt anzubieten."}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Btn loading={bundleSaving} onClick={saveBundle}>Mengenrabatt speichern</Btn>
            {bundleSaved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Gespeichert</span>}
          </div>
        </Section>

        <Btn
          loading={saving}
          onClick={() => saveProfile({
            display_name: form.display_name,
            bio: form.bio,
          })}
          style={{ width: "100%" }}
        >
          Änderungen speichern
        </Btn>
      </>
    );
  };

