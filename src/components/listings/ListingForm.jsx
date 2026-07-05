"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import {
  Camera, X, Star, ChevronDown, ChevronRight, Sparkles, Eye, Search,
  Package, Gavel, Home, Truck, MapPin, Gift, Wrench,
  Type, Tag, Clock, SlidersHorizontal, Rocket,
} from "lucide-react";
import { colors, fonts, radius, shadows } from "@/lib/theme";
import {
  CONDITIONS, FEE_TIERS, CANTONS, RENT_PERIODS,
  SHIPPING_PAYERS, PAYMENT_METHODS, BEE_IMPACT_RATE,
} from "@/lib/constants";
import { getRandomBeeTexts, BEE_FEE_SUBTITLES } from "@/lib/bee-fee-texts";
import BeeIcon from "@/components/shared/BeeIcon";
import { checkProfileComplete } from "@/lib/listings";
import { getCategoryAttributes, saveListingAttributes, getListingAttributes, clearListingAttributes } from "@/lib/api/attributes";

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
const MAX_IMG_BYTES = 5 * 1024 * 1024; // 5 MB pro Bild (gleicher Wert wie Upload-Check in listings.js)

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
  borderRadius: radius.xl,
  padding: "26px 24px",
  border: `1px solid ${colors.borderLt}`,
  boxShadow: shadows.card,
  marginBottom: 18,
};

const hintStyle = {
  fontSize: 12,
  color: colors.muted,
  fontFamily: fonts.body,
  marginTop: 4,
};

