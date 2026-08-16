"use client"
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Shield, CreditCard, MapPin, Landmark, Bell,
  Check, Camera, Eye, Lock, AlertTriangle, Pencil,
  Star, X, Loader2, ChevronRight, ExternalLink, BadgeCheck,
} from "lucide-react";
import { BeeLevelCard } from "@/components/shared/BeeLevel";

const C = colors; // Alias for brevity in this file

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#ECE3D2", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#5B8C5A" };
const MONO = "'Space Mono', monospace";

import FeeModel from "@/components/listings/FeeModel";
import { FEE_TIERS } from "@/lib/constants";
import { Input, Toggle, Btn, Section, TrustMeter } from "@/components/settings/ui";

const TABS = [
  { id: "profile",        label: "Profil",              icon: User },
  { id: "verify",         label: "Verifizierung",       icon: Shield },
  { id: "payment",        label: "Zahlung",             icon: CreditCard },
  { id: "address",        label: "Adresse",             icon: MapPin },
  { id: "notifications",  label: "Benachrichtigungen",  icon: Bell },
];


// ═══════════════════════════════════════════════════════════════
// PUBLIC PROFILE MODAL
// ═══════════════════════════════════════════════════════════════

function PublicProfileModal({ profile, onClose }) {
  if (!profile) return null;
  const initial = (profile.display_name || profile.username || "?")[0].toUpperCase();

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(25,22,21,.6)",
        backdropFilter: "blur(6px)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn .25s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 0, width: "100%", maxWidth: 440,
          padding: 32, position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          animation: "slideUp .3s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12, background: "none",
          border: "none", fontSize: 22, color: C.muted, cursor: "pointer",
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
        }}><X size={20} /></button>

        {/* Avatar + Name */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12",
            background: profile.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : `linear-gradient(135deg, ${C.yellow}, #E8A820)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: C.dark,
            fontFamily: "'General Sans', sans-serif",
            border: "3px solid #fff", boxShadow: "0 4px 16px rgba(244,192,63,.3)",
          }}>
            {!profile.avatar_url && initial}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <h2 style={{ fontFamily: "'General Sans', sans-serif", fontSize: 22, margin: 0, color: C.dark }}>
              {profile.display_name || profile.username}
            </h2>
            {profile.is_verified && (
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: C.green,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Check size={12} color="#fff" /></div>
            )}
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Mitglied seit {new Date(profile.created_at).toLocaleDateString("de-CH", { month: "long", year: "numeric" })}
            {profile.city && ` · ${profile.city}`}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 32, marginBottom: 20,
          padding: "16px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        }}>
          {[
            [profile.listings_count ?? 0, "Inserate"],
            [profile.sales_count ?? 0, "Verkäufe"],
            [profile.rating_avg ?? "–", "Bewertung"],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, fontFamily: "'General Sans', sans-serif" }}>{v}</div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.6, textAlign: "center", margin: "0 0 20px" }}>
            {profile.bio}
          </p>
        )}

        {/* Verification badges */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {profile.is_verified && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 0, fontSize: 11, fontWeight: 700,
              background: C.greenSoft, color: C.green,
            }}><Check size={10} /> Verifiziert</span>
          )}
        </div>

        {/* Rating stars */}
        {profile.rating_count > 0 && (
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={16}
                fill={i <= Math.round(profile.rating_avg) ? C.yellow : "none"}
                color={C.yellow} strokeWidth={2}
              />
            ))}
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>
              ({profile.rating_avg}) · {profile.rating_count} Bewertungen
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addrResults, setAddrResults] = useState([]);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [editAddrIdx, setEditAddrIdx] = useState(null);
  const [extraAddrHits, setExtraAddrHits] = useState([]);
  const [newAddr, setNewAddr] = useState({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [idUploading, setIdUploading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPublicProfile, setShowPublicProfile] = useState(false);

  // ── Profile state ──
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    display_name: "",
    account_type: "private",
    company_name: "",
    company_uid: "",
    bio: "",
    phone: "",
    first_name: "",
    last_name: "",
    street: "",
    city: "",
    canton: "",
    postal_code: "",
    iban: "",
    bee_rate_tier: "basic",
    is_billing_address: true,
    extra_addresses: [],
    // Notifications — Ricardo-style per category with email/push
    noti: {
      // Kaufen
      buy_outbid:       { email: true,  push: true },
      buy_auction_end:  { email: true,  push: true },
      buy_won:          { email: true,  push: true },
      buy_payment:      { email: true,  push: false },
      // Verkaufen
      sell_new_bid:     { email: true,  push: true },
      sell_question:    { email: true,  push: true },
      sell_sold:        { email: true,  push: true },
      sell_expiring:    { email: true,  push: false },
      sell_report:      { email: true,  push: false },
      // Nachrichten
      msg_new:          { email: true,  push: true },
      msg_offer:        { email: true,  push: true },
      // Bewertungen
      review_received:  { email: true,  push: true },
      review_reminder:  { email: true,  push: false },
      // Favoriten & Suche
      fav_price_change: { email: false, push: false },
      fav_sold:         { email: false, push: false },
      search_new_match: { email: true,  push: false },
      // Allgemein
      gen_newsletter:   { email: false, push: false },
      gen_tips:         { email: false, push: false },
      gen_promo:        { email: false, push: false },
    },
  });

  const fileInputRef = useRef(null);

  // ── Toast helper ──
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Load profile ──
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Profile load error:", error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setForm(prev => ({
        ...prev,
        display_name: data.display_name ?? "",
        account_type: data.account_type ?? "private",
        company_name: data.company_name ?? "",
        company_uid: data.company_uid ?? "",
        bio: data.bio ?? "",
        phone: data.phone ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        city: data.city ?? "",
        canton: data.canton ?? "",
        postal_code: data.postal_code ?? "",
        street: data.street ?? "",
        iban: data.iban ?? "",
        bee_rate_tier: data.bee_rate_tier ?? "starter",
        ...(data.notification_settings && Object.keys(data.notification_settings).length > 0
          ? { noti: { ...prev.noti, ...data.notification_settings } }
          : {}),
      }));
      setLoading(false);
    }
    load();

    // Load saved addresses
    async function loadAddresses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).order("created_at");
      setSavedAddresses(data || []);
    }
    loadAddresses();
  }, [router]);

  // ── Update form ──
  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // ── Save profile ──
  const saveProfile = async (fields) => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // IBAN-Löschung verhindern wenn aktive Inserate existieren
    if ("iban" in fields && !fields.iban?.trim()) {
      const { count } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", session.user.id).in("status", ["active", "rented"]);
      if (count > 0) {
        setSaving(false);
        showToast("IBAN kann nicht gelöscht werden. Du hast aktive Inserate");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", session.user.id);

    setSaving(false);
    if (error) {
      showToast("Fehler beim Speichern ✗");
      console.error(error);
    } else {
      setProfile(prev => ({ ...prev, ...fields }));
      showToast("Gespeichert");
    }
  };

  // ── Avatar upload ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const ext = file.name.split(".").pop();
    const path = `avatars/${session.user.id}.${ext}`;

    showToast("Avatar wird hochgeladen…");

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      showToast("Upload fehlgeschlagen ✗");
      console.error(uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    await saveProfile({ avatar_url: publicUrl });
  };

  // ── Compute trust level ──
  const computeTrustLevel = () => {
    if (!profile) return 1;
    let level = 1;
    if (profile.is_verified) level++;
    if (profile.phone) level++;
    if (profile.city && profile.postal_code) level++;
    if (profile.sales_count >= 5) level++;
    return Math.min(level, 5);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: C.cream,
        fontFamily: "'Manrope', sans-serif",
      }}>
        <Loader2 size={32} color={C.yellow} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB CONTENTS
  // ═══════════════════════════════════════════════════════════════

  const ProfileTab = () => {
    const initial = (form.display_name || profile?.username || "?")[0].toUpperCase();
    return (
      <>
        {/* Bee-Level */}
        <div style={{ marginBottom: 20 }}>
          <BeeLevelCard xp={profile?.xp_total || 0} nektar={profile?.nektar ?? 0} />
        </div>

        <Section title="ÖFFENTLICHES PROFIL" description="So sehen andere dich auf BEEDARO.">
          {/* Avatar card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20, padding: 20,
            background: "#fff", border: `1px solid ${K.ink}`, borderRadius: 0, marginBottom: 20,
          }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
              <div style={{
                width: 72, height: 72, borderRadius: 0, overflow: "hidden", border: `1px solid ${K.ink}`,
                background: profile?.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : K.honey,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: K.ink,
                fontFamily: "'General Sans', sans-serif",
              }}>
                {!profile?.avatar_url && initial}
              </div>
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                width: 26, height: 26, borderRadius: 0,
                background: K.honey, border: `1px solid ${K.ink}`,
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
                  color: K.petrol, background: "none", border: "none",
                  cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3,
                  display: "flex", alignItems: "center", gap: 4,
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

          {/* Kontotyp: Privat / Unternehmen */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: "block", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: K.ink,
              marginBottom: 6, textTransform: "uppercase", letterSpacing: ".12em",
            }}>Kontotyp</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: "private", l: "Privat" }, { v: "business", l: "Unternehmen" }].map(o => {
                const active = form.account_type === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => updateForm("account_type", o.v)}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 0, cursor: "pointer",
                      border: `1px solid ${K.ink}`,
                      background: active ? K.honey : "#fff",
                      color: K.ink,
                      fontWeight: 700, fontSize: 14, fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {o.l}
                  </button>
                );
              })}
            </div>
          </div>

          {form.account_type === "business" && (
            <>
              <Input
                label="Firmenname"
                value={form.company_name}
                onChange={v => updateForm("company_name", v)}
                maxLength={80}
                placeholder="Muster GmbH"
              />
              <Input
                label="UID (optional)"
                value={form.company_uid}
                onChange={v => updateForm("company_uid", v)}
                maxLength={20}
                placeholder="CHE-123.456.789"
              />
            </>
          )}

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
                width: "100%", padding: "12px 14px", borderRadius: 0,
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

        <Btn
          loading={saving}
          onClick={() => {
            if (form.account_type === "business" && !form.company_name.trim()) {
              showToast("Firmenname ist für Unternehmen erforderlich");
              return;
            }
            saveProfile({
              display_name: form.display_name,
              bio: form.bio,
              account_type: form.account_type,
              company_name: form.account_type === "business" ? (form.company_name.trim() || null) : null,
              company_uid: form.account_type === "business" ? (form.company_uid.trim() || null) : null,
            });
          }}
          style={{ width: "100%" }}
        >
          Änderungen speichern
        </Btn>
      </>
    );
  };

  const emailVerified = !!profile?.is_verified;
  const phoneVerified = !!profile?.phone;
  const addressVerified = !!(profile?.street && profile?.postal_code && profile?.city);
  const idVerified = !!profile?.id_verified;
  const trustCount = [emailVerified, phoneVerified, addressVerified, idVerified].filter(Boolean).length;

  const VerifyTab = () => (
    <>
      {emailVerified && idVerified && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", marginBottom: 16, borderRadius: 0, background: "#EEF4EC", border: `1px solid ${K.moss}` }}>
          <BadgeCheck size={26} color={K.moss} strokeWidth={2.2} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: K.moss, fontFamily: "'General Sans','Manrope',sans-serif" }}>Du bist verifizierter Verkäufer</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 1 }}>Dein Ausweis und deine E-Mail sind bestätigt. Käufer sehen bei deinen Inseraten und deinem Profil das grüne „Verifiziert"-Abzeichen.</div>
          </div>
        </div>
      )}
      <TrustMeter level={trustCount} />
      <div style={{ height: 20 }} />
      <Section
        title="VERIFIZIERUNGEN"
        description={`${trustCount}/4 verifiziert. Je mehr, desto höher dein Trust Level.`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* 1. E-Mail */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 0,
            background: emailVerified ? "#EEF4EC" : "#fff",
            border: `1px solid ${K.ink}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 0, border: `1px solid ${K.ink}`, display: "flex", alignItems: "center", justifyContent: "center", background:emailVerified ? C.green : K.sand, color: emailVerified ? "#fff" : K.ink, flexShrink: 0 }}>
              {emailVerified ? <Check size={18} /> : <Shield size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>E-Mail-Adresse</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{emailVerified ? "Bestätigt" : "Bestätigungsmail prüfen oder erneut senden"}</div>
            </div>
            {emailVerified ? (
              <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 0, background: K.moss, color: "#fff" }}>Verifiziert</span>
            ) : (
              <button onClick={async () => {
                setEmailSending(true);
                await supabase.auth.resend({ type: "signup", email: profile?.email });
                setEmailSending(false);
                showToast("Bestätigungsmail gesendet");
              }} style={{ padding: "7px 14px", borderRadius: 0, border: `1px solid ${K.ink}`, background: K.honey, color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Manrope', sans-serif", opacity: emailSending ? 0.5 : 1 }}>
                {emailSending ? "Sende..." : "Mail senden"}
              </button>
            )}
          </div>

          {/* 2. Telefon */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 0,
            background: phoneVerified ? "#EEF4EC" : "#fff",
            border: `1px solid ${K.ink}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 0, border: `1px solid ${K.ink}`, display: "flex", alignItems: "center", justifyContent: "center", background:phoneVerified ? C.green : K.sand, color: phoneVerified ? "#fff" : K.ink, flexShrink: 0 }}>
              {phoneVerified ? <Check size={18} /> : <Shield size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Telefonnummer</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{phoneVerified ? `${profile.phone.slice(0, 7)}*** bestätigt` : "Unter Adresse hinterlegen"}</div>
            </div>
            {phoneVerified ? (
              <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 0, background: K.moss, color: "#fff" }}>Verifiziert</span>
            ) : (
              <button onClick={() => setActiveTab("address")} style={{ padding: "7px 14px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
                Hinterlegen
              </button>
            )}
          </div>

          {/* 3. Postadresse */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 0,
            background: addressVerified ? "#EEF4EC" : "#fff",
            border: `1px solid ${K.ink}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 0, border: `1px solid ${K.ink}`, display: "flex", alignItems: "center", justifyContent: "center", background:addressVerified ? C.green : K.sand, color: addressVerified ? "#fff" : K.ink, flexShrink: 0 }}>
              {addressVerified ? <Check size={18} /> : <MapPin size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Postadresse</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{addressVerified ? `${profile.street}, ${profile.postal_code} ${profile.city}` : "Vollständige Adresse hinterlegen"}</div>
            </div>
            {addressVerified ? (
              <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 0, background: K.moss, color: "#fff" }}>Verifiziert</span>
            ) : (
              <button onClick={() => setActiveTab("address")} style={{ padding: "7px 14px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
                Ausfüllen
              </button>
            )}
          </div>

          {/* 4. Identität (ID) */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 0,
            background: idVerified ? "#EEF4EC" : profile?.id_document_url ? "#FBF1D2" : "#fff",
            border: `1px solid ${K.ink}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 0, border: `1px solid ${K.ink}`, display: "flex", alignItems: "center", justifyContent: "center", background: idVerified ? C.green : profile?.id_document_url ? K.honey : K.sand, color: idVerified ? "#fff" : K.ink, flexShrink: 0 }}>
              {idVerified ? <Check size={18} /> : <Shield size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Identität (ID)</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {idVerified ? "ID verifiziert" : profile?.id_document_url ? "Wird geprüft, wir melden uns" : "Pass oder ID hochladen"}
              </div>
            </div>
            {idVerified ? (
              <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 0, background: K.moss, color: "#fff" }}>Verifiziert</span>
            ) : profile?.id_document_url ? (
              <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 0, border: `1px solid ${K.ink}`, background: K.honey, color: K.ink }}>Wird geprüft</span>
            ) : (
              <label style={{ padding: "7px 14px", borderRadius: 0, border: `1px solid ${K.ink}`, background: K.honey, color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Manrope', sans-serif", opacity: idUploading ? 0.5 : 1 }}>
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
        padding: 16, background: K.sand, borderRadius: 0,
        border: `1px solid ${K.ink}`, display: "flex", gap: 12, alignItems: "flex-start",
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
  );

  const PaymentTab = () => (
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
        padding: 14, background: K.sand, borderRadius: 0,
        border: `1px solid ${K.ink}`, marginBottom: 20,
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
  );

  const AddressTab = () => (
    <>
      <Section
        title="HAUPTADRESSE"
        description="Wird für Versand, Rechnungen und Verifizierung verwendet."
        badge={
          profile?.city && profile?.postal_code && profile?.street ? (
            <span style={{
              fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", color: "#fff",
              background: K.moss, padding: "4px 9px", borderRadius: 0,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}><Check size={10} /> Vollständig</span>
          ) : (
            <span style={{
              fontSize: 9.5, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", color: K.ink,
              background: K.honey, border: `1px solid ${K.ink}`, padding: "4px 9px", borderRadius: 0,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}><AlertTriangle size={10} /> Unvollständig</span>
          )
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Vorname"
            value={form.first_name || ""}
            onChange={v => updateForm("first_name", v)}
            placeholder="Denis"
          />
          <Input
            label="Nachname"
            value={form.last_name || ""}
            onChange={v => updateForm("last_name", v)}
            placeholder="Mihaljevic"
          />
        </div>
        <Input
          label="Telefonnummer"
          value={form.phone}
          onChange={v => updateForm("phone", v)}
          type="tel"
          placeholder="+41 79 123 45 67"
        />

        {/* Street with Autocomplete */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Strasse & Nr.</div>
          <div style={{ position: "relative" }}>
            <input
              value={form.street}
              onChange={async (e) => {
                const q = e.target.value;
                updateForm("street", q);
                if (q.length < 3) { setAddrResults([]); return; }
                try {
                  const res = await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(q)}&type=locations&limit=5&origins=address`);
                  const data = await res.json();
                  setAddrResults((data?.results || []).map(r => {
                    const raw = (r.attrs?.label || "").replace(/<[^>]+>/g, "").trim();
                    // Robust parsing: find 4-digit PLZ pattern to split street/plz/city
                    const m = raw.match(/^(.+?)\s*,?\s*(\d{4})\s+(.+)$/);
                    if (m) return { street: m[1].trim(), plz: m[2], city: m[3].trim() };
                    return { street: raw, plz: "", city: "" };
                  }));
                } catch { setAddrResults([]); }
              }}
              placeholder="Gemeindehausstrasse 11B"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 0,
                border: `1px solid ${K.ink}`, fontSize: 14, fontFamily: "'Manrope', sans-serif",
                color: K.ink, outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => { e.target.style.borderColor = C.yellow; }}
              onBlur={e => { setTimeout(() => { e.target.style.borderColor = C.border; setAddrResults([]); }, 200); }}
            />
            {addrResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${K.ink}`, borderRadius: 0, maxHeight: 200, overflowY: "auto", zIndex: 50, boxShadow: `4px 4px 0 ${K.ink}22` }}>
                {addrResults.map((r, i) => (
                  <div key={i} onClick={() => {
                    updateForm("street", r.street);
                    updateForm("postal_code", r.plz);
                    updateForm("city", r.city);
                    setAddrResults([]);
                  }} style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontWeight: 600 }}>{r.street}</span>
                    <span style={{ color: "#888", marginLeft: 6 }}>{r.plz} {r.city}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
          <Input
            label="PLZ"
            value={form.postal_code}
            onChange={v => updateForm("postal_code", v)}
            placeholder="6010"
          />
          <Input
            label="Ort"
            value={form.city}
            onChange={v => updateForm("city", v)}
            placeholder="Kriens"
          />
        </div>
        <Input label="Land" value="Schweiz" disabled />

        <Toggle
          checked={form.is_billing_address !== false}
          onChange={v => updateForm("is_billing_address", v)}
          label="Als Rechnungsadresse verwenden"
          description="Diese Adresse wird auf QR-Rechnungen und Belegen angezeigt"
        />
      </Section>

      <Btn
        loading={saving}
        onClick={() => saveProfile({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          street: form.street,
          postal_code: form.postal_code,
          city: form.city,
          canton: form.canton,
        })}
        style={{ width: "100%" }}
      >
        Adresse speichern
      </Btn>

      <div style={{ height: 20 }} />

      <Section
        title="WEITERE LIEFERADRESSEN"
        description="Beim Kauf, Auktionsgewinn oder Buchung als Lieferadresse wählbar."
      >
        {savedAddresses.map((addr, i) => (
          <div key={addr.id} style={{
            padding: 14, borderRadius: 0, border: `1px solid ${K.ink}`,
            marginBottom: 10, background: editAddrIdx === i ? "#FBF1D2" : "#fff",
          }}>
            {editAddrIdx === i ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: C.dark }}>Adresse bearbeiten</div>
                <Input label="Bezeichnung" value={newAddr.label} onChange={v => setNewAddr(p => ({ ...p, label: v }))} placeholder="z.B. Geschäft" />
                <Input label="Firma (optional)" value={newAddr.company} onChange={v => setNewAddr(p => ({ ...p, company: v }))} placeholder="Firma GmbH" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Vorname" value={newAddr.first_name} onChange={v => setNewAddr(p => ({ ...p, first_name: v }))} placeholder="Max" />
                  <Input label="Nachname" value={newAddr.last_name} onChange={v => setNewAddr(p => ({ ...p, last_name: v }))} placeholder="Muster" />
                </div>
                <div style={{ position: "relative" }}>
                  <Input label="Strasse & Nr." value={newAddr.street} onChange={async v => {
                    setNewAddr(p => ({ ...p, street: v }));
                    if (v.length < 3) { setExtraAddrHits([]); return; }
                    try {
                      const res = await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(v)}&type=locations&limit=5&origins=address`);
                      const data = await res.json();
                      setExtraAddrHits((data?.results || []).map(r => {
                        const raw = (r.attrs?.label || "").replace(/<[^>]+>/g, "").trim();
                        const m = raw.match(/^(.+?)\s*,?\s*(\d{4})\s+(.+)$/);
                        if (m) return { street: m[1].trim(), plz: m[2], city: m[3].trim() };
                        return { street: raw, plz: "", city: "" };
                      }));
                    } catch { setExtraAddrHits([]); }
                  }} placeholder="Bahnhofstrasse 1" />
                  {extraAddrHits.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${K.ink}`, borderRadius: 0, maxHeight: 160, overflowY: "auto", zIndex: 50, boxShadow: `4px 4px 0 ${K.ink}22` }}>
                      {extraAddrHits.map((r, j) => (
                        <div key={j} onClick={() => {
                          setNewAddr(p => ({ ...p, street: r.street, postal_code: r.plz, city: r.city }));
                          setExtraAddrHits([]);
                        }} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ fontWeight: 600 }}>{r.street}</span>
                          <span style={{ color: "#888", marginLeft: 6 }}>{r.plz} {r.city}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
                  <Input label="PLZ" value={newAddr.postal_code} onChange={v => setNewAddr(p => ({ ...p, postal_code: v }))} placeholder="8001" />
                  <Input label="Ort" value={newAddr.city} onChange={v => setNewAddr(p => ({ ...p, city: v }))} placeholder="Zürich" />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setEditAddrIdx(null); setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" }); setExtraAddrHits([]); }}
                    style={{ flex: 1, padding: "10px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Abbrechen</button>
                  <button onClick={async () => {
                    await supabase.from("user_addresses").update({ label: newAddr.label, company: newAddr.company, first_name: newAddr.first_name, last_name: newAddr.last_name, street: newAddr.street, postal_code: newAddr.postal_code, city: newAddr.city }).eq("id", addr.id);
                    setSavedAddresses(prev => prev.map((a, idx) => idx === i ? { ...a, ...newAddr } : a));
                    setEditAddrIdx(null); setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" }); setExtraAddrHits([]);
                    showToast("Adresse aktualisiert");
                  }} style={{ flex: 1, padding: "10px", borderRadius: 0, border: `1px solid ${K.ink}`, background: K.honey, color: K.ink, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Speichern</button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{addr.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                    {addr.company && <div>{addr.company}</div>}
                    {(addr.first_name || addr.last_name) && <div>{addr.first_name} {addr.last_name}</div>}
                    {addr.street && <div>{addr.street}</div>}
                    <div>{addr.postal_code} {addr.city}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditAddrIdx(i); setNewAddr({ label: addr.label || "", company: addr.company || "", first_name: addr.first_name || "", last_name: addr.last_name || "", street: addr.street || "", postal_code: addr.postal_code || "", city: addr.city || "" }); setShowAddAddr(false); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 11, fontWeight: 600 }}>Bearbeiten</button>
                  <button onClick={async () => {
                    await supabase.from("user_addresses").delete().eq("id", addr.id);
                    setSavedAddresses(prev => prev.filter(a => a.id !== addr.id));
                    showToast("Adresse entfernt");
                  }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: 11, fontWeight: 600 }}>Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Inline Add Form */}
        {showAddAddr && editAddrIdx === null ? (
          <div style={{ padding: 16, borderRadius: 0, border: `1px solid ${K.ink}`, background: "#FBF1D2", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.dark }}>Neue Adresse</div>
            <Input label="Bezeichnung" value={newAddr.label} onChange={v => setNewAddr(p => ({ ...p, label: v }))} placeholder="z.B. Geschäft, Büro" />
            <Input label="Firma (optional)" value={newAddr.company} onChange={v => setNewAddr(p => ({ ...p, company: v }))} placeholder="Firma GmbH" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Vorname" value={newAddr.first_name} onChange={v => setNewAddr(p => ({ ...p, first_name: v }))} placeholder="Max" />
              <Input label="Nachname" value={newAddr.last_name} onChange={v => setNewAddr(p => ({ ...p, last_name: v }))} placeholder="Muster" />
            </div>
            <div style={{ position: "relative" }}>
              <Input label="Strasse & Nr." value={newAddr.street} onChange={async v => {
                setNewAddr(p => ({ ...p, street: v }));
                if (v.length < 3) { setExtraAddrHits([]); return; }
                try {
                  const res = await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(v)}&type=locations&limit=5&origins=address`);
                  const data = await res.json();
                  setExtraAddrHits((data?.results || []).map(r => {
                    const raw = (r.attrs?.label || "").replace(/<[^>]+>/g, "").trim();
                    const m = raw.match(/^(.+?)\s*,?\s*(\d{4})\s+(.+)$/);
                    if (m) return { street: m[1].trim(), plz: m[2], city: m[3].trim() };
                    return { street: raw, plz: "", city: "" };
                  }));
                } catch { setExtraAddrHits([]); }
              }} placeholder="Bahnhofstrasse 1" />
              {extraAddrHits.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${K.ink}`, borderRadius: 0, maxHeight: 160, overflowY: "auto", zIndex: 50, boxShadow: `4px 4px 0 ${K.ink}22` }}>
                  {extraAddrHits.map((r, j) => (
                    <div key={j} onClick={() => {
                      setNewAddr(p => ({ ...p, street: r.street, postal_code: r.plz, city: r.city }));
                      setExtraAddrHits([]);
                    }} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontWeight: 600 }}>{r.street}</span>
                      <span style={{ color: "#888", marginLeft: 6 }}>{r.plz} {r.city}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
              <Input label="PLZ" value={newAddr.postal_code} onChange={v => setNewAddr(p => ({ ...p, postal_code: v }))} placeholder="8001" />
              <Input label="Ort" value={newAddr.city} onChange={v => setNewAddr(p => ({ ...p, city: v }))} placeholder="Zürich" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setShowAddAddr(false); setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" }); setExtraAddrHits([]); }}
                style={{ flex: 1, padding: "10px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Abbrechen</button>
              <button onClick={async () => {
                if (!newAddr.label) return;
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase.from("user_addresses").insert({ user_id: user.id, ...newAddr }).select().single();
                if (!error && data) setSavedAddresses(prev => [...prev, data]);
                setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" });
                setShowAddAddr(false); setExtraAddrHits([]);
                showToast("Adresse hinzugefügt");
              }} style={{ flex: 1, padding: "10px", borderRadius: 0, border: `1px solid ${K.ink}`, background: newAddr.label ? K.honey : "#ccc", color: K.ink, fontSize: 13, fontWeight: 800, cursor: newAddr.label ? "pointer" : "default", fontFamily: "'Manrope', sans-serif" }}>Hinzufügen</button>
            </div>
          </div>
        ) : editAddrIdx === null && (
          <button onClick={() => setShowAddAddr(true)} style={{
            width: "100%", padding: "12px", borderRadius: 0,
            border: `1.5px dashed ${K.ink}`, background: "transparent",
            color: K.ink, fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Manrope', sans-serif",
          }}>
            + Weitere Adresse hinzufügen
          </button>
        )}
      </Section>
    </>
  );

  // ── Notification helpers ──
  const toggleNoti = (key, channel) => {
    setForm(prev => ({
      ...prev,
      noti: {
        ...prev.noti,
        [key]: { ...prev.noti[key], [channel]: !prev.noti[key][channel] },
      },
    }));
  };

  const toggleAllInCategory = (keys, channel) => {
    const allOn = keys.every(k => form.noti[k]?.[channel]);
    setForm(prev => {
      const newNoti = { ...prev.noti };
      keys.forEach(k => {
        newNoti[k] = { ...newNoti[k], [channel]: !allOn };
      });
      return { ...prev, noti: newNoti };
    });
  };

  const NotiCheckbox = ({ checked, onChange, accent }) => (
    <div
      onClick={onChange}
      style={{
        width: 22, height: 22, borderRadius: 0, cursor: "pointer",
        border: `1px solid ${K.ink}`,
        background: checked ? (accent || K.honey) : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s",
      }}
    >
      {checked && <Check size={13} color={checked && accent ? "#fff" : C.dark} />}
    </div>
  );

  const NotiCategory = ({ title, icon: CatIcon, items, keys }) => {
    const allEmail = keys.every(k => form.noti[k]?.email);
    const allPush = keys.every(k => form.noti[k]?.push);
    return (
      <div style={{ marginBottom: 24 }}>
        {/* Category header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 50px 50px",
          alignItems: "center", padding: "10px 0",
          borderBottom: `2px solid ${C.dark}`, marginBottom: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CatIcon size={16} color={C.dark} />
            <span style={{
              fontFamily: "'General Sans', sans-serif", fontSize: 15,
              letterSpacing: ".5px", color: C.dark,
            }}>{title}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <NotiCheckbox checked={allEmail} onChange={() => toggleAllInCategory(keys, "email")} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <NotiCheckbox checked={allPush} onChange={() => toggleAllInCategory(keys, "push")} />
          </div>
        </div>
        {/* Rows */}
        {items.map((item, i) => (
          <div key={item.key} style={{
            display: "grid", gridTemplateColumns: "1fr 50px 50px",
            alignItems: "center", padding: "11px 0",
            borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none",
          }}>
            <div style={{ paddingLeft: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>{item.label}</div>
              {item.desc && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{item.desc}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <NotiCheckbox checked={form.noti[item.key]?.email} onChange={() => toggleNoti(item.key, "email")} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <NotiCheckbox checked={form.noti[item.key]?.push} onChange={() => toggleNoti(item.key, "push")} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const NotificationsTab = () => {
    const Mail = () => <CreditCard size={14} />;
    return (
      <>
        {/* Ehrlichkeit vor Schoenfaerberei: In-App laeuft immer, E-Mail wird
            bereits nach diesen Haekchen in die Warteschlange gelegt, der
            Versand selbst startet mit dem Go-Live. Push braucht die App. */}
        <div style={{ padding: "10px 14px", background: K.sand, border: `1px solid ${K.ink}`, marginBottom: 16, fontSize: 12.5, color: C.dark, lineHeight: 1.6 }}>
          Wichtige Meldungen zu deinen Käufen und Verkäufen erscheinen immer in der Glocke.
          Deine Auswahl hier steuert E-Mail und Push: E-Mails starten mit dem offiziellen Start
          von BEEDARO, Push folgt mit der App.
        </div>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 50px 50px",
          alignItems: "center", padding: "0 0 8px",
          marginBottom: 8,
        }}>
          <div />
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>
            E-Mail
          </div>
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>
            Push
          </div>
        </div>

        <NotiCategory
          title="KAUFEN"
          icon={CreditCard}
          keys={["buy_outbid", "buy_auction_end", "buy_won", "buy_payment"]}
          items={[
            { key: "buy_outbid",      label: "Überboten",           desc: "Jemand hat dein Gebot überboten" },
            { key: "buy_auction_end", label: "Auktion endet bald",  desc: "Auktionen auf deiner Watchlist" },
            { key: "buy_won",         label: "Auktion gewonnen",    desc: "Du hast den Zuschlag erhalten" },
            { key: "buy_payment",     label: "Zahlungsbestätigung", desc: "Zahlung eingegangen" },
          ]}
        />

        <NotiCategory
          title="VERKAUFEN"
          icon={Star}
          keys={["sell_new_bid", "sell_question", "sell_sold", "sell_expiring", "sell_report"]}
          items={[
            { key: "sell_new_bid",   label: "Neues Gebot",          desc: "Jemand hat auf deinen Artikel geboten" },
            { key: "sell_question",  label: "Neue Frage",           desc: "Frage zu deinem Inserat" },
            { key: "sell_sold",      label: "Artikel verkauft",     desc: "Dein Artikel wurde gekauft" },
            { key: "sell_expiring",  label: "Inserat läuft ab",     desc: "Erinnerung vor Ablauf" },
            { key: "sell_report",    label: "Verkaufsbericht",      desc: "Monatliche Verkaufsübersicht" },
          ]}
        />

        <NotiCategory
          title="NACHRICHTEN"
          icon={Bell}
          keys={["msg_new", "msg_offer"]}
          items={[
            { key: "msg_new",   label: "Neue Nachricht",     desc: "Jemand hat dir geschrieben" },
            { key: "msg_offer", label: "Preisvorschlag",     desc: "Jemand hat dir einen Preis vorgeschlagen" },
          ]}
        />

        <NotiCategory
          title="BEWERTUNGEN"
          icon={Star}
          keys={["review_received", "review_reminder"]}
          items={[
            { key: "review_received", label: "Neue Bewertung",      desc: "Du hast eine Bewertung erhalten" },
            { key: "review_reminder", label: "Bewertungserinnerung", desc: "Erinnere dich, den Käufer zu bewerten" },
          ]}
        />

        <NotiCategory
          title="FAVORITEN & SUCHE"
          icon={Eye}
          keys={["fav_price_change", "fav_sold", "search_new_match"]}
          items={[
            { key: "fav_price_change", label: "Preisänderung",       desc: "Ein Favorit hat den Preis geändert" },
            { key: "fav_sold",         label: "Favorit verkauft",    desc: "Ein Favorit wurde verkauft" },
            { key: "search_new_match", label: "Neue Treffer",        desc: "Neue Artikel zu deinen Suchaufträgen" },
          ]}
        />

        <NotiCategory
          title="ALLGEMEIN"
          icon={Bell}
          keys={["gen_newsletter", "gen_tips", "gen_promo"]}
          items={[
            { key: "gen_newsletter", label: "BEEDARO Newsletter",     desc: "News und neue Features" },
            { key: "gen_tips",       label: "Tipps & Tricks",         desc: "So verkaufst du erfolgreicher" },
            { key: "gen_promo",      label: "Aktionen & Angebote",    desc: "Spezialangebote und Rabattcodes" },
          ]}
        />

        <Btn onClick={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { error } = await supabase.from("profiles").update({ notification_settings: form.noti }).eq("id", session.user.id);
          if (error) { showToast("Fehler beim Speichern"); console.error(error); }
          else showToast("Benachrichtigungen gespeichert");
        }} style={{ width: "100%" }}>
          Änderungen speichern
        </Btn>
      </>
    );
  };

  const tabContent = {
    profile: ProfileTab(),
    verify: VerifyTab(),
    payment: PaymentTab(),
    address: AddressTab(),
    notifications: NotificationsTab(),
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      <div style={{
        fontFamily: "'Manrope', sans-serif",
        background: K.paper, minHeight: "100vh", color: K.ink,
      }}>

        {/* ── LAYOUT: Sidebar + Content ── */}
        <div className="settings-layout" style={{
          maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px",
          display: "grid", gridTemplateColumns: "200px 1fr", gap: 32,
        }}>
          {/* Sidebar Navigation */}
          <nav style={{ position: "sticky", top: 88, alignSelf: "start" }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  width: "100%", padding: "10px 14px", border: "none",
                  background: active ? K.sand : "transparent",
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  fontFamily: "'Manrope', sans-serif", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? K.ink : C.muted,
                  borderRadius: 0, marginBottom: 2,
                  borderLeft: active ? `3px solid ${K.honey}` : "3px solid transparent",
                  transition: "all .15s",
                }}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div key={activeTab} style={{ animation: "fadeIn .25s ease" }}>
            {tabContent[activeTab]}
          </div>
        </div>

        {/* ── Responsive ── */}
        <style>{`
          @media (max-width: 700px) {
            .settings-layout { grid-template-columns: 1fr !important; }
            .settings-layout nav { position: static !important; display: flex; overflow-x: auto; gap: 4px; padding-bottom: 12px; border-bottom: 1px solid #e8e5e0; margin-bottom: 8px; }
            .settings-layout nav button { white-space: nowrap; flex-shrink: 0; border-left: none !important; border-bottom: 2.5px solid transparent !important; border-radius: 0 !important; }
          }
        `}</style>

        {/* ── TOAST ── */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: K.ink, color: "#fff", padding: "12px 24px",
            borderRadius: 0, fontSize: 14, fontWeight: 600, zIndex: 2000,
            boxShadow: `4px 4px 0 ${K.honey}`,
            animation: "toastIn .25s ease",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
            {toast}
          </div>
        )}

        {/* ── PUBLIC PROFILE MODAL ── */}
        {showPublicProfile && (
          <PublicProfileModal
            profile={{ ...profile, ...form }}
            onClose={() => setShowPublicProfile(false)}
          />
        )}
      </div>
    </>
  );
}
