"use client";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { colors, fonts } from "@/lib/theme";

export default function AdminPage() {
  const admin = useAdminData();
  if (admin.loading) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, fontFamily: fonts.body, background: "#FBF8F2" }}>
      <img src="/logo.svg" alt="Beedaro" style={{ width: 150, height: "auto", animation: "adminPulse 1.4s ease-in-out infinite" }} />
      <div style={{ width: 170, height: 5, background: "#ECE3D2", overflow: "hidden", border: "1px solid #14110D" }}>
        <div style={{ width: "40%", height: "100%", background: "#F4C03F", animation: "adminBar 1.2s ease-in-out infinite" }} />
      </div>
      <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#8a8580" }}>Dashboard wird geladen</p>
      <style>{`
        @keyframes adminPulse { 0%, 100% { opacity: 1 } 50% { opacity: .55 } }
        @keyframes adminBar { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }
      `}</style>
    </div>
  );
  if (!admin.user) return null;
  return <AdminShell admin={admin} />;
}
