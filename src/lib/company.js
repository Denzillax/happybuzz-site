import { supabase } from "@/lib/supabase/supabase";

export const DEFAULT_COMPANY = {
  name: "BEEDARO", street: "Gemeindehausstrasse 11B", postal_code: "6010", city: "Kriens",
  country: "CH", iban: "CH1234567890123456789", uid: "", contact_email: "", contact_phone: "",
};

// Liest den Firmen-Singleton (id=1); Fallback auf Defaults, damit Rechnungen nie ohne Creditor sind.
export async function getCompanySettings() {
  const { data } = await supabase.from("company_settings").select("*").eq("id", 1).maybeSingle();
  return data || DEFAULT_COMPANY;
}

// IBAN gruppiert in 4er-Blöcken für die Anzeige (CH12 3456 …). Leer -> "".
export function formatIban(iban) {
  return (iban || "").replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}
