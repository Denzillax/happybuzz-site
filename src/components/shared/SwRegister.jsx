"use client";

// Haelt die Service-Worker-Registrierung aktuell (nur Push, kein Caching).
// Ohne registrierten Worker kaeme auf diesem Geraet kein Push an, selbst
// wenn das Abo in den Einstellungen aktiviert wurde.
import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push";

export default function SwRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
