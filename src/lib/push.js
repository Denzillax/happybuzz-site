// Web-Push-Verwaltung fuer dieses Geraet: Service Worker registrieren,
// Berechtigung einholen, Abo in push_subscriptions ablegen.
// Der oeffentliche VAPID-Schluessel ist bewusst hier im Code (er ist public),
// der private liegt nur im Supabase Vault und wird vom notify-worker genutzt.

import { supabase } from "@/lib/supabase/supabase";

export const VAPID_PUBLIC_KEY =
  "BHdN6dbzISz2hzRUeTEChvj-g-pyQwGus2x5DvQYi-ktug11tUElMSwONXog5dXxG7geOwoD3bx9KDlu82mSBxk";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.error("SW-Registrierung fehlgeschlagen:", e);
    return null;
  }
}

// Status fuer die Einstellungs-Seite:
// "unsupported" | "denied" | "on" | "off"
export async function getPushStatus() {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return sub ? "on" : "off";
}

// Push auf diesem Geraet aktivieren: Berechtigung -> Abo -> in DB speichern.
// Rueckgabe: neuer Status ("on") oder wirft mit verstaendlicher Meldung.
export async function enablePush(userId) {
  if (!isPushSupported()) throw new Error("Dieser Browser unterstützt kein Push.");
  const reg = await registerServiceWorker();
  if (!reg) throw new Error("Service Worker konnte nicht registriert werden.");
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Benachrichtigungen wurden nicht erlaubt.");
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  const json = sub.toJSON();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 250),
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    console.error("push_subscriptions upsert:", error);
    throw new Error("Abo konnte nicht gespeichert werden.");
  }
  return "on";
}

// Push auf diesem Geraet deaktivieren: Abo kuendigen + DB-Zeile entfernen.
export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
  return "off";
}
