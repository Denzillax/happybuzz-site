'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BeeIcon from '@/components/shared/BeeIcon'

// =============================================
// SLIDES KONFIGURATION — hier einfach bearbeiten!
// =============================================
const slides = [
  {
    badge: 'Kaufen & Verkaufen',
    badgeColor: 'bg-honey/15 text-honey-dark',
    title: 'Finde Schätze.',
    highlight: 'Verkaufe deine.',
    description:
      'Der Schweizer Marktplatz für Secondhand. Fair, einfach und sicher. Mit den tiefsten Gebühren ab nur 3%.',
    cta: 'Jetzt entdecken',
    ctaHref: '/search?type=sell',
    image: '/images/hero/camera.png',
    imageAlt: 'Polaroid Kamera mit Biene auf einer Blume',
  },
  {
    badge: 'Mieten & Vermieten',
    badgeColor: 'bg-blue/15 text-blue',
    title: 'Miete, was du',
    highlight: 'temporär brauchst.',
    description:
      'Bohrmaschine für ein Wochenende? Kamera für die Ferien? Miete von Privat. Günstig und unkompliziert.',
    cta: 'Mietangebote ansehen',
    ctaHref: '/search?type=rent',
    image: '/images/hero/gameboy.png',
    imageAlt: 'Game Boy mit Biene auf einer Blume',
  },
  {
    badge: 'Nachhaltigkeit',
    badgeColor: 'bg-green/15 text-green',
    title: 'Jeder Kauf zählt.',
    highlight: 'Für den Planeten.',
    description:
      'Secondhand ist die nachhaltigste Art einzukaufen. Gemeinsam reduzieren wir Abfall und geben Dingen ein zweites Leben.',
    cta: 'Mehr erfahren',
    ctaHref: '/about',
    image: '/images/hero/vinyl.png',
    imageAlt: 'Vinyl Schallplatte mit Biene auf einer Blume',
  },
]
// =============================================

export function Hero() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (index === current || isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(index)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 300)
    },
    [current, isTransitioning],
  )

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [current, goTo])

  const slide = slides[current]

  return (
    <section className="relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #191615 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[420px] md:min-h-[500px]">
          {/* ---- Left: Text ---- */}
          <div
            className={`space-y-6 transition-all duration-500 ${
              isTransitioning
                ? 'opacity-0 translate-y-3'
                : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Badge */}
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${slide.badgeColor}`}
            >
              {slide.badge}
            </span>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              {slide.title}
              <br />
              <span className="text-honey">{slide.highlight}</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-text/60 max-w-md leading-relaxed">
              {slide.description}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href={slide.ctaHref} className="btn-honey group">
                {slide.cta}
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
              <Link href="/how-it-works" className="btn-outline">
                So funktionierts
              </Link>
            </div>
          </div>

          {/* ---- Right: Image ---- */}
          <div
            className={`relative transition-all duration-500 ${
              isTransitioning
                ? 'opacity-0 scale-95'
                : 'opacity-100 scale-100'
            }`}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-buzz-lg aspect-[4/3]">
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="w-full h-full object-cover"
              />
              {/* Subtle gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-text/10 via-transparent to-transparent" />
            </div>

            {/* Decorative floating badge */}
            <div className="absolute -bottom-3 -left-3 bg-white rounded-2xl shadow-buzz-lg px-4 py-3 animate-float">
              <span className="text-sm font-bold text-honey-dark" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                Ab 3% Gebühr <BeeIcon size={16} color="#F4C03F" />
              </span>
            </div>
          </div>
        </div>

        {/* ---- Dots ---- */}
        <div className="relative z-10 flex items-center justify-center gap-3 mt-10">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative p-2 cursor-pointer"
              aria-label={`Slide ${i + 1}: ${s.badge}`}
            >
              <span
                className={`block transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-10 h-3 bg-honey'
                    : 'w-3 h-3 bg-text/15 hover:bg-text/25'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
