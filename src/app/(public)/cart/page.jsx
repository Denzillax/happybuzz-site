"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Package, Truck, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { getCart, removeFromCart, clearCartForSeller } from "@/lib/cart";
import { createPurchaseBundled } from "@/lib/listings";

const chf = (n) => `CHF ${Number(n || 0).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [bundles, setBundles] = useState({}); // sellerId -> {min, pct, name}
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null); // sellerId being processed
  const [done, setDone] = useState({}); // sellerId -> [purchaseIds]

  const reload = () => setItems(getCart());

  useEffect(() => {
    async function load() {
      const cart = getCart();
      setItems(cart);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      const sellerIds = [...new Set(cart.map((i) => i.seller_id))].filter(Boolean);
      if (sellerIds.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("id, display_name, bundle_min_items, bundle_discount_pct").in("id", sellerIds);
        const map = {};
        (profs || []).forEach((p) => { map[p.id] = { min: p.bundle_min_items || 0, pct: p.bundle_discount_pct || 0, name: p.display_name }; });
        setBundles(map);
      }
      setLoading(false);
    }
    load();
    const onChange = () => reload();
    window.addEventListener("beedaro:cart", onChange);
    return () => window.removeEventListener("beedaro:cart", onChange);
  }, []);

  // Gruppieren nach Verkäufer
  const groups = {};
  items.forEach((i) => { (groups[i.seller_id] = groups[i.seller_id] || []).push(i); });

  const calc = (sellerId, list) => {
    const b = bundles[sellerId] || { min: 0, pct: 0 };
    const subtotal = list.reduce((s, i) => s + Number(i.price || 0), 0);
    const bundleActive = b.min > 0 && b.pct > 0 && list.length >= b.min;
    const discount = bundleActive ? subtotal * b.pct / 100 : 0;
    const shipping = list.reduce((m, i) => Math.max(m, Number(i.shipping_cost || 0)), 0); // 1x gebündelt
    const total = subtotal - discount + shipping;
    return { subtotal, bundleActive, discount, shipping, total, pct: b.pct, min: b.min };
  };

  const checkout = async (sellerId, list) => {
    if (!user) { router.push("/login"); return; }
    setCheckingOut(sellerId);
    try {
      const { discount, subtotal, shipping } = calc(sellerId, list);
      const factor = subtotal > 0 ? (subtotal - discount) / subtotal : 1; // Rabatt anteilig
      const ids = [];
      for (let idx = 0; idx < list.length; idx++) {
        const it = list[idx];
        const unit = Math.round(Number(it.price || 0) * factor * 100) / 100;
        const ship = idx === 0 ? shipping : 0; // gebündelter Versand nur auf erste Position
        try { const pid = await createPurchaseBundled(user.id, it.id, unit, ship); if (pid) ids.push(pid); }
        catch (e) { console.error("checkout item:", e); }
      }
      clearCartForSeller(sellerId);
      setItems(getCart());
      setDone((d) => ({ ...d, [sellerId]: ids }));
    } catch (e) { console.error(e); }
    finally { setCheckingOut(null); }
  };

  if (loading) return <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const sellerIds = Object.keys(groups);

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: fonts.head, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <ShoppingCart size={24} /> Warenkorb
        </h1>

        {sellerIds.length === 0 && Object.keys(done).length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <ShoppingCart size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Dein Warenkorb ist leer</p>
            <Link href="/search" style={{ color: colors.teal, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Artikel entdecken</Link>
          </div>
        )}

        {/* Erfolgs-Meldungen */}
        {Object.entries(done).map(([sid, ids]) => (
          <div key={sid} style={{ background: colors.greenSoft, border: `1px solid ${colors.green}44`, borderRadius: radius.lg, padding: "16px 18px", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={18} /> {ids.length} Bestellung{ids.length === 1 ? "" : "en"} erstellt
            </p>
            {ids[0] && <Link href={`/order/${ids[0]}`} style={{ display: "inline-block", marginTop: 6, fontSize: 13, fontWeight: 700, color: colors.teal, textDecoration: "none" }}>Zur Bestellung</Link>}
          </div>
        ))}

        {sellerIds.map((sid) => {
          const list = groups[sid];
          const c = calc(sid, list);
          const sellerName = bundles[sid]?.name || list[0]?.sellerName || "Verkäufer";
          return (
            <div key={sid} style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={16} color={colors.muted} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{sellerName}</span>
                <span style={{ fontSize: 12, color: colors.muted }}>· {list.length} Artikel</span>
              </div>

              {list.map((it) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${colors.borderLt}` }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {it.cover_image ? <img src={it.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={18} color={colors.mutedLt} />}
                  </div>
                  <Link href={`/listing/${it.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.dark }}>{chf(it.price)}</p>
                  </Link>
                  <button onClick={() => { removeFromCart(it.id); setItems(getCart()); }} title="Entfernen" style={{ width: 32, height: 32, borderRadius: 6, border: "none", background: "#FFEBEE", color: "#c62828", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Zusammenfassung */}
              <div style={{ padding: "14px 16px", background: colors.cream }}>
                <Row label="Zwischensumme" value={chf(c.subtotal)} />
                {c.bundleActive && <Row label={`Mengenrabatt (${c.pct}% ab ${c.min})`} value={`− ${chf(c.discount)}`} color={colors.green} />}
                <Row label={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Truck size={13} /> Versand (gebündelt)</span>} value={c.shipping > 0 ? chf(c.shipping) : "Gratis"} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.borderLt}` }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{chf(c.total)}</span>
                </div>
                {!c.bundleActive && bundles[sid]?.min > 0 && bundles[sid]?.pct > 0 && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.muted }}>Noch {bundles[sid].min - list.length} Artikel bis {bundles[sid].pct}% Mengenrabatt.</p>
                )}
                <button onClick={() => checkout(sid, list)} disabled={checkingOut === sid}
                  style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: radius.sm, border: "none", background: colors.teal, color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", opacity: checkingOut === sid ? 0.6 : 1 }}>
                  {checkingOut === sid ? "Wird gekauft…" : `Kaufen (${list.length} Artikel)`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color || "#757575", marginBottom: 4 }}>
      <span>{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
