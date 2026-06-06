"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import {
  Camera, X, Star, ChevronDown, Sparkles, Eye, Search,
  Package, Gavel, Home, Truck, MapPin, Gift, Wrench,
} from "lucide-react";
import { colors, fonts, radius, shadows } from "@/lib/theme";
import {
  CONDITIONS, FEE_TIERS, CANTONS, RENT_PERIODS,
  SHIPPING_PAYERS, PAYMENT_METHODS, BEE_IMPACT_RATE,
} from "@/lib/constants";
import { getRandomBeeTexts, BEE_FEE_SUBTITLES } from "@/lib/bee-fee-texts";
import { checkProfileComplete } from "@/lib/listings";
import ShippingSection from "./form/ShippingSection";

// ─── Photo Slot Labels (Ricardo-style) ──────────────────────
const PHOTO_SLOTS = [
  "Hauptbild",
  "Vorderseite",
  "Rückseite",
  "Detail",
  "Mängel",
  "Zubehör",
  "Verpackung",
  "Etikett",
  "Massstab",
  "Extra",
];

// ─── Listing Types as Tabs ──────────────────────────────────
const TYPE_TABS = [
  { value: "sell",    label: "Festpreis", icon: Package, desc: "Fester Preis" },
  { value: "auction", label: "Auktion",   icon: Gavel,   desc: "Bieten lassen" },
  { value: "rent",    label: "Vermieten", icon: Home,     desc: "Zeitweise" },
  { value: "service", label: "Service",   icon: Wrench,   desc: "Dienstleistung" },
];

// ─── Swiss Post Tarife 2026 (CHF inkl. MWST) ─────────────────
const POST_TARIFE = {
  paket: {
    economy: { "bis 2kg": 9.00, "bis 10kg": 12.00, "bis 30kg": 21.00 },
    priority: { "bis 2kg": 9.00, "bis 10kg": 14.00, "bis 30kg": 23.00 },
  },
  brief: {
    economy: { "Standard": 1.00, "Gross": 1.80, "Maxi": 3.50 },
    priority: { "Standard": 1.20, "Gross": 2.00, "Maxi": 4.00 },
  },
  sperrgut: {
    economy: { "bis 30kg": 31.00, "bis 60kg": 41.00 },
    priority: { "bis 30kg": 35.00, "bis 60kg": 45.00 },
  },
};
const MAX_MARKUP = 5; // Max CHF 5 über Post-Tarif

// ─── Shared Styles ──────────────────────────────────────────
const inputBase = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: radius.sm,
  border: `1.5px solid ${colors.border}`,
  background: colors.surface,
  fontSize: 14,
  fontFamily: fonts.body,
  color: colors.dark,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .2s, box-shadow .2s",
};

const labelBase = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: fonts.body,
  color: colors.dark,
  marginBottom: 6,
  letterSpacing: ".01em",
};

const sectionBase = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: "24px 20px",
  border: `1px solid ${colors.border}`,
  marginBottom: 16,
};

const hintStyle = {
  fontSize: 12,
  color: colors.muted,
  fontFamily: fonts.body,
  marginTop: 4,
};

