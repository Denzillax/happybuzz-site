"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { ListingCard } from "@/components/shared/ListingCard";
import { getRecentlyViewed } from "@/lib/recentlyViewed";

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const MUTED = "#9A9490";
const DARK = "#191615";

export function RecentlyViewed() {
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setItems(getRecentlyViewed());
    supabase.auth.getSession().then(({ data }) => setUserId(data?.session?.user?.id || null));
  }, []);

  if (items.length < 2) return null;

  return (
    <section style={{ padding: "16px 24px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: HEAD, color: DARK, margin: 0 }}>
        Zuletzt angesehen
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: "0 0 16px" }}>Da hast du kürzlich reingeschaut</p>

      <div className="listing-grid">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} userId={userId} />
        ))}
      </div>
    </section>
  );
}
