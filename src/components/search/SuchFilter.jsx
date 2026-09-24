"use client";
// Filter der Suchseite (24.09.2026, Vorbild Ricardo): am Desktop eine Reihe Pillen mit Klappmenüs, am Handy ein
// Knopf "Filter & Kategorien", der eine Seitenleiste von rechts öffnet. Darüber am Handy eine wischbare Reihe mit den
// Kategorien (ohne Wahl die Hauptkategorien, mit Wahl deren Unterkategorien). Alle Filter wirken sofort, der Knopf
// unten in der Leiste zeigt die Trefferzahl und schliesst nur. Styles: globals.css, Block SUCHFILTER (sf-*).
import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, SlidersHorizontal, BadgeCheck } from "lucide-react";

// ── Pille mit Klappmenü (Desktop) ────────────────────────────
function FilterPill({ label, value, options, onChange, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const shown = active ? options.find(o => o.value === value)?.label || label : label;
  return (
    <div ref={ref} className="sf-pille-wrap">
      <button type="button" className={active ? "sf-pille an" : "sf-pille"} aria-expanded={open} onClick={() => setOpen(!open)}>
        {shown}
        {active
          ? <X size={13} strokeWidth={2.4} onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }} aria-label={`${label} entfernen`} />
          : <ChevronDown size={13} strokeWidth={2.2} aria-hidden="true" />}
      </button>
      {open && (
        <div className="sf-menue">
          {options.map(opt => (
            <button key={opt.value} type="button" className={value === opt.value ? "sf-menue-punkt eckig an" : "sf-menue-punkt eckig"} onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.label}{value === opt.value && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Preis-Pille mit Von/Bis (Desktop) ────────────────────────
function PreisPille({ min, max, setMin, setMax, apply }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const an = !!(min || max);
  return (
    <div ref={ref} className="sf-pille-wrap">
      <button type="button" className={an ? "sf-pille an" : "sf-pille"} aria-expanded={open} onClick={() => setOpen(!open)}>
        {an ? `CHF ${min || "0"} bis ${max || "offen"}` : "Preis"}
        {an
          ? <X size={13} strokeWidth={2.4} onClick={(e) => { e.stopPropagation(); setMin(""); setMax(""); setOpen(false); apply({ min: "", max: "" }); }} aria-label="Preis entfernen" />
          : <ChevronDown size={13} strokeWidth={2.2} aria-hidden="true" />}
      </button>
      {open && (
        <div className="sf-menue sf-menue-preis">
          <PreisFelder min={min} max={max} setMin={setMin} setMax={setMax} />
          <button type="button" className="sf-knopf-gelb eckig" onClick={() => { apply(); setOpen(false); }}>Anwenden</button>
        </div>
      )}
    </div>
  );
}

function PreisFelder({ min, max, setMin, setMax, onEnter }) {
  const enter = (e) => { if (e.key === "Enter" && onEnter) onEnter(); };
  return (
    <div className="sf-preis">
      <label><span>Von</span><input type="number" inputMode="decimal" min="0" placeholder="0" value={min} onChange={e => setMin(e.target.value)} onKeyDown={enter} /></label>
      <label><span>Bis</span><input type="number" inputMode="decimal" min="0" placeholder="offen" value={max} onChange={e => setMax(e.target.value)} onKeyDown={enter} /></label>
    </div>
  );
}

// ── Reihe aus Chips (Seitenleiste) ───────────────────────────
function ChipReihe({ options, value, onChange }) {
  return (
    <div className="sf-chips">
      {options.map(o => (
        <button key={o.value} type="button" className={value === o.value ? "sf-chip an" : "sf-chip"} aria-pressed={value === o.value}
          onClick={() => onChange(value === o.value ? "" : o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Hauptbauteil ─────────────────────────────────────────────
// f: Werte und Setzer der Suchseite (siehe search/page.jsx). Alle Setzer springen selbst auf Seite 1.
export function SuchFilter({ f }) {
  const [offen, setOffen] = useState(false);

  // Seitenleiste: Seite dahinter nicht scrollen, Escape schliesst
  useEffect(() => {
    if (!offen) return;
    const alt = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const h = (e) => { if (e.key === "Escape") setOffen(false); };
    document.addEventListener("keydown", h);
    return () => { document.body.style.overflow = alt; document.removeEventListener("keydown", h); };
  }, [offen]);

  const mainCats = f.categories.filter(c => !c.parent_id);
  const subCats = f.categories.filter(c => c.parent_id === f.mainCatId);
  const subSubCats = f.categories.filter(c => c.parent_id === f.subCatId);

  const categoryOpts = [{ value: "", label: "Alle Kategorien" }, ...mainCats.map(c => ({ value: c.id, label: c.name }))];
  const subCatOpts = subCats.length > 0 ? [{ value: "", label: "Alle" }, ...subCats.map(c => ({ value: c.id, label: c.name }))] : [];
  const subSubOpts = subSubCats.length > 0 ? [{ value: "", label: "Alle" }, ...subSubCats.map(c => ({ value: c.id, label: c.name }))] : [];
  const attrs = f.categoryAttrs.filter(a => a.attribute_type === "select" && Array.isArray(a.options) && a.options.length > 0);

  // Wischreihe am Handy: ohne Kategorie die Hauptkategorien, sonst die Unterkategorien der gewählten
  const wischChips = f.mainCatId
    ? (f.subCatId && subSubCats.length > 0
      ? [{ id: "", name: "Alle" }, ...subSubCats]
      : [{ id: "", name: "Alle" }, ...subCats])
    : mainCats;
  const wischWert = f.mainCatId ? (f.subCatId && subSubCats.length > 0 ? f.subSubCatId : f.subCatId) : "";
  const wischWahl = (id) => {
    if (!f.mainCatId) { f.setMainCat(id); return; }
    if (f.subCatId && subSubCats.length > 0) { f.setSubSubCat(id); return; }
    f.setSubCat(id);
  };

  const verifiziertKnopf = (
    <button type="button" className={f.verifiedOnly ? "sf-pille an" : "sf-pille"} aria-pressed={f.verifiedOnly}
      title="Nur Verkäufer mit geprüftem Ausweis und E-Mail" onClick={() => f.setVerifiedOnly(!f.verifiedOnly)}>
      <BadgeCheck size={15} strokeWidth={2.2} aria-hidden="true" /> Verifiziert
    </button>
  );

  return (
    <div className="sf">
      {/* ── Desktop: Pillen ── */}
      <div className="sf-reihe">
        <FilterPill label="Kategorie" value={f.mainCatId} active={!!f.mainCatId} options={categoryOpts} onChange={f.setMainCat} />
        {subCatOpts.length > 0 && <FilterPill label="Unterkategorie" value={f.subCatId} active={!!f.subCatId} options={subCatOpts} onChange={f.setSubCat} />}
        {subSubOpts.length > 0 && <FilterPill label="Weitere" value={f.subSubCatId} active={!!f.subSubCatId} options={subSubOpts} onChange={f.setSubSubCat} />}
        <PreisPille min={f.minPrice} max={f.maxPrice} setMin={f.setMinPrice} setMax={f.setMaxPrice} apply={f.apply} />
        <FilterPill label="Zustand" value={f.condition} active={!!f.condition} options={f.conditionOpts} onChange={f.setCondition} />
        <FilterPill label="Angebotsart" value={f.type} active={!!f.type} options={f.typeOpts} onChange={f.setType} />
        <FilterPill label="Lieferung" value={f.delivery} active={!!f.delivery} options={f.deliveryOpts} onChange={f.setDelivery} />
        {verifiziertKnopf}
        {attrs.map(attr => (
          <FilterPill key={attr.id} label={attr.name} value={f.attrFilters[attr.attribute_key] || ""} active={!!f.attrFilters[attr.attribute_key]}
            options={attr.options.map(o => ({ value: o, label: o }))} onChange={v => f.setAttr(attr.attribute_key, v)} />
        ))}
        {f.activeFilterCount > 0 && (
          <button type="button" className="sf-reset eckig" onClick={f.resetAll}><X size={13} strokeWidth={2.4} aria-hidden="true" /> Zurücksetzen</button>
        )}
      </div>

      {/* ── Handy: Wischreihe mit Kategorien und der Knopf zur Seitenleiste ── */}
      <div className="sf-handy">
        {wischChips.length > 0 && (
          <div className="sf-wisch" role="group" aria-label="Kategorien">
            {wischChips.map(c => (
              <button key={c.id || "alle"} type="button" className={wischWert === c.id ? "sf-chip an" : "sf-chip"} aria-pressed={wischWert === c.id} onClick={() => wischWahl(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="sf-oeffnen eckig" aria-haspopup="dialog" aria-expanded={offen} onClick={() => setOffen(true)}>
          <SlidersHorizontal size={17} strokeWidth={2.2} aria-hidden="true" />
          Filter & Kategorien
          {f.activeFilterCount > 0 && <span className="sf-zahl" aria-label={`${f.activeFilterCount} aktiv`}>{f.activeFilterCount}</span>}
        </button>
      </div>

      {/* ── Seitenleiste ── */}
      {offen && (
        <div className="sf-schleier" onClick={() => setOffen(false)}>
          <aside className="sf-leiste" role="dialog" aria-modal="true" aria-label="Filter und Kategorien" onClick={e => e.stopPropagation()}>
            <div className="sf-kopf">
              <h2>Filter & Kategorien</h2>
              <button type="button" className="sf-zu eckig" aria-label="Schliessen" onClick={() => setOffen(false)}><X size={20} strokeWidth={2.2} /></button>
            </div>

            <div className="sf-inhalt">
              <section className="sf-block">
                <h3>Kategorie</h3>
                <div className="sf-liste">
                  <button type="button" className={!f.mainCatId ? "sf-zeile eckig an" : "sf-zeile eckig"} onClick={() => f.setMainCat("")}>Alle Kategorien{!f.mainCatId && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}</button>
                  {mainCats.map(c => (
                    <div key={c.id}>
                      <button type="button" className={f.mainCatId === c.id ? "sf-zeile eckig an" : "sf-zeile eckig"} onClick={() => f.setMainCat(f.mainCatId === c.id ? "" : c.id)}>
                        {c.name}{f.mainCatId === c.id && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                      </button>
                      {f.mainCatId === c.id && subCats.length > 0 && (
                        <div className="sf-unter">
                          {subCats.map(s => (
                            <div key={s.id}>
                              <button type="button" className={f.subCatId === s.id ? "sf-zeile eckig an" : "sf-zeile eckig"} onClick={() => f.setSubCat(f.subCatId === s.id ? "" : s.id)}>
                                {s.name}{f.subCatId === s.id && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                              </button>
                              {f.subCatId === s.id && subSubCats.length > 0 && (
                                <div className="sf-unter">
                                  {subSubCats.map(t => (
                                    <button key={t.id} type="button" className={f.subSubCatId === t.id ? "sf-zeile eckig an" : "sf-zeile eckig"} onClick={() => f.setSubSubCat(f.subSubCatId === t.id ? "" : t.id)}>
                                      {t.name}{f.subSubCatId === t.id && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="sf-block">
                <h3>Preis in CHF</h3>
                <PreisFelder min={f.minPrice} max={f.maxPrice} setMin={f.setMinPrice} setMax={f.setMaxPrice} onEnter={f.apply} />
              </section>

              <section className="sf-block">
                <h3>Angebotsart</h3>
                <ChipReihe options={f.typeOpts} value={f.type} onChange={f.setType} />
              </section>

              <section className="sf-block">
                <h3>Zustand</h3>
                <ChipReihe options={f.conditionOpts} value={f.condition} onChange={f.setCondition} />
              </section>

              <section className="sf-block">
                <h3>Lieferung</h3>
                <ChipReihe options={f.deliveryOpts} value={f.delivery} onChange={f.setDelivery} />
              </section>

              <section className="sf-block">
                <h3>Verkäufer</h3>
                <label className="sf-schalter">
                  <input type="checkbox" checked={f.verifiedOnly} onChange={e => f.setVerifiedOnly(e.target.checked)} />
                  <span className="sf-schalter-kasten" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                  <span><BadgeCheck size={15} strokeWidth={2.2} aria-hidden="true" /> Nur verifizierte Verkäufer</span>
                </label>
              </section>

              {attrs.map(attr => (
                <section key={attr.id} className="sf-block">
                  <h3>{attr.name}</h3>
                  <ChipReihe options={attr.options.map(o => ({ value: o, label: o }))} value={f.attrFilters[attr.attribute_key] || ""} onChange={v => f.setAttr(attr.attribute_key, v)} />
                </section>
              ))}
            </div>

            <div className="sf-fuss">
              <button type="button" className="sf-reset eckig" disabled={f.activeFilterCount === 0} onClick={f.resetAll}>Zurücksetzen</button>
              <button type="button" className="sf-knopf-gelb eckig" onClick={() => { f.apply(); setOffen(false); }}>
                {f.loading ? "Sucht…" : `${f.total} Treffer anzeigen`}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
