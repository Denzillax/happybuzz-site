# Header zweizeilig — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Header nach Ricardo-Vorbild: Zeile 1 sticky (Marke, Kategorien, Aktionen), Zeile 2 Suche über volle Breite.
**Architecture:** `Header.tsx` liefert `<header style="display:contents">` mit `.hdr-top` (sticky) und `.hdr-searchrow hdr-desktop`; Suchblock unverändert aus Zeile 1 nach Zeile 2 verschoben; NektarBadge ins Profilmenü.
**Spec:** `docs/superpowers/specs/2026-09-15-header-zweizeilig-design.md`

- [x] Task 1: Suchblock nach Zeile 2, Freiraum in Zeile 1, Suchen-Knopf schwarz, Platzhalter mit Beispiel
- [x] Task 2: Kategorien-Pille, Trennlinien, NektarBadge ins Profilmenü
- [x] Task 3: Sticky nur Zeile 1 (`display:contents` am header, sonst klebt sie nur innerhalb des Headers)
- [x] Task 4: Live-Test 1400px (Zeile 1 top 0 nach Scroll, Zeile 2 scrollt weg) + 375px (Zeile 2 aus, Pille da, kein Überlauf)
- [x] Task 5: Rep-Log, Checkliste, Commit, Push
