# Inserat-Raster luftig + Umschalter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Karten gestrafft, Raster mit 14px Luft, Spaltenzahl per Umschalter (3/4/6), Bildersuche-Lupe auf der Karte.
**Architecture:** Spaltenzahl als Klasse am `<html>` (localStorage + Inline-Script vor dem Malen), CSS in globals.css; `RasterUmschalter`-Komponente in SectionHeader (Startseite) und Such-Titelzeile; ListingCard mit Lupe (`/listing/<id>?bild=1`), ListingClient startet die Bildersuche bei `?bild=1` einmalig.
**Spec:** `docs/superpowers/specs/2026-09-15-inserat-raster-luftig-design.md`

- [x] Task 1: globals.css Raster-Regeln (gap 14, Klassen raster-gross/kompakt, Tablet 3, Mobil 2, Umschalter mobil aus)
- [x] Task 2: `RasterUmschalter.jsx` + Inline-Script in `layout.tsx`
- [x] Task 3: SectionHeader `raster`-Prop, NewListings/PopularListings, Suche
- [x] Task 4: ListingCard: Lupe unten links, Meta einzeilig mit Laufzeit, Countdown-Zeile weg
- [x] Task 5: ListingClient `?bild=1` → `sucheAehnlichePerBild()` (Ref-Guard)
- [x] Task 6: Live-Test (Spalten 3/4/6, Reload ohne Springen, Karten gleich hoch, Lupe → Bildersuche, mobil 2 Spalten)
- [x] Task 7: Rep-Log, Checkliste, Commit, Push
