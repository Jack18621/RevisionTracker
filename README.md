# Revision Tracker — Web (drag‑and‑drop ready)

A modern, animated, mobile‑friendly web app for GCSE revision tracking.

## Features
- **Cumulative hours chart** (animated) with exam markers and homework‑due markers.
- **Focus Mode** with big circular timer + session goal.
- **Streak** with 60‑day heatstrip.
- **History** with totals.
- **Homework import** (drag‑and‑drop / paste JSON).
- **Preloaded GCSE 2026** (JCQ Maths/English/Science + OCR Comp Sci + AQA Geog).
- **LocalStorage** persistence (no backend needed).

## Quick start
```bash
npm i
npm run dev
```
Open http://localhost:5173/

## Deploy to GitHub Pages (no backend)
1. Push this folder as a repo.
2. Run:
```bash
npm run build
npm run deploy
```
This uses `gh-pages` to publish the `dist/` folder. The app uses **hash routing**, so Pages works without server config.

## Homework import format
Provide a JSON array of objects:
```json
[
  {"title":"Revise Biology", "description":"cell division", "due_date":"2026-05-10"},
  {"title":"Maths practice", "due_date":"2026-05-12"}
]
```
Any item whose title/description contains keywords like "revise", "study", "revision" will mark the **due_date** on the graph.

---
Enjoy! ✨
