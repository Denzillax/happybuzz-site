"use client";
import { useState, useEffect } from "react";
import { Plus, X, Car, Clock, Package, Trash2, Pencil, Send, ChevronDown } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { INVOICE_TEMPLATES, getInvoiceItems, submitServiceInvoiceWithItems } from "@/lib/api/invoices";
import { calcFeeFromPrice } from "@/lib/fees";
import BeeIcon from "@/components/shared/BeeIcon";

const K = { ink: "#14110D", petrol: "#0B5E5C", honey: "#F4C03F" };
const ICONS = { Car, Clock, Package, Trash2, Pencil };

function ServiceInvoiceEditor({ purchaseId, sellerId, feePercent = 5, onSubmitted }) {
  const [items, setItems] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing items
  useEffect(() => {
    if (purchaseId) {
      getInvoiceItems(purchaseId).then(existing => {
        if (existing.length > 0) setItems(existing);
      });
    }
  }, [purchaseId]);

  const addItem = (template) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      label: template?.label || "",
      description: "",
      quantity: 1,
      unit_price: template?.unit_price || 0,
      item_type: template?.item_type || "custom",
    }]);
    setShowTemplates(false);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);

  const { fee, beeImpact } = calcFeeFromPrice(subtotal, feePercent);
  const sellerPayout = subtotal - fee;

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      await submitServiceInvoiceWithItems(purchaseId, sellerId, items);
      setSaved(true);
      onSubmitted?.();
    } catch (err) {
      console.error("Invoice submit error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E6F5F5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <Send size={20} color={K.petrol} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark, fontFamily: fonts.head }}>Rechnung gesendet</div>
        <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Der Käufer wurde benachrichtigt.</div>
      </div>
    );
  }

  const inputStyle = {
    padding: "9px 12px", border: `1px solid ${K.ink}`, borderRadius: 8,
    fontSize: 13, fontFamily: fonts.body, color: colors.dark, outline: "none",
    background: "#fff", transition: "border-color .15s",
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: fonts.head, color: colors.dark, marginBottom: 4 }}>
        Service-Rechnung
      </div>
      <div style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
        Positionen hinzufügen. Der Käufer erhält die Rechnung per Benachrichtigung.
      </div>

      {/* Items list */}
      {items.map((item, idx) => {
        const Icon = ICONS[INVOICE_TEMPLATES.find(t => t.item_type === item.item_type)?.icon] || Pencil;
        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);

        return (
          <div key={item.id} style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "12px 14px", background: "#fff", borderRadius: 12,
            border: `1px solid ${K.ink}`, marginBottom: 8,
          }}>
            {/* Icon */}
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: colors.cream, display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 2,
            }}>
              <Icon size={16} color={colors.muted} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Label */}
              <input
                type="text" value={item.label} placeholder="Bezeichnung"
                onChange={e => updateItem(item.id, "label", e.target.value)}
                style={{ ...inputStyle, fontWeight: 600, width: "100%" }}
                onFocus={e => e.target.style.borderColor = K.petrol}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              {/* Qty + Price row */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number" value={item.quantity} min="0.5" step="0.5"
                    onChange={e => updateItem(item.id, "quantity", e.target.value)}
                    style={{ ...inputStyle, width: 60, textAlign: "center" }}
                    onFocus={e => e.target.style.borderColor = K.petrol}
                    onBlur={e => e.target.style.borderColor = colors.border}
                  />
                  <span style={{ fontSize: 12, color: colors.muted }}>x</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: colors.muted, fontWeight: 600 }}>CHF</span>
                  <input
                    type="number" value={item.unit_price} min="0" step="0.50"
                    onChange={e => updateItem(item.id, "unit_price", e.target.value)}
                    style={{ ...inputStyle, width: 90 }}
                    onFocus={e => e.target.style.borderColor = K.petrol}
                    onBlur={e => e.target.style.borderColor = colors.border}
                  />
                </div>
                <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: colors.dark, fontFamily: fonts.head, whiteSpace: "nowrap" }}>
                  CHF {lineTotal.toFixed(2)}
                </span>
              </div>

              {/* Optional description */}
              <input
                type="text" value={item.description || ""} placeholder="Bemerkung (optional)"
                onChange={e => updateItem(item.id, "description", e.target.value)}
                style={{ ...inputStyle, fontSize: 12, color: colors.muted }}
                onFocus={e => e.target.style.borderColor = K.petrol}
                onBlur={e => e.target.style.borderColor = colors.border}
              />
            </div>

            {/* Remove */}
            <button onClick={() => removeItem(item.id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
              color: colors.muted, transition: "color .15s", flexShrink: 0, marginTop: 2,
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#c62828"}
              onMouseLeave={e => e.currentTarget.style.color = colors.muted}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      {/* Add item button with template dropdown */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <button onClick={() => setShowTemplates(!showTemplates)} style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          padding: "11px 14px", borderRadius: 10,
          border: `1.5px dashed ${colors.border}`, background: "transparent",
          color: colors.muted, fontSize: 13, fontWeight: 600, fontFamily: fonts.body,
          cursor: "pointer", transition: "all .15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = K.petrol; e.currentTarget.style.color = K.petrol; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.muted; }}
        >
          <Plus size={16} /> Position hinzufügen
          <ChevronDown size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
        </button>

        {showTemplates && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
            background: "#fff", borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)",
            padding: 6, overflow: "hidden",
          }}>
            {INVOICE_TEMPLATES.map(t => {
              const Icon = ICONS[t.icon] || Pencil;
              return (
                <button key={t.key} onClick={() => addItem(t)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", border: "none", background: "transparent",
                  cursor: "pointer", borderRadius: 8, transition: "background .1s",
                  fontFamily: fonts.body, fontSize: 13, color: colors.dark, textAlign: "left",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f6f3"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: colors.cream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={colors.muted} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.label}</div>
                    {t.unit_price > 0 && <div style={{ fontSize: 11, color: colors.muted }}>CHF {t.unit_price.toFixed(2)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 12, border: `1px solid ${K.ink}`,
          padding: "16px 18px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: colors.muted }}>Zwischensumme</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>CHF {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: colors.muted }}>Plattformgebühr ({feePercent}%)</span>
            <span style={{ fontSize: 13, color: colors.muted }}>- CHF {fee.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: K.petrol, display: "flex", alignItems: "center", gap: 4 }}>
              <BeeIcon size={12} /> Bee-Impact (20% der Gebühr)
            </span>
            <span style={{ fontSize: 12, color: K.petrol }}>CHF {beeImpact.toFixed(2)}</span>
          </div>
          <div style={{ height: 1, background: colors.borderLt, margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.dark, fontFamily: fonts.head }}>Deine Auszahlung</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: colors.dark, fontFamily: fonts.head }}>CHF {sellerPayout.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={items.length === 0 || saving || subtotal <= 0} style={{
        width: "100%", padding: "13px 20px", borderRadius: 10, border: "none",
        background: items.length > 0 && subtotal > 0 ? K.petrol : "#ddd",
        color: items.length > 0 && subtotal > 0 ? "#fff" : colors.muted,
        fontSize: 14, fontWeight: 700, fontFamily: fonts.body, cursor: items.length > 0 ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all .15s",
      }}>
        <Send size={16} /> {saving ? "Senden..." : `Rechnung senden (CHF ${subtotal.toFixed(2)})`}
      </button>
    </div>
  );
}

export default ServiceInvoiceEditor;
