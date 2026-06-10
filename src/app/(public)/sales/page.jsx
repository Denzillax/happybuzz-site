"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { getMySales } from "@/lib/listings";
import Link from "next/link";
import { Package, Truck, CheckCircle, Clock, CreditCard, Star, X, AlertTriangle, Loader2 } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { colors, fonts, radius } from "@/lib/theme";
import { fmtCHF } from "@/lib/formatters";
import { makeBeeRef } from "@/lib/fees";

const STATUS_CONFIG = {
  confirmed:       { label: "Warten auf Zahlung", color: "#F4A100", icon: CreditCard },
  pending_payment: { label: "Warten auf Zahlung", color: "#F4A100", icon: CreditCard },
  payment_pending: { label: "Warten auf Zahlung", color: "#F4A100", icon: CreditCard },
  payment_marked:  { label: "Zahlung markiert",   color: "#F4A100", icon: Clock },
  paid:            { label: "Bezahlt",             color: "#5B8C5A", icon: CheckCircle },
  shipped:         { label: "Versendet",           color: "#94B9C9", icon: Truck },
  picked_up:       { label: "Übergeben",           color: "#94B9C9", icon: Truck },
  delivered:       { label: "Empfangen",           color: "#5B8C5A", icon: CheckCircle },
  completed:       { label: "Abgeschlossen",       color: "#5B8C5A", icon: Star },
  cancelled:       { label: "Storniert",           color: "#c62828", icon: X },
  disputed:        { label: "Beanstandet",         color: "#c62828", icon: AlertTriangle },
};

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "open", label: "Offen", match: s => ["confirmed","pending_payment","payment_pending","payment_marked","paid"].includes(s) },
  { key: "shipping", label: "Versendet", match: s => ["shipped","picked_up"].includes(s) },
  { key: "done", label: "Abgeschlossen", match: s => ["delivered","completed"].includes(s) },
];

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { window.location.href = "/login"; return; }
        setSales(await getMySales(session.user.id));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

  const filtered = sales.filter((s) => {
    if (filter === "all") return true;
    const f = FILTERS.find(f => f.key === filter);
    return f?.match ? f.match(s.status) : true;
  });

  const openCount = sales.filter(s => ["confirmed","pending_payment","payment_pending","payment_marked","paid"].includes(s.status)).length;
  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.price) - parseFloat(s.fee_amount || 0), 0);
  const totalBee = sales.reduce((sum, s) => sum + (parseFloat(s.bee_impact) || 0), 0);

  const colHead = { fontSize: 12, fontWeight: 600, color: colors.muted, padding: "12px 10px", textAlign: "left", borderBottom: `1px solid ${colors.border}` };

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px", fontFamily: fonts.head, letterSpacing: ".03em" }}>MEINE VERKÄUFE</h1>
          <p style={{ fontSize: 13, color: colors.mutedLt, margin: 0 }}>{sales.length} verkauft{openCount > 0 ? ` · ${openCount} offen` : ""}</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "7px 14px", borderRadius: radius.sm, fontSize: 12, fontWeight: filter === f.key ? 700 : 500,
              cursor: "pointer", fontFamily: fonts.body, border: `1.5px solid ${filter === f.key ? colors.yellow : colors.border}`,
              background: filter === f.key ? colors.yellowSoft : colors.surface, color: filter === f.key ? colors.dark : colors.muted,
            }}>{f.label}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <Package size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Noch keine Verkäufe</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={colHead}>Artikel</th>
                  <th style={colHead}>Verkauft an</th>
                  <th style={colHead}>Lieferung</th>
                  <th style={{ ...colHead, textAlign: "right" }}>Preis</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.confirmed;
                  const StIcon = st.icon;
                  const ref = makeBeeRef(s.id);
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = colors.cream}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 10px", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: radius.sm, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {s.listingImage ? <img src={s.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
                        </div>
                        <div>
                          <Link href={`/order/${s.id}`} style={{ fontSize: 14, fontWeight: 700, color: colors.dark, textDecoration: "none", display: "block", marginBottom: 2 }}>{s.listingTitle}</Link>
                          <div style={{ fontSize: 11, color: colors.muted }}>{s.listing?.listing_type === "rent" ? "Vermietung" : "Verkauf"}: {ref}</div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 600 }}>{s.buyerName}</div>
                        <div style={{ fontSize: 12, color: colors.muted }}>{fmtDate(s.created_at)}</div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        {s.shipping_method && <div>{s.shipping_method}</div>}
                        {parseFloat(s.shipping_cost) > 0 && <div style={{ fontSize: 12, color: colors.muted }}>CHF {fmtCHF(s.shipping_cost)}</div>}
                      </td>
                      <td style={{ padding: "14px 10px", textAlign: "right", verticalAlign: "middle", fontWeight: 700, fontSize: 15 }}>
                        {fmtCHF(s.price)}
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: st.color, fontSize: 12, fontWeight: 600 }}>
                          <StIcon size={14} /> {st.label}
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px", verticalAlign: "middle", textAlign: "center" }}>
                        <Link href={`/order/${s.id}`} style={{ color: colors.yellow, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Details</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!loading && sales.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, padding: "16px 20px" }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.muted, fontWeight: 600 }}>Umsatz (nach Gebühren)</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: fonts.head }}>CHF {fmtCHF(totalRevenue)}</p>
            </div>
            <div style={{ flex: 1, minWidth: 200, background: colors.greenSoft, borderRadius: radius.lg, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: colors.green, fontWeight: 600 }}>Bee-Impact</p>
                <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: fonts.head, color: colors.green }}>CHF {fmtCHF(totalBee)}</p>
              </div>
              <BeeIcon size={28} color={colors.green} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
