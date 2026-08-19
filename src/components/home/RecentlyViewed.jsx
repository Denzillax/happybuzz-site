"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { ListingCard } from "@/components/shared/ListingCard";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import { SectionHeader } from "./SectionHeader";

export function RecentlyViewed() {
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data?.session?.user?.id || null));

    // IDs + Reihenfolge aus localStorage, aber FRISCHE Daten aus der DB laden
    // (Snapshot-Preis war veraltet, Auktionen zeigten den Startpreis).
    async function load() {
      const ids = getRecentlyViewed().map((r) => r.id).filter(Boolean);
      if (ids.length < 2) return;
      const { data } = await supabase
        .from("listings")
        .select("*, listing_images(url, sort_order), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, account_type, company_name, avg_rating, rating_count), bids:bids(amount)")
        .in("id", ids)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if (!data) return;
      const order = new Map(ids.map((id, i) => [id, i]));
      const mapped = data
        .map((l) => ({
          ...l,
          price: l.listing_type === "auction" && l.bids?.length > 0
            ? Math.max(...l.bids.map((b) => Number(b.amount)))
            : l.price,
          // bid_count kommt aus der Spalte (Anzahl Gebots-Events), nicht Bieter-Zeilen
        }))
        .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
      setItems(mapped);
    }
    load();
  }, []);

  if (items.length < 2) return null;

  return (
    <section style={{ padding: "16px 24px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <SectionHeader title="Zuletzt angesehen" subtitle="Da hast du kürzlich reingeschaut" />

      <div className="listing-grid home-swipe">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} userId={userId} />
        ))}
      </div>
    </section>
  );
}
