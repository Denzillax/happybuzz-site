import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/supabase'

const BASE = 'https://happybuzz.ch'

// Statische, öffentlich indexierbare Seiten
const STATIC_PATHS = ['', '/search', '/impact', '/about', '/how-it-works', '/fees', '/help', '/terms', '/privacy', '/imprint']

export const revalidate = 3600 // stündlich neu generieren

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.6,
  }))

  let listingRoutes: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabase
      .from('listings')
      .select('id, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5000)
    listingRoutes = (data || []).map((l) => ({
      url: `${BASE}/listing/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  } catch {
    // Sitemap bleibt mit statischen Routen funktionsfähig, falls DB nicht erreichbar
  }

  return [...staticRoutes, ...listingRoutes]
}