// ═════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════
export default function ListingForm({
  categories = [],
  onSave,
  onCancel,
  isEdit = false,
  initialData = null,
}) {
  // ── State ──────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    description: "",
    listing_type: "sell",
    category_id: "",
    condition: "good",
    price: "",
    currency: "CHF",
    is_negotiable: false,

    // Versand
    shipping_available: false,
    pickup_only: true,
    shipping_cost: "",
    shipping_method: "paket",
    shipping_payer: "buyer",
    ship_weight: "bis 2kg",
    ship_speed: "economy",
    free_shipping: false,
    _shipModal: false,
    _shipStep: "",

    // Standort (from profile, hidden but kept in state)
    city: "",
    street: "",
    postal_code: "",

    // Kontakt (chat only — no phone)
    contact_chat: true,
    contact_phone: false,
    phone_number: "",

    // Zahlung
    pay_twint: false,
    pay_bank: false,
    pay_cash: false,

    // Gebühren
    fee_percentage: 7,
    fee_tier: "impact",

    // Auktion
    start_price: "",
    buy_now_price: "",
    min_price: "",
    auction_duration: "7",

    // Vermieten
    rent_price: "",
    rent_period: "day",
    deposit_amount: "",
    min_rent_days: "",
    max_rent_days: "",
  });

  const [isFree, setIsFree] = useState(false);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [beeTexts] = useState(() => getRandomBeeTexts());
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  // ── Init from existing data ────────────────────────────────
  useEffect(() => {
    if (!initialData) return;

    const isFreeInit = initialData.listing_type === "free";
    setIsFree(isFreeInit);

    setForm((prev) => ({
      ...prev,
      title: initialData.title || "",
      description: initialData.description || "",
      listing_type: isFreeInit ? "sell" : (initialData.listing_type || "sell"),
      category_id: initialData.category_id || "",
      condition: initialData.condition || "good",
      price: initialData.price?.toString() || "",
      currency: initialData.currency || "CHF",
      is_negotiable: initialData.is_negotiable || false,

      shipping_available: initialData.shipping_available || false,
      pickup_only: initialData.pickup_only ?? true,
      shipping_cost: initialData.shipping_cost?.toString() || "",
      shipping_method: initialData.shipping_method || "",
      shipping_payer: initialData.shipping_payer || "buyer",

      city: initialData.city || "",
      canton: initialData.canton || "",
      postal_code: initialData.postal_code || "",

      contact_chat: initialData.contact_chat ?? true,
      contact_phone: initialData.contact_phone || false,
      phone_number: initialData.phone_number || "",

      pay_twint: initialData.pay_twint || false,
      pay_bank: initialData.pay_bank || false,
      pay_cash: initialData.pay_cash || false,

      fee_percentage: initialData.fee_percentage || 7,
      fee_tier: initialData.fee_tier || "impact",

      start_price: initialData.start_price?.toString() || "",
      buy_now_price: initialData.buy_now_price?.toString() || "",
      min_price: initialData.min_price?.toString() || "",
      auction_duration: initialData.auction_duration?.toString() || "7",

      rent_price: initialData.rent_price?.toString() || "",
      rent_period: initialData.rent_period || "day",
      deposit_amount: initialData.deposit_amount?.toString() || "",
      min_rent_days: initialData.min_rent_days?.toString() || "",
      max_rent_days: initialData.max_rent_days?.toString() || "",
    }));

    if (initialData.listing_images?.length) {
      const sorted = [...initialData.listing_images].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      setImages(
        sorted.map((img, i) => ({
          id: img.id,
          preview: img.url,
          sortOrder: img.sort_order ?? i,
          isCover: i === 0,
          storage_path: img.storage_path,
          existing: true,
        }))
      );
    }
  }, [initialData]);

  // Profil laden und Standort + Bee-Rate auto-fill
  useEffect(() => {
    if (initialData?.id) return;
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("city, postal_code, street, phone")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setForm((prev) => ({
            ...prev,
            city: prev.city || profile.city || "",
            postal_code: prev.postal_code || profile.postal_code || "",
            street: prev.street || profile.street || "",
            phone_number: prev.phone_number || profile.phone || "",
          }));
        }
      } catch {}
    }
    loadProfile();
  }, []);

  // ── Helpers ────────────────────────────────────────────────
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const toggle = (key) => setForm((p) => ({ ...p, [key]: !p[key] }));

  const parentCats = categories.filter((c) => !c.parent_id);
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [addrQ, setAddrQ] = useState("");
  const [addrHits, setAddrHits] = useState([]);
  const [profileAddr, setProfileAddr] = useState({ street: "", postal_code: "", city: "" });

  // Profil-Adresse IMMER laden (für Abholung-Anzeige)
  useEffect(() => {
    async function loadAddr() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("street, postal_code, city").eq("id", session.user.id).maybeSingle();
      if (data) setProfileAddr({ street: data.street || "", postal_code: data.postal_code || "", city: data.city || "" });
    }
    loadAddr();
  }, []);
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const subCatsForm = categories.filter((c) => c.parent_id === selectedMainCat);
  const subSubCatsForm = categories.filter((c) => c.parent_id === selectedSubCat);

  // Sync selectedMainCat from initial category_id
  useEffect(() => {
    if (form.category_id && categories.length > 0) {
      const cat = categories.find(c => c.id === form.category_id);
      if (cat) {
        if (!cat.parent_id) {
          setSelectedMainCat(cat.id);
        } else {
          const parent = categories.find(c => c.id === cat.parent_id);
          if (parent && !parent.parent_id) {
            setSelectedMainCat(parent.id);
            setSelectedSubCat(cat.id);
          } else if (parent) {
            const grandparent = categories.find(c => c.id === parent.parent_id);
            if (grandparent) { setSelectedMainCat(grandparent.id); setSelectedSubCat(parent.id); }
          }
        }
      }
    }
  }, [form.category_id, categories]);

  // Effective listing type for save
  const effectiveType = isFree ? "free" : form.listing_type;

  // ── Gratis toggle ──────────────────────────────────────────
  const toggleFree = () => {
    setIsFree((prev) => !prev);
    if (!isFree) {
      set("price", "0");
    }
  };

  // ── Image handling ─────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const newImages = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 10 - images.length)
      .map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        sortOrder: images.length + i,
        isCover: images.length === 0 && i === 0,
      }));
    setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const removeImage = (idx) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length && !next.some((img) => img.isCover)) {
        next[0].isCover = true;
      }
      return next.map((img, i) => ({ ...img, sortOrder: i }));
    });
  };

  const setCover = (idx) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isCover: i === idx }))
    );
  };

  const moveImage = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((img, i) => ({ ...img, sortOrder: i, isCover: i === 0 }));
    });
  };

  // ── Drag & Drop ────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  // ── Fee select ─────────────────────────────────────────────
  const selectFee = (pct, tierName) => {
    const tier = tierName || FEE_TIERS.find((t) => t.pct === parseInt(pct))?.tier || "supporter";
    set("fee_percentage", parseInt(pct));
    set("fee_tier", tier);
  };

  // ── Barzahlung Geschäftsregel ──────────────────────────────
  // Barzahlung nur bei Abholung. Wenn Versand aktiv → Barzahlung deaktiviert.
  useEffect(() => {
    if (form.shipping_available && !form.pickup_only) {
      set("pay_cash", false);
    }
  }, [form.shipping_available, form.pickup_only]);

  // ── Validate ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    // Allgemein
    if (!form.title.trim()) e.title = "Titel ist erforderlich";
    if (!form.category_id) e.category = "Kategorie ist erforderlich";
    if (!form.condition) e.condition = "Zustand ist erforderlich";
    if (!form.postal_code || !form.city) e.location = "Standort (PLZ/Ort) ist erforderlich";

    // Zahlungsart
    if (!form.pay_twint && !form.pay_bank && !form.pay_cash) e.payment = "Mindestens eine Zahlungsart wählen";

    // Versand / Abholung
    if (!form.shipping_available && !form.pickup_only) e.delivery = "Versand oder Abholung muss aktiviert sein";

    // Typ-spezifisch
    if (form.listing_type === "sell" && !isFree && !form.price) e.price = "Preis eingeben";
    if (form.listing_type === "auction") {
      if (!form.start_price) e.start_price = "Startpreis eingeben";
      if (!form.auction_duration) e.auction_duration = "Auktionsdauer wählen";
    }
    if (form.listing_type === "rent") {
      if (!form.rent_price) e.rent_price = "Mietpreis eingeben";
      if (!form.min_rent_days) e.min_rent_days = "Mindest-Mietdauer eingeben";
    }

    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Scroll zum ersten Fehler
      const firstKey = Object.keys(e)[0];
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (publish = false) => {
    // Nur bei Veröffentlichen validieren, Entwurf braucht nur Titel
    if (publish) {
      if (!validate()) return;
      // IBAN-Check vor Veröffentlichung
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const action = form.listing_type === "rent" ? "rent_out" : "sell";
        const check = await checkProfileComplete(session.user.id, action);
        if (!check.complete) {
          setErrors({ submit: `Bitte ergänze dein Profil: ${check.missing.join(", ")}` });
          return;
        }
      }
    } else {
      if (!form.title.trim()) {
        setErrors({ title: "Titel ist erforderlich" });
        return;
      }
      setErrors({});
    }
    setSaving(true);
    try {
      const existingImages = images.filter((i) => i.existing).map((i) => ({
        id: i.id,
        sortOrder: i.sortOrder,
        storage_path: i.storage_path,
      }));
      const newFiles = images.filter((i) => !i.existing).map((i) => ({
        file: i.file,
        sortOrder: i.sortOrder,
      }));

      await onSave({
        ...form,
        listing_type: effectiveType,
        price: isFree ? 0 : form.price,
        publish,
        existingImages,
        newFiles,
      });
    } catch (err) {
      console.error("Save error:", err);
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Sub-Components ─────────────────────────────────────────
  const Chip = ({ active, onClick, children }) => (
    <div
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: radius.sm,
        border: `1.5px solid ${active ? colors.yellow : colors.border}`,
        background: active ? colors.yellowSoft : colors.surface,
        cursor: "pointer",
        fontSize: 13,
        fontFamily: fonts.body,
        fontWeight: active ? 700 : 500,
        color: colors.dark,
        transition: "all .15s",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );

  const Check = ({ checked, onChange, label, disabled = false }) => (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "default" : "pointer",
        padding: "8px 0",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div
        style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          border: `1.5px solid ${checked ? colors.yellow : colors.border}`,
          background: checked ? colors.yellow : colors.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}
        onClick={(e) => { e.preventDefault(); if (!disabled) onChange(!checked); }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke={colors.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, fontFamily: fonts.body, color: colors.dark }}>
        {label}
      </span>
      {disabled && (
        <span style={{ fontSize: 11, color: colors.muted, fontFamily: fonts.body }}>
          (nur bei Abholung)
        </span>
      )}
    </label>
  );

  const Err = ({ field }) =>
    errors[field] ? (
      <div style={{ color: colors.red, fontSize: 12, marginTop: 4, fontFamily: fonts.body }}>
        {errors[field]}
      </div>
    ) : null;

  const AiButton = ({ onClick, label }) => (
    <button
      onClick={onClick}
      disabled
      title="Kommt bald: KI Generierung via OpenRouter"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: radius.sm,
        border: `1px dashed ${colors.border}`,
        background: colors.cream, color: colors.muted,
        fontSize: 12, fontFamily: fonts.body,
        cursor: "not-allowed", opacity: 0.7,
      }}
    >
      <Sparkles size={13} />
      {label}
    </button>
  );

  const SelectWrap = ({ children, ...props }) => (
    <div style={{ position: "relative" }}>
      <select style={{ ...inputBase, appearance: "none", paddingRight: 36 }} {...props}>
        {children}
      </select>
      <ChevronDown
        size={16} color={colors.muted}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  );

  // Cash allowed only when pickup is possible
  const cashAllowed = form.pickup_only || (!form.shipping_available);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: fonts.head, fontSize: 28, color: colors.dark,
          margin: 0, letterSpacing: ".03em",
        }}>
          {isEdit ? "INSERAT BEARBEITEN" : "NEUES INSERAT"}
        </h1>
        <p style={{ ...hintStyle, marginTop: 6, fontSize: 14 }}>
          {isEdit ? "Passe dein Inserat an." : "Nicht neu. Nur interessanter."}
        </p>
      </div>

      {/* ── FOTOS (Ricardo-style Slots) ─────────────────────── */}
      <div style={sectionBase}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={labelBase}>
            <Camera size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
            Fotos
          </label>
          <span style={{ ...hintStyle, margin: 0 }}>{images.length}/10</span>
        </div>

        {/* Slot Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
          gap: 8, marginBottom: images.length < 10 ? 12 : 0,
        }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) moveImage(dragIdx, idx); setDragIdx(null); }}
              onDragEnd={() => setDragIdx(null)}
              style={{
                position: "relative", borderRadius: radius.sm,
                overflow: "hidden", aspectRatio: "1",
                border: img.isCover ? `2px solid ${colors.yellow}` : `1px solid ${colors.border}`,
                opacity: dragIdx === idx ? 0.35 : 1,
                cursor: "grab", transition: "opacity .15s",
              }}
            >
              <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Slot label */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,.55))",
                padding: "12px 6px 4px",
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, fontFamily: fonts.body,
                  color: "#fff", textTransform: "uppercase", letterSpacing: ".04em",
                }}>
                  {PHOTO_SLOTS[idx] || `Bild ${idx + 1}`}
                </span>
              </div>

              {/* Cover badge */}
              {img.isCover && (
                <div style={{
                  position: "absolute", top: 4, left: 4,
                  background: colors.teal, color: "#fff",
                  fontSize: 8, fontWeight: 800, fontFamily: fonts.body,
                  padding: "2px 5px", borderRadius: 4,
                  textTransform: "uppercase", letterSpacing: ".04em",
                }}>
                  Cover
                </div>
              )}

              {/* Action buttons */}
              <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 3 }}>
                {!img.isCover && (
                  <button
                    onClick={() => setCover(idx)}
                    title="Als Cover setzen"
                    style={{
                      width: 22, height: 22, borderRadius: 5, border: "none",
                      background: "rgba(0,0,0,.5)", color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                    }}
                  >
                    <Star size={11} />
                  </button>
                )}
                <button
                  onClick={() => removeImage(idx)}
                  title="Entfernen"
                  style={{
                    width: 22, height: 22, borderRadius: 5, border: "none",
                    background: "rgba(0,0,0,.5)", color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty slots as placeholders — always show all remaining */}
          {images.length < 10 && Array.from({ length: 10 - images.length }).map((_, i) => (
            <div
              key={`slot-${i}`}
              onClick={() => fileRef.current?.click()}
              style={{
                aspectRatio: "1", borderRadius: radius.sm,
                border: `1.5px dashed ${colors.border}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", gap: 2,
                background: colors.cream,
                transition: "border-color .15s",
              }}
            >
              <Camera size={16} color={colors.mutedLt} />
              <span style={{
                fontSize: 8, fontWeight: 700, fontFamily: fonts.body,
                color: colors.mutedLt, textTransform: "uppercase",
                letterSpacing: ".03em", textAlign: "center", padding: "0 2px",
              }}>
                {PHOTO_SLOTS[images.length + i] || `Bild`}
              </span>
            </div>
          ))}
        </div>

        {/* Drop zone (when no images yet) */}
        {images.length === 0 && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? colors.yellow : colors.border}`,
              borderRadius: radius.md, padding: "28px 20px",
              textAlign: "center", cursor: "pointer",
              background: dragOver ? colors.yellowSoft : "transparent",
              transition: "all .15s", marginTop: 8,
            }}
          >
            <Camera size={24} color={colors.muted} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 14, fontFamily: fonts.body, color: colors.muted }}>
              Fotos hierher ziehen oder klicken
            </div>
            <div style={{ ...hintStyle, marginTop: 4 }}>JPG, PNG, WebP</div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => addFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </div>

      {/* ── TITEL + BESCHREIBUNG ────────────────────────────── */}
      <div style={sectionBase}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
          <label style={{ ...labelBase, marginBottom: 0 }}>Titel *</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...hintStyle, margin: 0, fontSize: 11 }}>{form.title.length}/60</span>
            <AiButton label="KI-Titel" />
          </div>
        </div>
        <input
          style={inputBase}
          placeholder="z.B. iPhone 14 Pro 256GB Space Black"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={60}
        />
        <Err field="title" />

        {/* Zustand — direkt unter Titel (ausgegraut bei Service) */}
        {!isFree && (
          <div style={{ marginTop: 18, opacity: form.listing_type === "service" ? 0.4 : 1, pointerEvents: form.listing_type === "service" ? "none" : "auto" }}>
            <label style={labelBase}>Zustand {form.listing_type === "service" && <span style={{ fontSize: 11, fontWeight: 400, color: colors.muted }}> (nicht relevant bei Service)</span>}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CONDITIONS.map((c) => (
                <Chip key={c.value} active={form.condition === c.value} onClick={() => set("condition", c.value)}>{c.label}</Chip>
              ))}
            </div>
            {(() => { const sel = CONDITIONS.find((c) => c.value === form.condition); return sel?.desc ? <p style={{ ...hintStyle, marginTop: 8 }}>{sel.desc}</p> : null; })()}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
            <label style={{ ...labelBase, marginBottom: 0 }}>Beschreibung</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...hintStyle, margin: 0, fontSize: 11 }}>{form.description.length}/5000</span>
              <AiButton label="KI-Text" />
            </div>
          </div>
          <textarea
            style={{ ...inputBase, minHeight: 110, resize: "vertical" }}
            placeholder="Beschreibe dein Produkt: Zustand, Besonderheiten, Zubehör..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={5000}
          />
        </div>

        {/* Kategorie (hierarchisch + Autocomplete) */}
        <div style={{ marginTop: 18 }}>
          <label style={labelBase}>Kategorie</label>
          {/* Autocomplete Search */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type="text"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Kategorie suchen..."
              style={{ ...inputBase, paddingLeft: 32 }}
            />
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }} />
            {catSearch.length >= 2 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 6, maxHeight: 180, overflowY: "auto", zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
                {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).slice(0, 8).map(c => {
                  const parent = categories.find(p => p.id === c.parent_id);
                  return (
                    <div key={c.id} onClick={() => {
                      set("category_id", c.id);
                      if (c.parent_id) {
                        const grandparent = categories.find(p => p.id === parent?.parent_id);
                        if (grandparent) { setSelectedMainCat(grandparent.id); setSelectedSubCat(c.parent_id); }
                        else if (parent) { setSelectedMainCat(c.parent_id); setSelectedSubCat(c.id); }
                      } else { setSelectedMainCat(c.id); setSelectedSubCat(""); }
                      setCatSearch("");
                    }} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid ${colors.borderLt}` }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {parent && <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>in {parent.name}</span>}
                    </div>
                  );
                })}
                {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "center" }}>Keine Kategorie gefunden</div>
                )}
              </div>
            )}
          </div>
          {/* Hierarchische Dropdowns */}
          <SelectWrap
            value={selectedMainCat}
            onChange={(e) => { setSelectedMainCat(e.target.value); setSelectedSubCat(""); set("category_id", e.target.value); }}
          >
            <option value="">Hauptkategorie wählen</option>
            {parentCats.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </SelectWrap>
          {subCatsForm.length > 0 && (
            <SelectWrap
              style={{ marginTop: 8 }}
              value={selectedSubCat}
              onChange={(e) => { setSelectedSubCat(e.target.value); set("category_id", e.target.value || selectedMainCat); }}
            >
              <option value="">Unterkategorie wählen</option>
              {subCatsForm.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </SelectWrap>
          )}
          {subSubCatsForm.length > 0 && (
            <SelectWrap
              style={{ marginTop: 8 }}
              value={form.category_id === selectedSubCat ? "" : form.category_id}
              onChange={(e) => { set("category_id", e.target.value || selectedSubCat); }}
            >
              <option value="">Spezifischer</option>
              {subSubCatsForm.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </SelectWrap>
          )}
        </div>
      </div>

      {/* ── INSERAT-TYP TABS ────────────────────────────────── */}
      <div style={sectionBase}>
        <label style={labelBase}>Inserattyp</label>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 0,
          background: colors.cream, borderRadius: radius.sm,
          padding: 3, marginBottom: 16,
        }}>
          {TYPE_TABS.map((t) => {
            const active = form.listing_type === t.value && !isFree;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { set("listing_type", t.value); setIsFree(false); }}
                style={{
                  flex: 1, padding: "10px 8px",
                  borderRadius: radius.sm - 2, border: "none",
                  background: active ? colors.surface : "transparent",
                  boxShadow: active ? shadows.sm : "none",
                  cursor: "pointer", transition: "all .15s",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3,
                }}
              >
                <Icon size={16} color={active ? colors.dark : colors.muted} />
                <span style={{
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  fontFamily: fonts.body, color: active ? colors.dark : colors.muted,
                }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gratis toggle (only for sell) */}
        {form.listing_type === "sell" && (
          <div
            onClick={toggleFree}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: radius.sm,
              border: `1.5px solid ${isFree ? colors.green : colors.border}`,
              background: isFree ? colors.greenSoft : "transparent",
              cursor: "pointer", marginBottom: 16,
              transition: "all .15s",
            }}
          >
            <Gift size={16} color={isFree ? colors.green : colors.muted} />
            <span style={{
              fontSize: 14, fontFamily: fonts.body,
              fontWeight: isFree ? 700 : 500,
              color: isFree ? colors.green : colors.dark,
            }}>
              Gratis verschenken
            </span>
            {isFree && (
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 700,
                fontFamily: fonts.body, color: colors.green,
                background: "rgba(91,140,90,.12)", padding: "2px 8px",
                borderRadius: 4, textTransform: "uppercase",
              }}>
                Aktiv
              </span>
            )}
          </div>
        )}

        {/* ── FESTPREIS FELDER ──────────────────────── */}
        {form.listing_type === "sell" && !isFree && (
          <div>
            <label style={labelBase}>Preis (CHF) *</label>
            <input
              style={inputBase}
              type="number" min="0" step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
            <Err field="price" />
            <Check
              checked={form.is_negotiable}
              onChange={(v) => set("is_negotiable", v)}
              label="Preis verhandelbar"
            />
          </div>
        )}

        {/* ── AUKTION FELDER ────────────────────────── */}
        {form.listing_type === "auction" && (
          <div>
            <label style={labelBase}>Startpreis (CHF) *</label>
            <input
              style={inputBase}
              type="number" min="0" step="0.01"
              placeholder="1.00"
              value={form.start_price}
              onChange={(e) => set("start_price", e.target.value)}
            />
            <Err field="start_price" />

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelBase}>Sofortkauf (optional)</label>
                <input
                  style={inputBase}
                  type="number" min="0" step="0.01"
                  placeholder="z.B. 500"
                  value={form.buy_now_price}
                  onChange={(e) => set("buy_now_price", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelBase}>Mindestpreis (optional)</label>
                <input
                  style={inputBase}
                  type="number" min="0" step="0.01"
                  placeholder="Nicht darunter"
                  value={form.min_price}
                  onChange={(e) => set("min_price", e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelBase}>Dauer</label>
              <SelectWrap
                value={form.auction_duration}
                onChange={(e) => set("auction_duration", e.target.value)}
              >
                {[3, 5, 7, 10, 14].map((d) => (
                  <option key={d} value={d}>{d} Tage</option>
                ))}
              </SelectWrap>
            </div>
          </div>
        )}

        {/* ── VERMIETEN FELDER ──────────────────────── */}
        {form.listing_type === "rent" && (
          <div>
            <label style={labelBase}>Mietpreis (CHF) *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputBase, flex: 1 }}
                type="number" min="0" step="0.01"
                placeholder="0.00"
                value={form.rent_price}
                onChange={(e) => set("rent_price", e.target.value)}
              />
              <SelectWrap
                value={form.rent_period}
                onChange={(e) => set("rent_period", e.target.value)}
              >
                {RENT_PERIODS.map((r) => (
                  <option key={r.value} value={r.value}>/ {r.label}</option>
                ))}
              </SelectWrap>
            </div>
            <Err field="rent_price" />

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelBase}>Min. Tage</label>
                <input
                  style={inputBase} type="number" min="1" placeholder="1"
                  value={form.min_rent_days}
                  onChange={(e) => set("min_rent_days", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelBase}>Max. Tage</label>
                <input
                  style={inputBase} type="number" min="1" placeholder="30"
                  value={form.max_rent_days}
                  onChange={(e) => set("max_rent_days", e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelBase}>Kaution (optional)</label>
              <input
                style={inputBase} type="number" min="0" step="0.01"
                placeholder="z.B. 100.00"
                value={form.deposit_amount}
                onChange={(e) => set("deposit_amount", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── SERVICE FELDER ──────────────────────── */}
        {form.listing_type === "service" && (
          <div>
            <p style={{ ...hintStyle, marginTop: 0, marginBottom: 12 }}>Biete eine Dienstleistung an: Rasenmähen, Nachhilfe, Handwerk, Umzugshilfe.</p>
            <label style={labelBase}>Preis (CHF) *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputBase, flex: 1 }}
                type="number" min="0" step="0.01"
                placeholder="0.00"
                value={form.rent_price}
                onChange={(e) => set("rent_price", e.target.value)}
              />
              <SelectWrap
                value={form.rent_period}
                onChange={(e) => set("rent_period", e.target.value)}
              >
                {RENT_PERIODS.map((r) => (
                  <option key={r.value} value={r.value}>/ {r.label}</option>
                ))}
              </SelectWrap>
            </div>
            <Err field="rent_price" />
          </div>
        )}
      </div>
      <ShippingSection form={form} set={set} Err={Err} />

            {/* ── BEE-RATE (emotional) ─────────────────────────────── */}
      {!isFree && effectiveType !== "free" && (
        <div style={sectionBase}>
          <label style={labelBase}>Bee-Impact</label>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: colors.dark, fontFamily: fonts.body }}>
            Jeder Verkauf auf BEEDARO schützt Bienen und Natur in der Schweiz. Wähle deinen Impact. Je grösser, desto mehr bewirkst du.
          </p>
          <p style={{ ...hintStyle, marginTop: 0, marginBottom: 14, fontSize: 11 }}>
            Die Gebühr wird nur bei erfolgreichem Verkauf fällig und vom Erlös abgezogen. 20% fliessen in echte Schweizer Bienen- und Naturschutzprojekte. Höherer Impact = bessere Platzierung.
          </p>
          {[
            { tier: "fair", pct: 3 },
            { tier: "supporter", pct: 5 },
            { tier: "impact", pct: 7 },
            { tier: "hero", pct: 10 },
          ].map(({ tier, pct }) => {
            const active = form.fee_tier === tier;
            const isDefault = tier === "impact";
            return (
              <div key={tier} onClick={() => selectFee(pct, tier)} style={{
                padding: "16px 18px", marginBottom: 8, borderRadius: radius.lg, cursor: "pointer",
                border: active ? `2px solid ${colors.yellow}` : `1.5px solid ${colors.borderLt}`,
                background: active ? "#FFF9E6" : colors.surface,
                transition: "all .15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: colors.dark, fontFamily: fonts.body }}>{beeTexts[tier]}</span>
                  {isDefault && <span style={{ fontSize: 9, fontWeight: 700, background: colors.teal, color: "#fff", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Empfohlen</span>}
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.muted, fontFamily: fonts.body }}>{BEE_FEE_SUBTITLES[tier]}</p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: colors.muted, fontFamily: fonts.body }}>{pct}% Gebühr · {(pct * 0.8).toFixed(1)}% Plattform · {(pct * 0.2).toFixed(1)}% Bee-Impact</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VALIDATION ERRORS ─────────────────────────────── */}
      {Object.keys(errors).length > 0 && !errors.submit && (
        <div style={{
          background: "#FFF3E0", border: `1.5px solid #F4A100`,
          borderRadius: radius.lg, padding: "14px 18px", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#E65100", fontFamily: fonts.body }}>Bitte korrigiere folgende Felder:</p>
          {Object.values(errors).map((msg, i) => (
            <p key={i} style={{ margin: "0 0 3px", fontSize: 12, color: "#E65100", fontFamily: fonts.body }}>• {msg}</p>
          ))}
        </div>
      )}

      {/* ── SUBMIT ERROR ────────────────────────────────────── */}
      {errors.submit && (
        <div style={{
          background: colors.redSoft, border: `1px solid #FFD0D0`,
          borderRadius: radius.sm, padding: "12px 16px", marginBottom: 16,
          color: colors.red, fontSize: 14, fontFamily: fonts.body,
        }}>
          {errors.submit}
        </div>
      )}

      {/* ── VORSCHAU ────────────────────────────────────────── */}
      {showPreview && (
        <div style={{
          ...sectionBase,
          background: colors.cream,
          border: `2px solid ${colors.yellow}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: fonts.head, fontSize: 16, color: colors.dark }}>Vorschau</span>
            <button
              onClick={() => setShowPreview(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{
            background: colors.surface, borderRadius: radius.sm,
            overflow: "hidden", border: `1px solid ${colors.border}`,
            maxWidth: 260,
          }}>
            <div style={{ aspectRatio: "4/3", background: colors.warm, overflow: "hidden" }}>
              {images[0]?.preview ? (
                <img src={images[0].preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: colors.mutedLt,
                }}>
                  <Camera size={32} />
                </div>
              )}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <p style={{ fontSize: 14, fontWeight: 600, fontFamily: fonts.body, margin: "0 0 4px", color: colors.dark }}>
                {form.title || "Titel…"}
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: fonts.head, margin: 0, color: colors.dark }}>
                {isFree ? "GRATIS" : `CHF ${form.price || form.start_price || form.rent_price || "0"}`}
              </p>
            </div>
          </div>
          <p style={{ ...hintStyle, marginTop: 12 }}>So sieht dein Inserat in der Suche aus.</p>
        </div>
      )}

      {/* ── BUTTONS ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: "14px 18px", borderRadius: radius.sm,
            border: `1.5px solid ${colors.border}`, background: colors.surface,
            color: colors.muted, fontSize: 14, fontFamily: fonts.body,
            cursor: "pointer", transition: "all .15s",
          }}
        >
          {showPreview ? <><X size={15} style={{ marginRight: 4, verticalAlign: "text-bottom" }} /> Vorschau</> : <><Eye size={15} style={{ marginRight: 4, verticalAlign: "text-bottom" }} /> Vorschau</>}
        </button>

        <button
          onClick={() => handleSubmit(false)}
          disabled={saving}
          style={{
            flex: 1, minWidth: 130, padding: "14px 18px",
            borderRadius: radius.sm,
            border: `1.5px solid ${colors.border}`, background: colors.surface,
            color: colors.dark, fontSize: 14, fontWeight: 700,
            fontFamily: fonts.body, cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1, transition: "all .15s",
          }}
        >
          {saving ? "Speichern…" : "Als Entwurf"}
        </button>

        <button
          onClick={() => handleSubmit(true)}
          disabled={saving}
          style={{
            flex: 1, minWidth: 130, padding: "14px 18px",
            borderRadius: radius.sm, border: "none",
            background: colors.teal, color: "#fff",
            fontSize: 14, fontWeight: 700, fontFamily: fonts.body,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1, transition: "all .15s",
          }}
        >
          {saving ? "Veröffentlichen…" : "Veröffentlichen"}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: "14px 18px", borderRadius: radius.sm,
              border: "none", background: "transparent",
              color: colors.muted, fontSize: 14, fontFamily: fonts.body,
              cursor: "pointer",
            }}
          >
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}
