"use client";
import Link from "next/link";
import { Search, ArrowLeft, Download } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { colors, fonts } from "@/lib/theme";
import { ReportsTab } from "@/components/admin/tabs/ReportsTab";
import { ListingsTab } from "@/components/admin/tabs/ListingsTab";
import { EmailsTab } from "@/components/admin/tabs/EmailsTab";
import { AnalyticsTab } from "@/components/admin/tabs/AnalyticsTab";
import { AuditTab } from "@/components/admin/tabs/AuditTab";
import { OverviewTab } from "@/components/admin/tabs/OverviewTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { OrdersTab } from "@/components/admin/tabs/OrdersTab";
import { InvoicesTab } from "@/components/admin/tabs/InvoicesTab";
import { DunningTab } from "@/components/admin/tabs/DunningTab";
import { MahnPreviewModal } from "@/components/admin/modals/MahnPreviewModal";
import { BannerModal } from "@/components/admin/modals/BannerModal";
import { BroadcastComposer } from "@/components/admin/modals/BroadcastComposer";

export function AdminShell({ admin }) {
  const { toast, tab, setTab, search, setSearch, NAV, pageTitle, exportCurrent } = admin;

  return (
    <div className="admin-shell" style={{ fontFamily: fonts.body, background: "#fff", color: colors.dark, minHeight: "100vh" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="admin-sidebar" style={{ background: "#1a1a1a", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div className="admin-brand" style={{ display: "flex", alignItems: "center", gap: 11, padding: "20px 20px 18px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: colors.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BeeIcon size={18} color="#1a1a1a" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1 }}>BEEDARO</div>
            <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", marginTop: 3 }}>Admin</div>
          </div>
        </div>

        <nav className="admin-nav" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 10px" }}>
          {NAV.map(n => {
            const on = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setTab(n.key); setSearch(""); }} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: fonts.body, fontSize: 13, fontWeight: on ? 700 : 500, textAlign: "left",
                background: on ? "rgba(255,255,255,.08)" : "transparent",
                color: on ? "#fff" : "rgba(255,255,255,.6)",
                borderLeft: on ? `3px solid ${colors.yellow}` : "3px solid transparent",
                transition: "background .12s",
              }}>
                <n.Icon size={17} strokeWidth={2} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && <span style={{ background: "#EB5E55", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>{n.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="admin-back" style={{ marginTop: "auto", padding: "16px 18px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Zurück zur Seite
          </Link>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="admin-main">

        {/* Top-Leiste */}
        <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", borderBottom: `1px solid ${colors.borderLt}`, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.head, margin: 0 }}>{pageTitle}</h1>
          <div style={{ flex: 1 }} />
          {(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices" || tab === "emails" || tab === "audit") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.cream, borderRadius: 999, padding: "8px 15px", minWidth: 220 }}>
              <Search size={15} color={colors.muted} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "users" ? "Benutzer suchen..." : tab === "listings" ? "Inserate suchen..." : tab === "orders" ? "BEE-Nummer, Artikel oder Name..." : tab === "emails" ? "Empfänger, Betreff oder Template..." : tab === "audit" ? "Aktion oder Ziel suchen..." : "Nummer (BEE/FEE) oder Name..."}
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: fonts.body, color: colors.dark }} />
            </div>
          )}
          {(tab === "orders" || tab === "invoices" || tab === "users") && (
            <button onClick={exportCurrent} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.cream, color: colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
              <Download size={14} /> CSV
            </button>
          )}
        </header>

        <div style={{ padding: "26px 28px 90px", maxWidth: 1180 }}>

          {/* ═══ ÜBERSICHT ═══ */}
          {tab === "overview" && <OverviewTab admin={admin} />}

          {/* ═══ BENUTZER ═══ */}
          {tab === "users" && <UsersTab admin={admin} />}

          {/* ═══ BESTELLUNGEN ═══ */}
          {tab === "orders" && <OrdersTab admin={admin} />}

          {/* ═══ RECHNUNGEN ═══ */}
          {tab === "invoices" && <InvoicesTab admin={admin} />}

          {/* ═══ E-MAILS ═══ */}
          {tab === "emails" && <EmailsTab admin={admin} />}

          {/* ═══ MAHNUNGEN ═══ */}
          {tab === "dunning" && <DunningTab admin={admin} />}

          {/* ═══ ANALYTIK ═══ */}
          {tab === "analytics" && <AnalyticsTab admin={admin} />}

          {/* ═══ INSERATE ═══ */}
          {tab === "listings" && <ListingsTab admin={admin} />}

          {/* ═══ MELDUNGEN ═══ */}
          {tab === "reports" && <ReportsTab admin={admin} />}

          {/* ═══ PROTOKOLL ═══ */}
          {tab === "audit" && <AuditTab admin={admin} />}

        </div>
      </div>

      <MahnPreviewModal admin={admin} />
      <BannerModal admin={admin} />
      <BroadcastComposer admin={admin} />

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "9px 22px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}
    </div>
  );
}
