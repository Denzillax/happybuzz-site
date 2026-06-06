"use client";
import { useState, useRef, useCallback } from "react";
import FeeModel from "./FeeModel";

const T = {
  honey: "#F4C03F", honeyHover: "#E0AF2E", honeySoft: "#FDF6E3",
  dark: "#191615", bg: "#F9F4EC", surface: "#FFFFFF", warm: "#F4EFE6",
  border: "#E8E2D8", borderLt: "#F0EBE2", text: "#191615",
  textMd: "#5C5753", textLt: "#9A9490", green: "#5B8C5A", greenSoft: "#EDF5EC",
  blue: "#94B9C9", blueSoft: "#EBF3F7", red: "#D94444",
  radius: 12, rSm: 8, font: "'Plus Jakarta Sans', system-ui, sans-serif",
};

/* ── Icons ── */
const IC = {
  camera: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  tag: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m20.6 9.4-8-8A2 2 0 0 0 11.2 1H4a2 2 0 0 0-2 2v7.2c0 .5.2 1 .6 1.4l8 8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg>,
  gavel: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="m14.5 3.5 6 6M4 20l6.5-6.5M2 22l2-2M14.5 9.5 9.5 14.5M9.5 3.5l6 6-6 6-6-6z"/></svg>,
  truck: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  bee: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><ellipse cx="12" cy="14" rx="6" ry="7"/><path d="M9 11h6M9 14h6"/><circle cx="9" cy="8" r="3"/><circle cx="15" cy="8" r="3"/><path d="M10 3c-1-2 1-3 2-2M14 3c1-2-1-3-2-2"/></svg>,
  check: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>,
  back: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  arrow: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  info: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  leaf: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.1 17 3.1s2 6.9 2 12.8c0 1.1-.1 2.1-.3 3.1M6.7 17.3l4.3-4.3"/></svg>,
  plus: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  x: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  img: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill="#F4C03F" stroke="#F4C03F" strokeWidth="1"/></svg>,
  eye: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

/* ── Small UI helpers ── */
const Btn = ({ children, primary, small, full, onClick, style: sx }) => (
  <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "7px 16px" : "11px 24px", borderRadius: T.rSm, border: "none", cursor: "pointer", background: primary ? T.honey : T.surface, color: primary ? "#fff" : T.textMd, fontSize: small ? 12.5 : 14, fontWeight: 700, fontFamily: T.font, transition: "all .15s", width: full ? "100%" : "auto", boxShadow: primary ? "none" : `inset 0 0 0 1.5px ${T.border}`, ...sx }}>{children}</button>
);
const Lbl = ({ children, req }) => <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: T.textMd, marginBottom: 4 }}>{children}{req && <span style={{ color: T.honey }}>*</span>}</label>;
const Hint = ({ children }) => <p style={{ fontSize: 10.5, color: T.textLt, margin: "4px 0 0", lineHeight: 1.4 }}>{children}</p>;
const Inp = ({ label, req, hint, ...p }) => (<div><Lbl req={req}>{label}</Lbl><input {...p} style={{ width: "100%", padding: "10px 14px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`, fontSize: 13, outline: "none", fontFamily: T.font, boxSizing: "border-box", transition: "border .15s", ...(p.style || {}) }} onFocus={e => e.target.style.borderColor = T.honey} onBlur={e => e.target.style.borderColor = T.border} />{hint && <Hint>{hint}</Hint>}</div>);
const Sel = ({ label, req, value, onChange, children, hint }) => (<div><Lbl req={req}>{label}</Lbl><select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`, fontSize: 13, outline: "none", background: T.surface, fontFamily: T.font, boxSizing: "border-box" }}><option value="">Bitte wählen...</option>{children}</select>{hint && <Hint>{hint}</Hint>}</div>);
const Toggle = ({ opts, value, onChange }) => (<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{opts.map(o => <button key={o.k} onClick={() => onChange(o.k)} style={{ flex: 1, minWidth: 0, padding: "9px 8px", borderRadius: T.rSm, fontSize: 12, fontWeight: value === o.k ? 700 : 500, cursor: "pointer", fontFamily: T.font, border: `1.5px solid ${value === o.k ? T.honey : T.border}`, background: value === o.k ? T.honeySoft : T.surface, color: value === o.k ? T.dark : T.textMd, transition: "all .15s", whiteSpace: "nowrap" }}>{o.l}</button>)}</div>);
const Check = ({ label, checked, onChange }) => (<label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.textMd, cursor: "pointer" }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: T.honey, width: 16, height: 16 }} />{label}</label>);
const SectionHead = ({ icon, n, children }) => (<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: T.honeySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.honey }}>{n}</div><span style={{ color: T.honey, display: "flex" }}>{icon}</span><h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>{children}</h3></div>);
const Divider = () => <div style={{ borderTop: `1px solid ${T.border}`, margin: "4px 0" }} />;
const Badge = ({ children, bg = T.warm, color = T.textMd }) => (<span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, background: bg, color, fontSize: 11, fontWeight: 700, lineHeight: 1.4 }}>{children}</span>);

/* ── MAIN COMPONENT ── */
export default function ListingForm({ initialData, categories = [], onSave, onCancel, isEdit }) {
  const fileRef = useRef(null);

  // Form state (pre-filled for edit)
  const [step, setStep] = useState("form"); // form | preview | done
  const [type, setType] = useState(initialData?.listing_type === "rent" ? "rent" : initialData?.listing_type === "sell" ? "fixed" : "fixed");
  const [fee, setFee] = useState(initialData?.feeTier || "supporter");
  const [customFee, setCustomFee] = useState("");
  const [title, setTitle] = useState(initialData?.title || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [zustand, setZustand] = useState(initialData?.conditionLabel || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [mietpreis, setMietpreis] = useState(initialData?.rent_price?.toString() || "");
  const [mietdauer, setMietdauer] = useState(initialData?.rentPeriodLabel || "Pro Tag");
  const [kaution, setKaution] = useState(initialData?.deposit_amount?.toString() || "");
  const [verhandel, setVerhandel] = useState(initialData?.is_negotiable || false);
  const [plz, setPlz] = useState(initialData?.postal_code || "");
  const [ort, setOrt] = useState(initialData?.city || "");
  const [versand, setVersand] = useState(initialData?.shipping_available || false);
  const [abholung, setAbholung] = useState(initialData?.pickup_only !== false);
  const [versandkosten, setVersandkosten] = useState(initialData?.shipping_cost?.toString() || "");
  const [agree, setAgree] = useState(false);
  const [imgs, setImgs] = useState(initialData?.images || []);
  const [newFiles, setNewFiles] = useState([]); // Files to upload
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Computed price for fee model
  const activePrice = parseFloat(type === "rent" ? mietpreis : price) || 0;
  const feePct = fee === "custom"
    ? Math.max(parseFloat(customFee) || 3, 3)
    : ({ fair: 3, supporter: 5, impact: 7, hero: 10 }[fee] || 5);
  const beeRate = { fair: 0.20, supporter: 0.25, impact: 0.30, hero: 0.35, custom: 0.30 }[fee] || 0.25;
  const feeAmt = activePrice * feePct / 100;
  const beeAmt = feeAmt * beeRate;

  // ── Image handling ──
  const addFiles = (files) => {
    const allowed = 10 - imgs.length - newFiles.length;
    const toAdd = Array.from(files).slice(0, allowed).map(f => ({
      id: "new-" + Date.now() + Math.random(),
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
      isNew: true,
    }));
    setNewFiles(prev => [...prev, ...toAdd]);
  };
  const removeNew = (id) => setNewFiles(prev => prev.filter(f => f.id !== id));
  const removeExisting = (id) => setImgs(prev => prev.filter(f => f.id !== id));

  const allImages = [...imgs, ...newFiles];
  const handleDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = true;
    if (!zustand) e.zustand = true;
    if (type === "fixed" && (!price || parseFloat(price) <= 0)) e.price = true;
    if (type === "rent" && (!mietpreis || parseFloat(mietpreis) <= 0)) e.mietpreis = true;
    if (!ort.trim()) e.ort = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (publish) => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        title, desc, type, zustand, categoryId,
        price: type === "fixed" ? price : "",
        mietpreis: type === "rent" ? mietpreis : "",
        mietdauer, kaution, verhandel,
        plz, ort, versand, abholung, versandkosten,
        fee, customFee,
        publish,
        newFiles,
        removedImageIds: initialData?.images
          ?.filter(img => !imgs.find(i => i.id === img.id))
          ?.map(img => ({ id: img.id, storagePath: img.storage_path })) || [],
      });
      setStep("done");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════
  // DONE SCREEN
  // ═══════════════════════════════════════
  if (step === "done") return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.green, marginBottom: 16 }}>{IC.check}</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: "0 0 6px" }}>
        {isEdit ? "Inserat aktualisiert!" : "Inserat veröffentlicht!"}
      </h2>
      <p style={{ fontSize: 14, color: T.textMd, margin: "0 0 8px" }}>Dein Artikel ist jetzt live auf BEEDARO</p>
      {activePrice > 0 && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.greenSoft, borderRadius: T.rSm, padding: "8px 16px", fontSize: 12, color: T.green, marginBottom: 20 }}>
          {IC.leaf} CHF {beeAmt.toFixed(2)} deines Beitrags gehen an den Bienenschutz.
        </div>
      )}
      <div><Btn primary onClick={onCancel}>Zu meinen Inseraten</Btn></div>
    </div>
  );

  // ═══════════════════════════════════════
  // PREVIEW
  // ═══════════════════════════════════════
  if (step === "preview") return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 0 60px" }}>
      <button onClick={() => setStep("form")} style={{ background: "none", border: "none", color: T.textMd, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20, fontFamily: T.font, display: "flex", alignItems: "center", gap: 4 }}>{IC.back} Zurück bearbeiten</button>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: "0 0 4px" }}>Vorschau deines Inserats</h1>
      <p style={{ fontSize: 13, color: T.textMd, margin: "0 0 24px" }}>Prüfe alle Angaben bevor du veröffentlichst.</p>

      {/* Preview card */}
      <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: allImages.length > 0 ? "180px 1fr" : "1fr" }}>
          {allImages.length > 0 ? (
            <div style={{ background: T.warm, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, overflow: "hidden" }}>
              <img src={allImages[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{ background: T.warm, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120, color: T.textLt }}>{IC.camera}</div>
          )}
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <Badge bg={type === "rent" ? T.blueSoft : T.greenSoft} color={type === "rent" ? T.blue : T.green}>
                {type === "rent" ? "Vermietung" : "Festpreis"}
              </Badge>
              {zustand && <Badge>{zustand}</Badge>}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: "0 0 6px", lineHeight: 1.25 }}>{title || "Kein Titel"}</h2>
            <p style={{ fontSize: 26, fontWeight: 900, color: T.text, margin: "0 0 4px" }}>
              CHF {activePrice.toLocaleString("de-CH", { minimumFractionDigits: 2 })}
              {type === "rent" && <span style={{ fontSize: 13, fontWeight: 600, color: T.textLt }}> / {mietdauer.replace("Pro ", "")}</span>}
            </p>
            {verhandel && <p style={{ fontSize: 12, color: T.textMd, margin: 0 }}>Preis verhandelbar</p>}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "18px 20px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: "0 0 12px" }}>Zusammenfassung</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
          {[
            { k: "Zustand", v: zustand || "–" },
            { k: "Standort", v: [plz, ort].filter(Boolean).join(" ") || "–" },
            { k: "Versand", v: versand ? "Ja" + (versandkosten ? ` (CHF ${versandkosten})` : "") : "Nein" },
            { k: "Abholung", v: abholung ? "Ja" : "Nein" },
            { k: "Bilder", v: `${allImages.length} Bilder` },
          ].map((r, i, a) => (
            <tr key={r.k} style={{ borderBottom: i < a.length - 1 ? `1px solid ${T.borderLt}` : "none" }}>
              <td style={{ padding: "8px 10px 8px 0", fontSize: 12, color: T.textMd, width: "38%" }}>{r.k}</td>
              <td style={{ padding: "8px 0", fontSize: 12, fontWeight: 600, color: T.text }}>{r.v}</td>
            </tr>
          ))}
        </tbody></table>
      </div>

      {/* Fee summary */}
      <div style={{ background: T.honeySoft, borderRadius: T.rSm, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Plattformbeitrag: {feePct}%</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: T.honey }}>CHF {feeAmt.toFixed(2)}</span>
        </div>
        <p style={{ fontSize: 11.5, color: T.green, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>{IC.leaf} Davon CHF {beeAmt.toFixed(2)} für Bienenschutz</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn style={{ flex: 1 }} onClick={() => setStep("form")}>{IC.back} Bearbeiten</Btn>
        <Btn primary style={{ flex: 2 }} onClick={() => handleSubmit(true)}>
          {saving ? "Wird veröffentlicht…" : <>{IC.check} Jetzt veröffentlichen</>}
        </Btn>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 0 60px" }}>

      {/* Intro banner */}
      <div style={{ background: `linear-gradient(135deg,${T.honeySoft},${T.greenSoft})`, borderRadius: T.radius, padding: "22px 24px", marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: "0 0 4px" }}>
          {isEdit ? "Inserat bearbeiten" : "Verkaufe fair. Unterstütze Bienen."}
        </h1>
        <p style={{ fontSize: 13, color: T.textMd, margin: "0 0 12px", lineHeight: 1.5 }}>
          {isEdit
            ? "Ändere die Details deines Inserats."
            : "Erstelle dein Inserat in wenigen Minuten. Du wählst deinen Plattformbeitrag selbst — ein Teil fliesst in den Bienenschutz."}
        </p>
        {!isEdit && (
          <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: T.textMd, flexWrap: "wrap" }}>
            {["Keine fixen hohen Gebühren", "Du wählst deinen Beitrag", "Jeder Verkauf hilft Bienen"].map(t =>
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>{IC.check} {t}</span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

        {/* ── 1. BILDER ── */}
        <SectionHead icon={IC.camera} n="1">Bilder</SectionHead>
        <div>
          <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            onClick={() => allImages.length < 10 && fileRef.current?.click()}
            style={{
              border: `2px dashed ${allImages.length ? T.border : T.honey}`,
              borderRadius: T.radius, padding: allImages.length ? "12px" : "28px 20px",
              textAlign: "center", cursor: allImages.length < 10 ? "pointer" : "default",
              background: allImages.length ? "transparent" : T.honeySoft, transition: "all .15s",
            }}>
            {allImages.length === 0 ? <>
              <div style={{ color: T.honey, marginBottom: 6, display: "flex", justifyContent: "center" }}>{IC.camera}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 3px" }}>Bilder hierher ziehen oder klicken</p>
              <p style={{ fontSize: 11, color: T.textLt, margin: 0 }}>Bis zu 10 Bilder. Das erste wird als Titelbild verwendet.</p>
            </> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                {allImages.map((img, i) => (
                  <div key={img.id} style={{ aspectRatio: "1", borderRadius: T.rSm, overflow: "hidden", position: "relative",
                    border: i === 0 ? `2px solid ${T.honey}` : `1px solid ${T.border}` }}>
                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {i === 0 && <span style={{ position: "absolute", bottom: 3, left: 3, fontSize: 8, fontWeight: 700, background: T.honey, color: "#fff", padding: "1px 5px", borderRadius: 4 }}>Titelbild</span>}
                    <button onClick={e => { e.stopPropagation(); img.isNew ? removeNew(img.id) : removeExisting(img.id); }}
                      style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.55)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>{IC.x}</button>
                  </div>
                ))}
                {allImages.length < 10 && (
                  <div onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                    style={{ aspectRatio: "1", border: `2px dashed ${T.border}`, borderRadius: T.rSm, display: "flex", alignItems: "center", justifyContent: "center", color: T.textLt, cursor: "pointer" }}>{IC.plus}</div>
                )}
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
        </div>

        <Divider />

        {/* ── 2. ARTIKELDETAILS ── */}
        <SectionHead icon={IC.tag} n="2">Artikeldetails</SectionHead>
        <Sel label="Kategorie" req value={categoryId} onChange={setCategoryId}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Sel>
        <Inp label="Titel" req value={title} onChange={e => setTitle(e.target.value)}
          placeholder="z.B. iPhone 15 Pro 256GB, sehr guter Zustand"
          hint="Nenne Marke, Modell, Grösse und Zustand."
          style={errors.title ? { borderColor: T.red } : {}} />
        <div>
          <Lbl req>Beschreibung</Lbl>
          <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Beschreibe Zustand, Zubehör, Mängel, Abholung oder Versand."
            style={{ width: "100%", padding: "10px 14px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`, fontSize: 13, outline: "none", resize: "vertical", fontFamily: T.font, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = T.honey}
            onBlur={e => e.target.style.borderColor = T.border} />
          <Hint>Je detaillierter, desto weniger Rückfragen.</Hint>
        </div>
        <div>
          <Lbl req>Zustand</Lbl>
          <Toggle opts={[{ k: "Neu", l: "Neu" }, { k: "Wie neu", l: "Wie neu" }, { k: "Gut", l: "Gut" }, { k: "Gebraucht", l: "Gebraucht" }, { k: "Defekt", l: "Defekt" }]} value={zustand} onChange={setZustand} />
          {errors.zustand && <Hint><span style={{ color: T.red }}>Bitte Zustand wählen</span></Hint>}
        </div>

        <Divider />

        {/* ── 3. PREIS & ANGEBOT ── */}
        <SectionHead icon={IC.gavel} n="3">Preis & Angebot</SectionHead>
        <div>
          <Lbl req>Angebotstyp</Lbl>
          <Toggle opts={[{ k: "fixed", l: "Festpreis" }, { k: "rent", l: "Vermieten" }]} value={type} onChange={setType} />
        </div>

        {type === "rent" ? <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Inp label="Mietpreis (CHF)" req value={mietpreis} onChange={e => setMietpreis(e.target.value)} placeholder="25.00" type="number"
              style={errors.mietpreis ? { borderColor: T.red } : {}} />
            <Sel label="Mietdauer" req value={mietdauer} onChange={setMietdauer}>
              {["Pro Tag", "Pro Woche", "Pro Monat"].map(d => <option key={d} value={d}>{d}</option>)}
            </Sel>
          </div>
          <Inp label="Kaution (CHF, optional)" value={kaution} onChange={e => setKaution(e.target.value)} placeholder="0.00" type="number" hint="Wird nach Rückgabe erstattet." />
          <div style={{ background: T.blueSoft, borderRadius: T.rSm, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: T.blue, flexShrink: 0, marginTop: 1 }}>{IC.info}</span>
            <p style={{ fontSize: 11.5, color: T.blue, margin: 0, lineHeight: 1.45 }}>Vermieten ist nachhaltig: Dein Artikel wird genutzt statt im Keller zu stehen.</p>
          </div>
        </> : <>
          <Inp label="Verkaufspreis (CHF)" req value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" type="number"
            style={errors.price ? { borderColor: T.red } : {}} />
          <Check label="Preis ist verhandelbar" checked={verhandel} onChange={setVerhandel} />
        </>}

        <Divider />

        {/* ── 4. VERSAND & STANDORT ── */}
        <SectionHead icon={IC.truck} n="4">Versand & Standort</SectionHead>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
          <Inp label="PLZ" value={plz} onChange={e => setPlz(e.target.value)} placeholder="6010" maxLength={4} />
          <Inp label="Ort" req value={ort} onChange={e => setOrt(e.target.value)} placeholder="Kriens"
            style={errors.ort ? { borderColor: T.red } : {}} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Check label="Abholung möglich" checked={abholung} onChange={setAbholung} />
          <Check label="Versand möglich" checked={versand} onChange={setVersand} />
        </div>
        {versand && <Inp label="Versandkosten (CHF)" value={versandkosten} onChange={e => setVersandkosten(e.target.value)} placeholder="9.00" type="number" />}

        <Divider />

        {/* ── 5. FAIRER BEITRAG ── */}
        <SectionHead icon={IC.bee} n="5">Fairer Plattformbeitrag</SectionHead>
        <p style={{ fontSize: 12.5, color: T.textMd, margin: "0 0 12px", lineHeight: 1.5 }}>
          Du entscheidest, was dir BEEDARO wert ist. Wähle den Beitrag, der für dich stimmt.
        </p>
        <FeeModel price={activePrice} selected={fee} onSelect={setFee} />

        <Divider />

        {/* ── 6. RECHTLICHES ── */}
        <div style={{ background: T.warm, borderRadius: T.radius, padding: "16px 18px" }}>
          <Check label={
            <span>Ich bestätige, dass meine Angaben korrekt sind und den <span style={{ color: T.honey, cursor: "pointer", textDecoration: "underline" }}>Richtlinien</span> entsprechen.</span>
          } checked={agree} onChange={setAgree} />
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn style={{ flex: 1 }} onClick={() => handleSubmit(false)}>
            {saving ? "Speichern…" : "Als Entwurf speichern"}
          </Btn>
          <Btn primary style={{ flex: 2 }} onClick={() => { if (validate()) setStep("preview"); }}>
            Vorschau anzeigen {IC.arrow}
          </Btn>
        </div>
      </div>
    </div>
  );
}
