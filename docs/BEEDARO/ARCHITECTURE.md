# BEEDARO – Architektur & Projektstruktur

## Stack

| Layer          | Technologie                        |
|----------------|-------------------------------------|
| Framework      | Next.js 14 (App Router)            |
| Sprache        | TypeScript                         |
| Datenbank      | Supabase (PostgreSQL + Auth + Storage) |
| Zahlungen      | Stripe Connect (Plattform-Modell)  |
| Styling        | Tailwind CSS + CSS Variables       |
| Font           | Plus Jakarta Sans (Google Fonts)   |
| Hosting        | Vercel                             |
| E-Mail         | Mailchimp (Newsletter) + Resend (Transaktional) |
| Domain         | BEEDAROch (Kreativ Media)       |

## Farbpalette (CSS Variables)

```css
--color-honey:    #F4C03F   /* Primary / CTA */
--color-text:     #191615   /* Haupttext */
--color-bg:       #F9F4EC   /* Hintergrund */
--color-green:    #5B8C5A   /* Erfolg / Nachhaltigkeit */
--color-blue:     #94B9C9   /* Info / Sekundär */
```

## Bee-Rates (Gestaffelte Kommission)

| Provision Verkäufer | Provision Käufer | Total Plattform |
|---------------------|------------------|-----------------|
| 3%                  | 20%              | 23%             |
| 5%                  | 25%              | 30%             |
| 7%                  | 30%              | 37%             |
| 10%                 | 35%              | 45%             |

→ Standard-Einstieg: 3% / 20% – wettbewerbsfähig vs. Orsetto (4.9% fix)

## Verzeichnisstruktur

```
BEEDARO/
├── docs/                          # Dokumentation
├── supabase/
│   └── migrations/                # SQL-Migrationen
├── public/
│   ├── images/                    # Statische Bilder
│   └── icons/                     # Favicon, App-Icons
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth-Seiten (eigenes Layout ohne Nav)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/           # Eingeloggter Bereich
│   │   │   ├── dashboard/         # Übersicht
│   │   │   ├── listings/
│   │   │   │   ├── new/           # Neues Inserat erstellen
│   │   │   │   └── [id]/          # Inserat bearbeiten
│   │   │   ├── messages/          # Chat / Nachrichten
│   │   │   ├── profile/           # Profil bearbeiten
│   │   │   └── settings/          # Kontoeinstellungen
│   │   ├── (public)/              # Öffentliche Seiten
│   │   │   ├── (home)/            # Startseite
│   │   │   ├── search/            # Suche & Ergebnisse
│   │   │   ├── listing/[id]/      # Inserat-Detailseite
│   │   │   ├── how-it-works/      # So funktioniert's
│   │   │   └── about/             # Über uns
│   │   └── api/
│   │       ├── auth/              # Auth-Callbacks
│   │       ├── listings/          # CRUD Inserate
│   │       ├── messages/          # Messaging
│   │       ├── payments/          # Stripe-Logik
│   │       └── webhooks/          # Stripe + Supabase Webhooks
│   ├── components/
│   │   ├── ui/                    # Buttons, Inputs, Cards, Modals
│   │   ├── layout/                # Header, Footer, Sidebar, Nav
│   │   ├── listings/              # ListingCard, ListingGrid, ListingForm
│   │   ├── auth/                  # LoginForm, RegisterForm
│   │   └── shared/                # Logo, BeeRate-Badge, SearchBar
│   ├── lib/
│   │   ├── supabase/              # Client + Server + Middleware helpers
│   │   ├── stripe/                # Stripe-Konfiguration
│   │   └── utils.ts               # Allgemeine Hilfsfunktionen
│   ├── hooks/                     # Custom React Hooks
│   ├── types/                     # TypeScript-Typen
│   ├── styles/                    # globals.css + Tailwind
│   └── utils/                     # Formatierung, Validierung
├── .env.local.example             # Env-Template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Kernfeatures (MVP)

1. **Auth** – Registrierung, Login, Passwort-Reset (Supabase Auth)
2. **Inserate** – Erstellen, Bearbeiten, Löschen, Bilder hochladen
3. **Suche** – Volltextsuche, Kategorien, Filter, Standort
4. **Messaging** – Echtzeit-Chat zwischen Käufer/Verkäufer
5. **Zahlungen** – Stripe Connect, gestaffelte Bee-Rates
6. **Profil** – Bewertungen, Inserats-Übersicht, Statistiken
7. **Mieten** – Miet-Modus mit Zeitraum-Auswahl und Kaution

## Nächste Schritte

- [x] Projektstruktur erstellen
- [x] Datenbank-Schema definieren
- [ ] Supabase-Projekt aufsetzen
- [ ] Auth-Flow implementieren
- [ ] Listing CRUD bauen
- [ ] Suche & Filter
- [ ] Messaging (Realtime)
- [ ] Stripe Connect Integration
- [ ] Coming-Soon → Live-Switch


