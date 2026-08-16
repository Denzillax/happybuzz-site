import { supabase } from "@/lib/supabase/supabase";
import ListingClient from "./ListingClient";

const TYPE_LABEL = {
  sell: "Kaufen", auction: "Auktion", rent: "Mieten", free: "Gratis", service: "Service",
};

// Immer frisch rendern: sonst cacht Next die Metadata-Abfrage. Ein Inserat,
// das beim ersten Aufruf noch in der Freigabe war, bliebe fuer immer
// "nicht gefunden" (und Preise/Gebote waeren veraltet).
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
    alternates: { canonical: `/listing/${id}` },
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

// Zustands-Mapping fuer schema.org (Google Shopping / KI-Antworten)
const SCHEMA_CONDITION = {
  new: "https://schema.org/NewCondition",
  like_new: "https://schema.org/UsedCondition",
  good: "https://schema.org/UsedCondition",
  fair: "https://schema.org/UsedCondition",
  poor: "https://schema.org/UsedCondition",
};

export default async function ListingPage({ params }) {
  // Product-JSON-LD im Server-HTML: damit verstehen Google und KI-Crawler
  // jedes Inserat als Produkt mit Preis, Bild und Zustand.
  let jsonLd = null;
  try {
    const { data: l } = await supabase
      .from("listings")
      .select("title, description, price, listing_type, status, condition, city, listing_images(url, sort_order)")
      .eq("id", params.id)
      .maybeSingle();
    if (l && l.status === "active" && (l.listing_type === "sell" || l.listing_type === "auction") && l.price != null) {
      const imgs = (l.listing_images || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(i => i.url);
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: l.title,
        description: (l.description || "").replace(/\s+/g, " ").trim().slice(0, 300),
        image: imgs.slice(0, 4),
        itemCondition: SCHEMA_CONDITION[l.condition] || "https://schema.org/UsedCondition",
        offers: {
          "@type": "Offer",
          url: `https://beedaro.ch/listing/${params.id}`,
          price: Number(l.price),
          priceCurrency: "CHF",
          availability: "https://schema.org/InStock",
          itemCondition: SCHEMA_CONDITION[l.condition] || "https://schema.org/UsedCondition",
        },
      };
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ListingClient />
    </>
  );
}
