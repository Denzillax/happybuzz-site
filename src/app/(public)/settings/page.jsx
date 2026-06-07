"use client"
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Shield, CreditCard, MapPin, Landmark, Bell,
  Check, Camera, Eye, Lock, AlertTriangle, Pencil,
  Star, X, Loader2, ChevronRight, ExternalLink,
} from "lucide-react";
import { BeeLevelCard } from "@/components/shared/BeeLevel";

const C = colors; // Alias for brevity in this file
import ProfileTab from "@/components/settings/ProfileTab";
import VerifyTab from "@/components/settings/VerifyTab";
import PaymentTab from "@/components/settings/PaymentTab";
import AddressTab from "@/components/settings/AddressTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import PublicProfileModal from "@/components/settings/PublicProfileModal";

import { FEE_TIERS } from "@/lib/constants";

const TABS = [
  { id: "profile",        label: "Profil",              icon: User },
  { id: "verify",         label: "Verifizierung",       icon: Shield },
  { id: "payment",        label: "Zahlung",             icon: CreditCard },
  { id: "address",        label: "Adresse",             icon: MapPin },
  { id: "notifications",  label: "Benachrichtigungen",  icon: Bell },
];

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
      showToast("Gespeichert ✓");
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

  const tabContent = {
    profile: <ProfileTab form={form} updateForm={updateForm} profile={profile} saving={saving} saveProfile={saveProfile} fileInputRef={fileInputRef} handleAvatarUpload={handleAvatarUpload} setShowPublicProfile={setShowPublicProfile} />,
    verify: <VerifyTab profile={profile} emailSending={emailSending} setEmailSending={setEmailSending} supabase={supabase} showToast={showToast} setActiveTab={setActiveTab} idUploading={idUploading} setIdUploading={setIdUploading} setProfile={setProfile} />,
    payment: <PaymentTab form={form} updateForm={updateForm} saving={saving} saveProfile={saveProfile} showToast={showToast} />,
    address: <AddressTab form={form} updateForm={updateForm} profile={profile} saving={saving} saveProfile={saveProfile} supabase={supabase} showToast={showToast} addrResults={addrResults} setAddrResults={setAddrResults} showAddAddr={showAddAddr} setShowAddAddr={setShowAddAddr} editAddrIdx={editAddrIdx} setEditAddrIdx={setEditAddrIdx} extraAddrHits={extraAddrHits} setExtraAddrHits={setExtraAddrHits} newAddr={newAddr} setNewAddr={setNewAddr} savedAddresses={savedAddresses} setSavedAddresses={setSavedAddresses} />,
    notifications: <NotificationsTab form={form} setForm={setForm} showToast={showToast} />,
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
        background: C.cream, minHeight: "100vh", color: C.dark,
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
                  background: active ? C.yellowSoft : "transparent",
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  fontFamily: "'Manrope', sans-serif", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? C.dark : C.muted,
                  borderRadius: 8, marginBottom: 2,
                  borderLeft: active ? `3px solid ${C.yellow}` : "3px solid transparent",
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
            background: C.dark, color: "#fff", padding: "12px 24px",
            borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 2000,
            boxShadow: "0 8px 32px rgba(0,0,0,.2)",
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
