# Matsense design system (website and content pages)

Matsense has two related looks. Use the one that matches where the page lives.

| Where | Look | Source of truth |
| --- | --- | --- |
| matsense.net (landing page, guides, any public page) | **Site look**: deep navy, blue brand, one warm orange | `index.html` `:root` and `assets/guide.css` in this repo |
| The app (app.matsense.co) | **Glow**: deep violet night, violet brand, orange streak | `docs/design/design-system/` in the app repo (Matsensebeta): `README.md`, `tokens.json`, `tokens.css` |

Both share: the logo (viewfinder corners, two arcs, a warm centre dot), dark first, everything tappable is a pill or a circle, soft large radii, glow instead of borders to lift the main action, monospace for times, no emoji and no exclamation marks, short literal English. The site borrows the app's **event mark colours** (`ev-*-mark`) for ticks on a match strip, so a guide's diagrams look like the app.

## Site tokens

```
ground #0d1925   ground-top #14273b   raised-top #193048   raised #122436
panel-top #1c3f62   panel-bottom #0f1f30
brand #2f6db0   brand-deep #255d95   brand-ink #90bfee (links, selected edge)
brand-soft rgba(100,160,220,.18) (selected fill)
ink #fff   ink-soft #e0eaf4 (body)   ink-muted #c0d0e0   ink-subtle #a3b6c9 (meta)
line rgba(255,255,255,.14)   line-strong rgba(255,255,255,.24)   glass rgba(255,255,255,.06)
warm #f39a52   mark #f08a3c (logo dot)   warm-glow rgba(243,140,60,.55)   focus #ffd24a   danger #ff9b9b
event marks (from the app): guard pass #f26d04, sweep attempt #009bdf, submission attempt #8b5cf6, takedown #b98c00
```

Type: **Bricolage Grotesque** 800 for headings (tight tracking, -0.03em), **Instrument Sans** for text, **JetBrains Mono** for times, counts and step numbers. All from Google Fonts.

Shape: buttons and chips are pills; cards 20-22px radius, tools and panels 30-36px; inputs 16px.

## Colour has jobs

- **Brand blue** marks the next step and the selected state (a picked chip, a ticked box, a step marker). The main sign-up button is brand blue with a warm glow (`.join`); one per view.
- **Warm orange** is the accent: section numbers, the dot before a label, "pattern found", the highlighted sentence (`.note`). Use it sparingly.
- Everything else is neutral glass on navy.

## Content page (guide) layout

Every guide uses `assets/guide.css` + `assets/guide.js` (built in November 2026 for the four drafts; the older live pages still use `assets/article.css`).

1. Sticky header, thin reading-progress bar at the very top.
2. "On this page": section chips that follow the reader (sticky row on phones, side rail on desktop), with the current section highlighted.
3. Hero: crumbs, H1, read-time pill, then **The short answer** card holding the lead paragraph (the AI-search answer).
4. Numbered sections (`<section class="sec">`, the number comes from CSS so the H2 text stays clean for SEO).
5. Each list gets the component that fits it:
   - `.cards` for "bold title + sentence" lists of reasons or options
   - `.steps` for ordered how-to steps (numbered rail)
   - `[data-check]` checklist with a counter and progress bar, saved in the reader's browser, for things to do or prepare
   - `[data-picker]` chips that show one item at a time, for "which one is you" lists
   - `.note` (warm) or `.note--calm` (blue) for one key paragraph
6. One signature tool per page, drawn in the app's language (match strip with event ticks, scouting sheet, camera diagram, journal card).
7. `.app` card: the "In Matsense" paragraph next to a small mock of the app's key-moments list.
8. FAQ as accordions (`.faq details`), Keep reading cards, final panel with one sign-up button.

Rules for guides:
- **Never change approved wording to fit a component.** All text stays in the HTML (Google reads it); the components only arrange it. New words are limited to short UI labels (Kit check, Clear, Pattern, Copied).
- Everything must read without JavaScript. Respect reduced motion. Keep phone width (390px) with no sideways scroll.
- Interactions push `guide_*` events to `dataLayer` (GA4 through GTM-PMDFW2C8).
