"use client";
import { supabase } from "@/lib/supabase/supabase";

import { useEffect, useState } from "react";

export default function AuthCallback() {
  const [status, setStatus] = useState("Wird verarbeitet...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase liest automatisch die Tokens aus dem URL-Hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          setStatus("Erfolgreich! Du wirst weitergeleitet...");
          // Kurz warten damit der User die Nachricht sieht
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          setStatus("Session konnte nicht erstellt werden.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("Etwas ist schiefgelaufen.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Manrope', sans-serif",
      background: "#FFFFFF",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", background: "#F4C03F",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800, color: "#191615", marginBottom: 16,
        }}>B</div>
        <p style={{ fontSize: 16, color: "#191615", fontWeight: 600 }}>{status}</p>
      </div>
    </div>
  );
}
