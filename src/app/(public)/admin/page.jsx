"use client";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { LogoAnimiert } from "@/components/shared/LogoAnimiert";
import { colors, fonts } from "@/lib/theme";

export default function AdminPage() {
  const admin = useAdminData();
  if (admin.loading) return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, fontFamily: fonts.body, background: "#fff" }}>
      {/* Ladeanzeige: das Logo baut sich in Schleife aus seinen Kacheln auf (LogoAnimiert) */}
      <LogoAnimiert width={170} schleife />
      <p style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#686E78" }}>Dashboard wird geladen</p>
    </div>
  );
  if (!admin.user) return null;
  return <AdminShell admin={admin} />;
}
