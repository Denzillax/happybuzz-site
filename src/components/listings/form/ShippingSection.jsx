"use client";
import { Package } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { inputBase, labelBase, sectionBase, hintStyle } from "./styles";

// Swiss Post Tarife 2026
const SWISS_POST_TARIFE = {
  paket: { "2kg": 9.0, "10kg": 12.0, "20kg": 15.0, "30kg": 18.0 },
  brief: { "100g": 1.20, "250g": 2.0, "500g": 3.0, "1kg": 5.0 },
  sperrgut: { default: 25.0 },
  einschreiben: { default: 7.0 },
  kurier: { default: 15.0 },
  spediteur: { default: 45.0 },
  lieferung_verkaeufer: { default: 0 },
};

const Toggle = ({ value, onChange }) => (
  <button onClick={onChange} style={{
    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
    background: value ? colors.yellow : "#ccc", position: "relative", transition: "background .2s",
  }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: value ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></button>
);

export default function ShippingSection({ form, set, Err }) {
  const isService = form.listing_type === "service";

  if (isService) {
    return (
      <div style={sectionBase}>
        <label style={labelBase}>Zahlung</label>
        <p style={{ ...hintStyle, marginTop: 0 }}>Wie möchtest du bezahlt werden?</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>TWINT</span>
            <div style={{ fontSize: 11, color: colors.muted }}>Zahlung per TWINT</div>
          </div>
          <Toggle value={form.pay_twint} onChange={() => set("pay_twint", !form.pay_twint)} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>Barzahlung</span>
            <div style={{ fontSize: 11, color: colors.muted }}>Zahlung vor Ort in bar</div>
          </div>
          <Toggle value={form.pay_cash} onChange={() => set("pay_cash", !form.pay_cash)} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>Überweisung / Rechnung</span>
            <div style={{ fontSize: 11, color: colors.muted }}>Zahlung per Banküberweisung</div>
          </div>
          <Toggle value={form.pay_bank} onChange={() => set("pay_bank", !form.pay_bank)} />
        </div>
        <Err field="payment" />
      </div>
    );
  }

  // ── Standard Shipping ──
  return (
    <div style={sectionBase}>
      <label style={labelBase}>Lieferung</label>
      <p style={{ ...hintStyle, marginTop: 0 }}>Die Kosten werden vom Käufer getragen</p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
        <Toggle value={form.shipping_available} onChange={() => {
          const next = !form.shipping_available;
          set("shipping_available", next);
          if (next) { set("pay_bank", true); if (!form.shipping_method) set("shipping_method", "paket"); }
          if (!next) { set("pay_bank", false); if (!form.pickup_only) set("pickup_only", true); }
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Versand</span>
      </div>

      {form.shipping_available && (
        <div style={{ padding: "14px 0" }}>
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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>TWINT akzeptieren</span>
              <div style={{ fontSize: 11, color: colors.muted }}>Käufer kann auch mit TWINT bezahlen</div>
            </div>
            <Toggle value={form.pay_twint} onChange={() => set("pay_twint", !form.pay_twint)} />
          </div>

          {/* Versand Modal */}
          {form._shipModal && (
            <ShipModal form={form} set={set} tarife={SWISS_POST_TARIFE} />
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
        <Toggle value={form.pickup_only} onChange={() => {
          const next = !form.pickup_only;
          set("pickup_only", next);
          if (!next && !form.shipping_available) set("shipping_available", true);
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Abholung</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
        <Toggle value={form.pay_cash} onChange={() => {
          if (!form.shipping_available) set("pay_cash", !form.pay_cash);
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark, opacity: form.shipping_available ? 0.4 : 1 }}>Barzahlung</span>
        {form.shipping_available && <span style={{ fontSize: 11, color: colors.muted }}>(bei Versand deaktiviert)</span>}
      </div>
      <Err field="shipping" />
    </div>
  );
}

// ── Versand Modal ──
function ShipModal({ form, set, tarife }) {
  const methods = [
    { id: "paket", label: "Paket", desc: "Bis 30kg, Standard-Versand" },
    { id: "brief", label: "Brief", desc: "Kleine, leichte Artikel" },
    { id: "sperrgut", label: "Sperrgut", desc: "Grosse/sperrige Artikel" },
    { id: "einschreiben", label: "Einschreiben", desc: "Eingeschriebener Brief" },
    { id: "kurier", label: "Kurier", desc: "Same-Day Lieferung" },
    { id: "spediteur", label: "Spediteur", desc: "Schwere Möbel etc." },
    { id: "lieferung_verkaeufer", label: "Lieferung durch Verkäufer", desc: "Du lieferst persönlich" },
  ];

  const weights = form.shipping_method === "paket" ? ["2kg", "10kg", "20kg", "30kg"] : form.shipping_method === "brief" ? ["100g", "250g", "500g", "1kg"] : null;

  const calcCost = () => {
    const method = form.shipping_method || "paket";
    const weight = form.ship_weight || (method === "paket" ? "2kg" : method === "brief" ? "100g" : "default");
    const base = tarife[method]?.[weight] ?? tarife[method]?.default ?? 9.0;
    return form.ship_speed === "priority" ? base + 3.0 : base;
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => set("_shipModal", false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 480, maxHeight: "80vh", overflow: "auto", padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Versandoptionen</h3>

        <label style={{ ...labelBase, marginBottom: 8 }}>Versandart</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {methods.map(m => (
            <button key={m.id} onClick={() => {
              set("shipping_method", m.id);
              if (m.id === "paket") set("ship_weight", "2kg");
              else if (m.id === "brief") set("ship_weight", "100g");
              const cost = tarife[m.id]?.[m.id === "paket" ? "2kg" : m.id === "brief" ? "100g" : "default"] ?? 9.0;
              set("shipping_cost", form.ship_speed === "priority" ? cost + 3 : cost);
            }} style={{
              padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${form.shipping_method === m.id ? colors.yellow : colors.border}`,
              background: form.shipping_method === m.id ? `${colors.yellow}15` : "transparent",
              cursor: "pointer", textAlign: "left", fontFamily: fonts.body,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{m.label}</div>
              <div style={{ fontSize: 11, color: colors.muted }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {weights && (
          <>
            <label style={{ ...labelBase, marginBottom: 8 }}>Gewicht</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {weights.map(w => (
                <button key={w} onClick={() => {
                  set("ship_weight", w);
                  const base = tarife[form.shipping_method]?.[w] ?? 9.0;
                  set("shipping_cost", form.ship_speed === "priority" ? base + 3 : base);
                }} style={{
                  padding: "8px 16px", borderRadius: 6, border: `1.5px solid ${form.ship_weight === w ? colors.yellow : colors.border}`,
                  background: form.ship_weight === w ? `${colors.yellow}15` : "transparent",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body,
                }}>{w}</button>
              ))}
            </div>
          </>
        )}

        <label style={{ ...labelBase, marginBottom: 8 }}>Geschwindigkeit</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["economy", "priority"].map(s => (
            <button key={s} onClick={() => {
              set("ship_speed", s);
              const base = tarife[form.shipping_method]?.[form.ship_weight || "2kg"] ?? tarife[form.shipping_method]?.default ?? 9.0;
              set("shipping_cost", s === "priority" ? base + 3 : base);
            }} style={{
              padding: "8px 16px", borderRadius: 6, border: `1.5px solid ${form.ship_speed === s ? colors.yellow : colors.border}`,
              background: form.ship_speed === s ? `${colors.yellow}15` : "transparent",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body,
            }}>{s === "priority" ? "Priority (1 Tag)" : "Economy (2-3 Tage)"}</button>
          ))}
        </div>

        <div style={{ padding: "12px 16px", background: colors.cream, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
            <span>Versandkosten</span>
            <span>CHF {calcCost().toFixed(2)}</span>
          </div>
        </div>

        <button onClick={() => {
          set("shipping_cost", calcCost());
          set("_shipModal", false);
        }} style={{
          width: "100%", padding: 14, borderRadius: 8, border: "none",
          background: colors.yellow, color: colors.dark, fontSize: 14, fontWeight: 800,
          cursor: "pointer", fontFamily: fonts.body,
        }}>Übernehmen</button>
      </div>
    </div>
  );
}
