"use client";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { colors, fonts } from "@/lib/theme";

export default function AdminPage() {
  const admin = useAdminData();
  if (admin.loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: colors.muted }}>Lade Admin...</div>;
  if (!admin.user) return null;
  return <AdminShell admin={admin} />;
}
