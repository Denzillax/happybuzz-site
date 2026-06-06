"use client";
import { useState, useEffect } from "react";
import { toggleFavorite, isFavorited } from "@/lib/listings";

export function useFavorite(userId, listingId) {
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !listingId) return;
    isFavorited(userId, listingId).then(setFav).catch(() => {});
  }, [userId, listingId]);

  const toggle = async () => {
    if (!userId || loading) return;
    setLoading(true);
    try { setFav(await toggleFavorite(userId, listingId)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return { isFav: fav, toggleFav: toggle, loading };
}
