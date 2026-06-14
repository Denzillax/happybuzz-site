import { supabase } from "@/lib/supabase/supabase";
import ListingClient from "./ListingClient";

const TYPE_LABEL = {
  sell: "Kaufen", auction: "Auktion", rent: "Mieten", free: "Gratis", service: "Service",
};

// Dynamische SEO-Metadaten pro Inserat (Titel, Beschreibung, OG-Bild)
export async function generateMetadata({ params }) {
  const { id } = params;
  const { data: l } = await supabase
    .from("listings")
    .select("title, description, price, rent_price, listing_type, status, listing_images(url, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (!l) {
    return { title: "Inserat nicht gefunden", robots: { index: false } };
  }

  const imgs = (l.listing_images || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const cover = imgs[0]?.url;
  const priceTxt = l.listing_type === "free"
    ? "Gratis"
    : (l.listing_type === "rent" || l.listing_type === "service")
      ? (l.rent_price != null ? `CHF ${Number(l.rent_price).toLocaleString("de-CH")}` : "")
      : (l.price != null ? `CHF ${Number(l.price).toLocaleString("de-CH")}` : "");
  const typeTxt = TYPE_LABEL[l.listing_type] || "";
  const desc = (l.description || "").replace(/\s+/g, " ").trim().slice(0, 160)
    || `${typeTxt}${priceTxt ? ` · ${priceTxt}` : ""} auf BEEDARO, dem Schweizer Secondhand-Marktplatz.`;

  return {
    title: l.title,
    description: desc,
    robots: l.status === "active" ? undefined : { index: false },
    openGraph: {
      type: "website",
      title: l.title,
      description: desc,
      images: cover ? [{ url: cover, alt: l.title }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: l.title,
      description: desc,
      images: cover ? [cover] : undefined,
    },
  };
}

export default function ListingPage() {
  return <ListingClient />;
}