// ─── Section header: Icon-Chip + Titel (+ Hint, rechter Slot) ──
const SectionHead = ({ icon: Icon, title, hint, right }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
    {Icon && (
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: colors.cream, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} color={colors.teal} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: colors.dark, fontFamily: fonts.body, letterSpacing: ".005em" }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: colors.muted, fontFamily: fonts.body, marginTop: 2 }}>{hint}</div>}
    </div>
    {right}
  </div>
);

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
  const [categoryAttrs, setCategoryAttrs] = useState([]);
  const [attrValues, setAttrValues] = useState({});
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
  const [catModalOpen, setCatModalOpen] = useState(false);
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
  const [selectedSubSubCat, setSelectedSubSubCat] = useState("");
  const subCatsForm = categories.filter((c) => c.parent_id === selectedMainCat);
  const subSubCatsForm = categories.filter((c) => c.parent_id === selectedSubCat);
  const subSubSubCatsForm = categories.filter((c) => c.parent_id === selectedSubSubCat);

  // Sync selectedMainCat from initial category_id (supports 4 levels)
  useEffect(() => {
    if (form.category_id && categories.length > 0) {
      // Walk up the parent chain to find all ancestors
      const chain = [];
      let current = categories.find(c => c.id === form.category_id);
      while (current) {
        chain.unshift(current);
        current = current.parent_id ? categories.find(c => c.id === current.parent_id) : null;
      }
      if (chain.length >= 1) setSelectedMainCat(chain[0].id);
      if (chain.length >= 2) setSelectedSubCat(chain[1].id);
      if (chain.length >= 3) setSelectedSubSubCat(chain[2].id);
    }
  }, [form.category_id, categories]);

  // Load category-specific attributes when category changes
  useEffect(() => {
    if (form.category_id) {
      getCategoryAttributes(form.category_id).then(attrs => {
        setCategoryAttrs(attrs);
        // Only reset values if not editing (to preserve existing values)
        if (!isEdit) setAttrValues({});
      });
    } else {
      setCategoryAttrs([]);
      setAttrValues({});
    }
  }, [form.category_id]);

  // Load existing attribute values for edit mode
  useEffect(() => {
    if (isEdit && initialData?.id) {
      getListingAttributes(initialData.id).then(vals => {
        if (vals && Object.keys(vals).length > 0) setAttrValues(vals);
      });
    }
  }, [isEdit, initialData?.id]);

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
    const all = Array.from(fileList);
    const rejected = all.filter((f) => !f.type.startsWith("image/") || f.size > MAX_IMG_BYTES);
    if (rejected.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: `${rejected.length} Datei(en) übersprungen: nur Bilder (JPG, PNG, WEBP, GIF) bis 5 MB.`,
      }));
    } else {
      setErrors((prev) => { const { images: _drop, ...rest } = prev; return rest; });
    }
    const newImages = all
      .filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMG_BYTES)
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
    if (!(form.description || "").trim()) e.description = "Beschreibung ist erforderlich";
    if (!form.category_id) e.category = "Kategorie ist erforderlich";
    if (!form.condition) e.condition = "Zustand ist erforderlich";
    if (!form.postal_code || !form.city) e.location = "Standort (PLZ/Ort) ist erforderlich";

    // Zahlungsart
    if (!form.pay_twint && !form.pay_bank && !form.pay_cash) e.payment = "Mindestens eine Zahlungsart wählen";

    // Versand / Abholung
    if (!form.shipping_available && !form.pickup_only) e.delivery = "Versand oder Abholung muss aktiviert sein";

    // Typ-spezifisch — Preise müssen gültige Zahlen > 0 sein ("0" oder "abc" reicht nicht)
    const validPrice = (v) => Number.isFinite(parseFloat(v)) && parseFloat(v) > 0;
    if (form.listing_type === "sell" && !isFree && !validPrice(form.price)) e.price = "Gültigen Preis (grösser als 0) eingeben";
    if (form.listing_type === "auction") {
      if (!validPrice(form.start_price)) e.start_price = "Gültigen Startpreis (grösser als 0) eingeben";
      if (form.buy_now_price && parseFloat(form.buy_now_price) <= parseFloat(form.start_price || 0)) e.buy_now_price = "Sofortkauf-Preis muss über dem Startpreis liegen";
      if (!form.auction_duration) e.auction_duration = "Auktionsdauer wählen";
    }
    if (form.listing_type === "rent") {
      if (!validPrice(form.rent_price)) e.rent_price = "Gültigen Mietpreis (grösser als 0) eingeben";
      if (!form.min_rent_days) e.min_rent_days = "Mindest-Mietdauer eingeben";
    }
    if (form.listing_type === "service" && !validPrice(form.rent_price)) e.rent_price = "Gültigen Preis (grösser als 0) eingeben";

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
        // Missbrauchsschutz: kein neues Service-Inserat, solange für einen früheren
        // Service-Auftrag noch keine Rechnung erstellt wurde (Status 'confirmed').
        if (form.listing_type === "service") {
          const { data: uninvoiced } = await supabase
            .from("purchases")
            .select("id, listing:listings!inner(listing_type)")
            .eq("seller_id", session.user.id)
            .eq("status", "confirmed")
            .eq("listing.listing_type", "service")
            .limit(1);
          if (uninvoiced && uninvoiced.length > 0) {
            setErrors({ submit: "Du hast einen offenen Service-Auftrag, für den du noch keine Rechnung erstellt hast. Bitte stelle zuerst die Rechnung, bevor du ein neues Service-Inserat veröffentlichst." });
            return;
          }
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
        attributeValues: attrValues,
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
    <div className="listing-form" style={{ maxWidth: 680, margin: "0 auto", padding: "36px 16px 32px" }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: fonts.head, fontSize: 30, color: colors.dark,
          margin: 0, letterSpacing: ".02em", lineHeight: 1.1,
        }}>
          {isEdit ? "Inserat bearbeiten" : "Neues Inserat"}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ width: 28, height: 3, borderRadius: 2, background: colors.teal }} />
          <p style={{ margin: 0, fontSize: 14, color: colors.muted, fontFamily: fonts.body }}>
            {isEdit ? "Passe dein Inserat an." : "Nicht neu. Nur interessanter."}
          </p>
        </div>
      </div>

      {/* ── WAS BIETEST DU AN? (Typ zuerst) ─────────────────── */}
      <div style={sectionBase} className="lf-section">
        <SectionHead icon={Rocket} title="Was bietest du an?" hint="Wähle die Art deines Inserats." />
        <div style={{
          display: "flex", gap: 0,
          background: colors.cream, borderRadius: radius.md, padding: 4,
        }}>
          {TYPE_TABS.map((t) => {
            const active = form.listing_type === t.value && !isFree;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { set("listing_type", t.value); setIsFree(false); }}
                style={{
                  flex: 1, padding: "12px 8px",
                  borderRadius: radius.sm, border: "none",
                  background: active ? colors.surface : "transparent",
                  boxShadow: active ? shadows.sm : "none",
                  cursor: "pointer", transition: "all .15s",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 5,
                }}
              >
                <Icon size={18} color={active ? colors.teal : colors.muted} />
                <span style={{
                  fontSize: 12.5, fontWeight: active ? 800 : 500,
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
              padding: "12px 14px", borderRadius: radius.md,
              border: `1.5px solid ${isFree ? colors.green : colors.border}`,
              background: isFree ? colors.greenSoft : "transparent",
              cursor: "pointer", marginTop: 12,
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
      </div>

      {/* ── FOTOS (Ricardo-style Slots) ─────────────────────── */}
      <div style={sectionBase} className="lf-section">
        <SectionHead
          icon={Camera}
          title="Fotos"
          hint="Erstes Bild ist das Cover. Bis zu 10 Bilder."
          right={<span style={{ fontSize: 13, fontWeight: 700, color: colors.muted, fontFamily: fonts.body }}>{images.length}/10</span>}
        />

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
      <div style={sectionBase} className="lf-section">
        <SectionHead icon={Type} title="Details" hint="Titel, Zustand, Beschreibung und Kategorie." />
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
          {/* ── RICARDO-STYLE MODAL PICKER ──────────────────── */}
          {(() => {
            // Build category path for display
            const catChain = [];
            let cur = categories.find(c => c.id === form.category_id);
            while (cur) { catChain.unshift(cur); cur = cur.parent_id ? categories.find(c => c.id === cur.parent_id) : null; }
            const catLabel = catChain.map(c => c.name).join(" → ");
            return (
              <>
                {/* Trigger Button */}
                <div onClick={() => setCatModalOpen(true)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${form.category_id ? colors.yellow : colors.border}`,
                  background: form.category_id ? `${colors.yellow}08` : "#fff",
                  transition: "all .15s",
                }}>
                  <span style={{ fontSize: 14, color: form.category_id ? colors.dark : colors.muted, fontWeight: form.category_id ? 600 : 400 }}>
                    {catLabel || "Kategorie wählen..."}
                  </span>
                  <ChevronRight size={16} color={colors.muted} />
                </div>
                {form.category_id && (
                  <button onClick={() => { set("category_id", ""); setSelectedMainCat(""); setSelectedSubCat(""); setSelectedSubSubCat(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: colors.muted, padding: "4px 0", fontFamily: fonts.body }}>
                    Kategorie entfernen
                  </button>
                )}

                {/* Modal */}
                {catModalOpen && (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    onClick={() => setCatModalOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                      background: "#fff", borderRadius: 16, width: "100%", maxWidth: 800,
                      maxHeight: "80vh", display: "flex", flexDirection: "column",
                      fontFamily: fonts.body, boxShadow: "0 20px 60px rgba(0,0,0,.2)",
                    }}>
                      {/* Modal Header */}
                      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Kategorie wählen</h3>
                        <button onClick={() => setCatModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                          <X size={20} />
                        </button>
                      </div>

                      {/* Search */}
                      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.borderLt}` }}>
                        <div style={{ position: "relative" }}>
                          <input type="text" value={catSearch} onChange={e => setCatSearch(e.target.value)}
                            placeholder="Kategorie suchen..." autoFocus
                            style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = colors.yellow}
                            onBlur={e => e.target.style.borderColor = colors.border} />
                          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.muted, pointerEvents: "none" }} />
                        </div>
                        {/* Search Results */}
                        {catSearch.length >= 2 && (
                          <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
                            {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).slice(0, 10).map(c => {
                              const path = [];
                              let p = c;
                              while (p) { path.unshift(p.name); p = p.parent_id ? categories.find(x => x.id === p.parent_id) : null; }
                              return (
                                <div key={c.id} onClick={() => {
                                  set("category_id", c.id);
                                  // Sync all dropdowns
                                  const chain = [];
                                  let walk = c;
                                  while (walk) { chain.unshift(walk); walk = walk.parent_id ? categories.find(x => x.id === walk.parent_id) : null; }
                                  if (chain[0]) setSelectedMainCat(chain[0].id);
                                  if (chain[1]) setSelectedSubCat(chain[1].id);
                                  if (chain[2]) setSelectedSubSubCat(chain[2].id);
                                  setCatSearch("");
                                  setCatModalOpen(false);
                                }} style={{
                                  padding: "10px 12px", cursor: "pointer", borderRadius: 6, marginBottom: 2,
                                  display: "flex", flexDirection: "column",
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = colors.cream}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                                  <span style={{ fontSize: 11, color: colors.muted }}>{path.join(" → ")}</span>
                                </div>
                              );
                            })}
                            {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                              <p style={{ fontSize: 13, color: colors.muted, textAlign: "center", padding: 12 }}>Keine Ergebnisse</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Breadcrumb Path */}
                      {(selectedMainCat || selectedSubCat) && !catSearch && (
                        <div style={{ padding: "8px 20px", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 12 }}>
                          <span onClick={() => { setSelectedMainCat(""); setSelectedSubCat(""); setSelectedSubSubCat(""); }}
                            style={{ color: colors.blue, cursor: "pointer", fontWeight: 600 }}>Alle</span>
                          {(() => {
                            const bc = [];
                            if (selectedMainCat) { const m = categories.find(c => c.id === selectedMainCat); if (m) bc.push({ id: m.id, name: m.name, level: 1 }); }
                            if (selectedSubCat) { const s = categories.find(c => c.id === selectedSubCat); if (s) bc.push({ id: s.id, name: s.name, level: 2 }); }
                            if (selectedSubSubCat) { const ss = categories.find(c => c.id === selectedSubSubCat); if (ss) bc.push({ id: ss.id, name: ss.name, level: 3 }); }
                            return bc.map((b, i) => (
                              <span key={b.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ color: colors.muted }}>/</span>
                                <span onClick={() => {
                                  if (b.level === 1) { setSelectedSubCat(""); setSelectedSubSubCat(""); }
                                  if (b.level === 2) { setSelectedSubSubCat(""); }
                                }}
                                  style={{ color: i === bc.length - 1 ? colors.dark : colors.blue, fontWeight: i === bc.length - 1 ? 700 : 600, cursor: "pointer" }}>
                                  {b.name}
                                </span>
                              </span>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Category Grid */}
                      {!catSearch && (
                        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
                          {(() => {
                            // Determine which categories to show
                            let items = [];
                            let currentParentId = null;
                            if (selectedSubSubCat) {
                              items = categories.filter(c => c.parent_id === selectedSubSubCat);
                              currentParentId = selectedSubSubCat;
                            } else if (selectedSubCat) {
                              items = categories.filter(c => c.parent_id === selectedSubCat);
                              currentParentId = selectedSubCat;
                            } else if (selectedMainCat) {
                              items = categories.filter(c => c.parent_id === selectedMainCat);
                              currentParentId = selectedMainCat;
                            } else {
                              items = parentCats;
                            }

                            if (items.length === 0 && currentParentId) {
                              // Leaf category — auto-select and close
                              return (
                                <p style={{ fontSize: 13, color: colors.muted, textAlign: "center", padding: 20 }}>
                                  Keine weiteren Unterkategorien. Kategorie ist ausgewählt.
                                </p>
                              );
                            }

                            return (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 }}>
                                {/* "Alle in X" option if we're in a subcategory */}
                                {currentParentId && (
                                  <div onClick={() => {
                                    set("category_id", currentParentId);
                                    setCatModalOpen(false);
                                  }} style={{
                                    padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                                    border: `1.5px solid ${colors.yellow}`,
                                    background: colors.yellowSoft,
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                  }}
                                    onMouseEnter={e => e.currentTarget.style.background = colors.yellow + "30"}
                                    onMouseLeave={e => e.currentTarget.style.background = colors.yellowSoft}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>
                                      Alle in dieser Kategorie
                                    </span>
                                  </div>
                                )}
                                {items.map(cat => {
                                  const hasChildren = categories.some(c => c.parent_id === cat.id);
                                  return (
                                    <div key={cat.id} onClick={() => {
                                      if (hasChildren) {
                                        // Navigate deeper
                                        if (!selectedMainCat) { setSelectedMainCat(cat.id); }
                                        else if (!selectedSubCat) { setSelectedSubCat(cat.id); }
                                        else if (!selectedSubSubCat) { setSelectedSubSubCat(cat.id); }
                                        else { set("category_id", cat.id); setCatModalOpen(false); }
                                      } else {
                                        // Leaf — select and close
                                        set("category_id", cat.id);
                                        // Sync states
                                        const chain = [];
                                        let walk = cat;
                                        while (walk) { chain.unshift(walk); walk = walk.parent_id ? categories.find(x => x.id === walk.parent_id) : null; }
                                        if (chain[0]) setSelectedMainCat(chain[0].id);
                                        if (chain[1]) setSelectedSubCat(chain[1].id);
                                        if (chain[2]) setSelectedSubSubCat(chain[2].id);
                                        setCatModalOpen(false);
                                      }
                                    }} style={{
                                      padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                                      border: `1.5px solid ${colors.borderLt}`,
                                      display: "flex", alignItems: "center", justifyContent: "space-between",
                                      transition: "all .1s",
                                    }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.yellow; e.currentTarget.style.background = `${colors.yellow}08`; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.borderLt; e.currentTarget.style.background = "transparent"; }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{cat.name}</span>
                                      {hasChildren && <ChevronRight size={14} color={colors.muted} />}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── KATEGORIE-ATTRIBUTE (dynamisch) ───────────────────── */}
      {categoryAttrs.length > 0 && (
        <div style={sectionBase} className="lf-section">
          <SectionHead icon={SlidersHorizontal} title="Eigenschaften" hint="Zusätzliche Angaben helfen Käufern, dein Inserat schneller zu finden." />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categoryAttrs.map(attr => (
              <div key={attr.id}>
                <label style={{ ...labelBase, fontSize: 12, marginBottom: 4 }}>
                  {attr.name}{attr.unit ? ` (${attr.unit})` : ""}
                  {attr.is_required && <span style={{ color: colors.red, marginLeft: 2 }}>*</span>}
                </label>
                {attr.attribute_type === "select" && attr.options ? (
                  <select
                    value={attrValues[attr.attribute_key] || ""}
                    onChange={e => setAttrValues(prev => ({ ...prev, [attr.attribute_key]: e.target.value }))}
                    style={{ ...inputBase, cursor: "pointer", appearance: "none" }}
                  >
                    <option value="">Bitte wählen</option>
                    {(Array.isArray(attr.options) ? attr.options : []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : attr.attribute_type === "number" ? (
                  <input
                    type="number"
                    value={attrValues[attr.attribute_key] || ""}
                    onChange={e => setAttrValues(prev => ({ ...prev, [attr.attribute_key]: e.target.value }))}
                    placeholder={attr.name}
                    style={inputBase}
                  />
                ) : (
                  <input
                    type="text"
                    value={attrValues[attr.attribute_key] || ""}
                    onChange={e => setAttrValues(prev => ({ ...prev, [attr.attribute_key]: e.target.value }))}
                    placeholder={attr.name}
                    style={inputBase}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PREIS & KONDITIONEN ─────────────────────────────── */}
      <div style={sectionBase} className="lf-section">
        <SectionHead
          icon={Tag}
          title="Preis & Konditionen"
          hint={TYPE_TABS.find((t) => t.value === form.listing_type)?.label || "Festpreis"}
        />

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
      {form.listing_type === "service" ? (
        <div style={sectionBase} className="lf-section">
          <SectionHead icon={Tag} title="Zahlung" hint="Wie möchtest du bezahlt werden?" />

          {/* TWINT Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>TWINT</span>
              <div style={{ fontSize: 11, color: colors.muted }}>Zahlung per TWINT</div>
            </div>
            <button onClick={() => set("pay_twint", !form.pay_twint)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: form.pay_twint ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
            }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.pay_twint ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
          </div>

          {/* Barzahlung Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>Barzahlung</span>
              <div style={{ fontSize: 11, color: colors.muted }}>Zahlung vor Ort in bar</div>
            </div>
            <button onClick={() => set("pay_cash", !form.pay_cash)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: form.pay_cash ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
            }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.pay_cash ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
          </div>

          {/* Banküberweisung Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>Überweisung / Rechnung</span>
              <div style={{ fontSize: 11, color: colors.muted }}>Zahlung per Banküberweisung</div>
            </div>
            <button onClick={() => set("pay_bank", !form.pay_bank)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: form.pay_bank ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
            }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.pay_bank ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
          </div>
          <Err field="payment" />
        </div>
      ) : (
      <div style={sectionBase} className="lf-section">
        <SectionHead icon={Truck} title="Lieferung" hint="Versand- und Abholoptionen. Kosten trägt der Käufer." />

        {/* ─ Versand Toggle ─ */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
          <button onClick={() => {
            const next = !form.shipping_available;
            set("shipping_available", next);
            if (next) { set("pay_bank", true); if (!form.shipping_method) set("shipping_method", "paket"); }
            if (!next) { set("pay_bank", false); if (!form.pickup_only) set("pickup_only", true); }
          }} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", flexShrink: 0,
            background: form.shipping_available ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
          }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.shipping_available ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Versand</span>
        </div>

        {form.shipping_available && (
          <div style={{ padding: "14px 0" }}>
            {/* Summary Card */}
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${colors.borderLt}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Package size={20} color={colors.muted} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>
                      {{ paket: "Paket", brief: "Brief", sperrgut: "Sperrgut", kurier: "Kurier", spediteur: "Spediteur", einschreiben: "Einschreiben", lieferung_verkaeufer: "Lieferung durch Verkäufer" }[form.shipping_method] || "Paket"}
                    </div>
                    <div style={{ fontSize: 12, color: colors.muted }}>
                      {{ paket: `Max. 100 x 60 x 60 cm, ${form.ship_weight || "2kg"}`, brief: "Max. 25 x 35.3 cm", sperrgut: "Max. Länge: 250 cm", kurier: "Lieferung am selben Tag", spediteur: "Schwere/grosse Artikel", einschreiben: "Eingeschriebener Brief", lieferung_verkaeufer: "Persönliche Lieferung" }[form.shipping_method] || ""}
                    </div>
                  </div>
                </div>
                <button onClick={() => set("_shipModal", true)} style={{
                  padding: "6px 14px", borderRadius: 6, border: `1.5px solid ${colors.yellow}`, background: "transparent",
                  color: colors.dark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body,
                  display: "flex", alignItems: "center", gap: 4,
                }}>Bearbeiten</button>
              </div>
              <div style={{ padding: "10px 16px", fontSize: 13, color: colors.muted }}>
                <div style={{ display: "flex", gap: 20 }}>
                  <div><span style={{ fontWeight: 600 }}>Lieferzeit</span><br />{form.ship_speed === "priority" ? "Priority, 1 Werktag" : "Economy, 2-3 Werktage"}</div>
                  <div><span style={{ fontWeight: 600 }}>Versandkosten</span><br />{form.free_shipping ? "Gratis" : `CHF ${form.shipping_cost || "9.00"}`}</div>
                  <div><span style={{ fontWeight: 600 }}>Zahlung</span><br />Vorauszahlung</div>
                </div>
              </div>
            </div>

            {/* TWINT Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>TWINT akzeptieren</span>
                <div style={{ fontSize: 11, color: colors.muted }}>Käufer kann auch mit TWINT bezahlen</div>
              </div>
              <button onClick={() => set("pay_twint", !form.pay_twint)} style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: form.pay_twint ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
              }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.pay_twint ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
            </div>

            {/* ── Versand Modal ── */}
            {form._shipModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => set("_shipModal", false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 480, maxHeight: "80vh", overflow: "auto", padding: 24 }}>

                  {!form._shipStep ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontFamily: fonts.body }}>Versand</h3>
                        <button onClick={() => set("_shipModal", false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                      </div>
                      {[
                        { value: "paket", label: "Paket", desc: "Max. 100 x 60 x 60", icon: Package, hasDetail: true },
                        { value: "brief", label: "Brief", desc: "max. 25 x 35.3 cm", icon: Package, hasDetail: true },
                        { value: "sperrgut", label: "Sperrgut", desc: "Max. Länge: 250 cm", icon: Package, hasDetail: true },
                        { value: "andere", label: "Andere Versandarten", desc: "", icon: Package, hasDetail: true },
                      ].map(opt => (
                        <div key={opt.value} onClick={() => {
                          if (opt.value === "andere") { set("_shipStep", "andere"); }
                          else { set("shipping_method", opt.value); set("_shipStep", opt.value); }
                        }} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "16px", borderRadius: 8, border: `1.5px solid ${form.shipping_method === opt.value ? colors.yellow : colors.border}`,
                          marginBottom: 8, cursor: "pointer", background: form.shipping_method === opt.value ? colors.yellowSoft : "#fff",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {form.shipping_method === opt.value && <div style={{ width: 18, height: 18, borderRadius: 4, background: colors.yellow, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span></div>}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
                              {opt.desc && <div style={{ fontSize: 12, color: colors.muted }}>{opt.desc}</div>}
                            </div>
                          </div>
                          <span style={{ color: colors.muted }}>›</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                        <button onClick={() => set("_shipModal", false)} style={{ padding: "8px 20px", borderRadius: 6, border: `1.5px solid ${colors.border}`, background: "transparent", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                      </div>
                    </>
                  ) : form._shipStep === "andere" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontFamily: fonts.body }}>Andere Versandarten</h3>
                        <button onClick={() => set("_shipModal", false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                      </div>
                      <label style={{ ...labelBase, fontSize: 13 }}>Versandarten</label>
                      <select value={form.shipping_method} onChange={e => set("shipping_method", e.target.value)} style={{ ...inputBase, marginBottom: 14 }}>
                        <option value="">Wählen...</option>
                        <option value="kurier">Kurier</option>
                        <option value="spediteur">Spediteur</option>
                        <option value="einschreiben">Einschreiben</option>
                        <option value="lieferung_verkaeufer">Lieferung durch Verkäufer</option>
                      </select>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>Kostenloser Versand</div><div style={{ fontSize: 12, color: colors.muted }}>Die Lieferkosten sind für Käufer kostenlos.</div></div>
                        <button onClick={() => set("free_shipping", !form.free_shipping)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.free_shipping ? colors.yellow : "#ccc", position: "relative" }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.free_shipping ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
                      </div>
                      {!form.free_shipping && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>Versandkosten</div>
                          <div style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Getragen vom Käufer</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13, color: colors.muted }}>CHF</span><input style={{ ...inputBase, width: 100 }} type="number" min="0" step="0.50" value={form.shipping_cost} onChange={e => set("shipping_cost", e.target.value)} /></div>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <button onClick={() => set("_shipStep", "")} style={{ padding: "8px 20px", borderRadius: 6, border: `1.5px solid ${colors.border}`, background: "transparent", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Zurück</button>
                        <button onClick={() => { set("_shipStep", ""); set("_shipModal", false); }} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: colors.teal, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontFamily: fonts.body }}>{{ paket: "Paket", brief: "Brief", sperrgut: "Sperrgut" }[form._shipStep]}</h3>
                        <button onClick={() => set("_shipModal", false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                      </div>
                      <div style={{ padding: "10px 14px", background: colors.cream, borderRadius: 8, marginBottom: 16, fontSize: 13, color: colors.muted, textAlign: "center" }}>
                        {{ paket: "Max. Grösse: 100 x 60 x 60 cm", brief: "Max. Grösse: 25 x 35.3 cm", sperrgut: "Max. Länge: 250 cm" }[form._shipStep]}
                      </div>
                      {form._shipStep === "paket" && (
                        <>
                          <label style={{ ...labelBase, fontSize: 13 }}>Gewicht</label>
                          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                            {["bis 2kg", "bis 10kg", "bis 30kg"].map(w => {
                              const price = POST_TARIFE.paket?.[form.ship_speed || "economy"]?.[w] || 0;
                              return (
                                <Chip key={w} active={form.ship_weight === w} onClick={() => { set("ship_weight", w); set("shipping_cost", price.toFixed(2)); }}>
                                  {w} <span style={{ fontSize: 10, opacity: .7, marginLeft: 2 }}>CHF {price.toFixed(2)}</span>
                                </Chip>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {form._shipStep === "brief" && (
                        <>
                          <label style={{ ...labelBase, fontSize: 13 }}>Format</label>
                          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                            {["Standard", "Gross", "Maxi"].map(w => {
                              const price = POST_TARIFE.brief?.[form.ship_speed || "economy"]?.[w] || 0;
                              return (
                                <Chip key={w} active={form.ship_weight === w} onClick={() => { set("ship_weight", w); set("shipping_cost", price.toFixed(2)); }}>
                                  {w} <span style={{ fontSize: 10, opacity: .7, marginLeft: 2 }}>CHF {price.toFixed(2)}</span>
                                </Chip>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {form._shipStep === "sperrgut" && (
                        <>
                          <label style={{ ...labelBase, fontSize: 13 }}>Gewicht</label>
                          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                            {["bis 30kg", "bis 60kg"].map(w => {
                              const price = POST_TARIFE.sperrgut?.[form.ship_speed || "economy"]?.[w] || 0;
                              return (
                                <Chip key={w} active={form.ship_weight === w} onClick={() => { set("ship_weight", w); set("shipping_cost", price.toFixed(2)); }}>
                                  {w} <span style={{ fontSize: 10, opacity: .7, marginLeft: 2 }}>CHF {price.toFixed(2)}</span>
                                </Chip>
                              );
                            })}
                          </div>
                        </>
                      )}
                      <label style={{ ...labelBase, fontSize: 13 }}>Lieferzeit</label>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <Chip active={form.ship_speed !== "priority"} onClick={() => {
                          set("ship_speed", "economy");
                          const t = POST_TARIFE[form._shipStep]?.["economy"]?.[form.ship_weight] || 0;
                          if (t) set("shipping_cost", t.toFixed(2));
                        }}>Economy</Chip>
                        <Chip active={form.ship_speed === "priority"} onClick={() => {
                          set("ship_speed", "priority");
                          const t = POST_TARIFE[form._shipStep]?.["priority"]?.[form.ship_weight] || 0;
                          if (t) set("shipping_cost", t.toFixed(2));
                        }}>Priority</Chip>
                      </div>
                      <p style={{ ...hintStyle, marginBottom: 16 }}>{form.ship_speed === "priority" ? "1 Werktag" : "2 - 3 Werktage"}</p>

                      {(() => {
                        const tariffBase = POST_TARIFE[form._shipStep]?.[form.ship_speed || "economy"]?.[form.ship_weight] || 0;
                        const tariffMax = tariffBase + MAX_MARKUP;
                        return (
                        <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>Kostenloser Versand</div><div style={{ fontSize: 12, color: colors.muted }}>Die Lieferkosten sind für Käufer kostenlos.</div></div>
                        <button onClick={() => set("free_shipping", !form.free_shipping)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.free_shipping ? colors.yellow : "#ccc", position: "relative" }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.free_shipping ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
                      </div>
                      {!form.free_shipping && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Versandkosten</div><div style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Getragen vom Käufer</div></div>
                            {tariffBase > 0 && <div style={{ fontSize: 11, color: colors.muted }}>Post-Tarif: CHF {tariffBase.toFixed(2)} · Max: CHF {tariffMax.toFixed(2)}</div>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, color: colors.muted }}>CHF</span>
                            <input style={{ ...inputBase, width: 100 }} type="number" min={tariffBase || 0} max={tariffBase > 0 ? tariffMax : 999} step="0.50" value={form.shipping_cost} onChange={e => {
                              let val = parseFloat(e.target.value) || 0;
                              if (tariffBase > 0 && val > tariffMax) val = tariffMax;
                              if (tariffBase > 0 && val < tariffBase) val = tariffBase;
                              set("shipping_cost", val.toFixed(2));
                            }} />
                          </div>
                          {tariffBase > 0 && Number(form.shipping_cost) > tariffBase && <p style={{ ...hintStyle, marginTop: 4, fontSize: 11 }}>+CHF {(Number(form.shipping_cost) - tariffBase).toFixed(2)} Aufschlag (max. CHF {MAX_MARKUP.toFixed(2)})</p>}
                        </div>
                      )}
                        </>
                        );
                      })()}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <button onClick={() => set("_shipStep", "")} style={{ padding: "8px 20px", borderRadius: 6, border: `1.5px solid ${colors.border}`, background: "transparent", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Zurück</button>
                        <button onClick={() => { set("_shipStep", ""); set("_shipModal", false); }} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: colors.teal, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ Abholung Toggle ─ */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
          <button onClick={() => {
            const next = !form.pickup_only;
            set("pickup_only", next);
            if (!next && !form.shipping_available) set("shipping_available", true);
          }} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", flexShrink: 0,
            background: form.pickup_only ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
          }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.pickup_only ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Abholung</span>
        </div>

        {form.pickup_only && (
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${colors.borderLt}` }}>
              <MapPin size={20} color={colors.muted} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Abholung</div>
                <div style={{ fontSize: 12, color: colors.muted }}>Die in deinem Benutzerkonto gespeicherte Adresse gilt als Abholadresse</div>
              </div>
            </div>
            <div style={{ padding: "10px 16px", fontSize: 13, color: colors.muted }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "6px 12px" }}>
                <span style={{ fontWeight: 600 }}>Abholadresse</span>
                <span>{profileAddr.street || "Keine Adresse hinterlegt"}{profileAddr.street && <><br />{profileAddr.postal_code} {profileAddr.city}</>}</span>
                <span style={{ fontWeight: 600 }}>Versandkosten</span>
                <span>Gratis</span>
                <span style={{ fontWeight: 600 }}>Zahlung</span>
                <span>Barzahlung bei Übergabe</span>
              </div>
              {!profileAddr.street && <p style={{ ...hintStyle, marginTop: 8, color: "#c62828" }}>Bitte hinterlege deine Adresse in den <a href="/settings" style={{ color: colors.yellow, fontWeight: 700 }}>Einstellungen</a>.</p>}
            </div>
          </div>
        )}

        {!form.shipping_available && !form.pickup_only && (
          <p style={{ ...hintStyle, color: "#c62828", marginTop: 8 }}>Mindestens eine Übergabeart muss aktiv sein.</p>
        )}
      </div>
      )}

      {/* ── BEE-RATE (Ricardo-Style elegant) ─────────────────── */}
      {!isFree && effectiveType !== "free" && (
        <div style={sectionBase} className="lf-section">
          <label style={{ ...labelBase, fontFamily: fonts.head, fontSize: 20, letterSpacing: ".04em" }}>DEIN BEE-IMPACT</label>
          <p style={{ margin: "0 0 6px", fontSize: 14, color: colors.dark, fontFamily: fonts.body, lineHeight: 1.5 }}>
            Jeder Verkauf schützt Bienen und Natur in der Schweiz. Je grösser, desto mehr bewirkst du.
          </p>
          <p style={{ ...hintStyle, marginTop: 0, marginBottom: 16, fontSize: 11 }}>
            Die Gebühr fällt nur bei erfolgreichem Verkauf an und wird vom Erlös abgezogen. 20% fliessen in echte Schweizer Naturschutzprojekte. Höherer Impact = bessere Platzierung.
          </p>
          {[
            { tier: "fair", pct: 3, impact: 1, project: "Pocket Parks: Wildblumeninseln in deiner Gemeinde", perks: "1× Pollen · Standard-Platzierung" },
            { tier: "supporter", pct: 5, impact: 2, project: "Reussspitz: Habitatvernetzung im Mittelland", perks: "1,4× Pollen · bessere Platzierung" },
            { tier: "impact", pct: 7, impact: 3, project: "IG Wilde Biene: Artenkartierung Zentralschweiz", recommended: true, perks: "1,8× Pollen · Top-Platzierung" },
            { tier: "hero", pct: 10, impact: 4, project: "Bee-Finder App: Meldeplattform für Wildbienen", perks: "2,5× Pollen · Top-Platzierung · grösster Bienen-Beitrag" },
          ].map(({ tier, pct, impact, project, recommended, perks }) => {
            const active = form.fee_tier === tier;
            return (
              <div key={tier} onClick={() => selectFee(pct, tier)} style={{
                position: "relative", padding: "18px 50px 18px 22px", marginBottom: 8, borderRadius: 14, cursor: "pointer",
                border: `2px solid ${active ? colors.green : "transparent"}`,
                background: active ? `linear-gradient(135deg, ${colors.surface}, ${colors.green}08)` : colors.surface,
                boxShadow: active ? `0 2px 16px ${colors.green}18` : "0 1px 3px rgba(0,0,0,.04)",
                transition: "all .2s ease", overflow: "hidden",
              }}>
                {/* Left accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderRadius: "14px 0 0 14px",
                  background: active ? `linear-gradient(180deg, ${colors.green}, ${colors.yellow})` : colors.borderLt,
                  transition: "all .2s",
                }} />
                {/* Radio indicator — vertically centered */}
                <div style={{
                  position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)",
                  width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${active ? colors.green : colors.borderLt}`,
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s",
                }}>
                  {active && <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.green }} />}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, paddingLeft: 8 }}>
                    {/* Title row with impact dots */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: i <= impact ? (active ? colors.green : colors.yellow) : `${colors.muted}25`,
                            transition: "all .2s",
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 800, color: colors.dark, fontFamily: fonts.body }}>{beeTexts[tier]}</span>
                      {recommended && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
                          padding: "3px 8px", borderRadius: 4, background: colors.green, color: "#fff", flexShrink: 0,
                        }}>Empfohlen</span>
                      )}
                    </div>
                    {/* Subtitle */}
                    <p style={{ margin: "0 0 4px", paddingLeft: 44, fontSize: 13, color: colors.muted, fontFamily: fonts.body, fontStyle: "italic", lineHeight: 1.4 }}>
                      {BEE_FEE_SUBTITLES[tier]}
                    </p>
                    {/* Perks — was du dafür bekommst */}
                    <p style={{ margin: "0 0 6px", paddingLeft: 44, fontSize: 11.5, fontWeight: 700, color: colors.teal, fontFamily: fonts.body, lineHeight: 1.4 }}>
                      {perks}
                    </p>
                    {/* Project tag (only when selected) */}
                    {active && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6,
                        background: `${colors.green}12`, marginLeft: 44, fontSize: 11, fontWeight: 600, color: colors.green,
                      }}>
                        <BeeIcon size={12} color={colors.green} />
                        {project}
                      </div>
                    )}
                  </div>
                  {/* Right: percentage only */}
                  <div style={{ textAlign: "right", flexShrink: 0, paddingRight: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: active ? colors.green : colors.muted, fontFamily: fonts.body }}>{pct}%</p>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Cost breakdown */}
          {form.fee_percentage > 0 && parseFloat(form.price || 0) > 0 && (() => {
            const price = parseFloat(form.price);
            const fee = price * form.fee_percentage / 100;
            const platform = fee * 0.8;
            const beeImpact = fee * 0.2;
            return (
              <div style={{ marginTop: 8, padding: "14px 20px", background: colors.cream, borderRadius: 12, border: `1px solid ${colors.borderLt}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
                  <span>Plattformgebühr ({(form.fee_percentage * 0.8).toFixed(1)}%)</span>
                  <span>CHF {platform.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${colors.borderLt}`, fontFamily: fonts.body }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.green, display: "flex", alignItems: "center", gap: 6 }}>
                    <BeeIcon size={14} color={colors.green} />
                    Bee-Impact ({(form.fee_percentage * 0.2).toFixed(1)}%)
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: colors.green }}>CHF {beeImpact.toFixed(2)}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: colors.muted, fontFamily: fonts.body }}>
                  Fliesst direkt in echte Schweizer Naturschutzprojekte. Du erhältst Bee-Level Credits.
                </p>
              </div>
            );
          })()}
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

      {/* ── LAUFZEIT-HINWEIS ────────────────────────────────── */}
      {!isFree && effectiveType !== "free" && (
        <div className="lf-section" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", marginBottom: 18, borderRadius: radius.lg,
          background: colors.cream, border: `1px solid ${colors.borderLt}`,
        }}>
          <Clock size={18} color={colors.teal} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.body, lineHeight: 1.45 }}>
            {effectiveType === "auction" ? (
              <>Diese Auktion läuft <b style={{ color: colors.dark }}>{form.auction_duration} Tage</b> und endet danach automatisch.</>
            ) : (
              <>Dein Inserat läuft <b style={{ color: colors.dark }}>60 Tage</b>. Danach verlängerst du es in <b style={{ color: colors.dark }}>Meine Inserate</b> mit einem Klick.</>
            )}
          </div>
        </div>
      )}

      {/* ── STICKY ACTION-BAR ───────────────────────────────── */}
      <div className="lf-actionbar" style={{
        position: "sticky", bottom: 0, zIndex: 30,
        margin: "8px -16px 0", padding: "14px 16px",
        background: "rgba(249,244,236,.92)", borderTop: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            title="Vorschau"
            style={{
              padding: "13px 16px", borderRadius: radius.md,
              border: `1.5px solid ${colors.border}`, background: colors.surface,
              color: colors.muted, fontSize: 14, fontFamily: fonts.body,
              cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {showPreview ? <X size={16} /> : <Eye size={16} />} Vorschau
          </button>

          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            style={{
              padding: "13px 18px", borderRadius: radius.md,
              border: `1.5px solid ${colors.border}`, background: colors.surface,
              color: colors.dark, fontSize: 14, fontWeight: 700,
              fontFamily: fonts.body, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1, transition: "all .15s",
            }}
          >
            {saving ? "Speichern…" : "Entwurf"}
          </button>

          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            style={{
              flex: 1, minWidth: 150, padding: "13px 18px",
              borderRadius: radius.md, border: "none",
              background: colors.teal, color: "#fff",
              fontSize: 14.5, fontWeight: 800, fontFamily: fonts.body,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1, transition: "all .15s",
              boxShadow: saving ? "none" : `0 4px 14px ${colors.teal}33`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <Rocket size={16} /> {saving ? "Veröffentlichen…" : "Veröffentlichen"}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: "13px 14px", borderRadius: radius.md,
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
    </div>
  );
}
