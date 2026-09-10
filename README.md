# Halo Hair Studio

A salon site that books appointments **and** sells the extensions the salon installs.

**Status:** unpublished demo. Not on GitHub Pages, not linked from the studio site.
**Built by:** Framework Studio.

---

## What this one proves

Two of the ten portfolio ideas in one build:

- **Booking that actually books** — a service menu with real durations and prices, live-looking slot selection, and a confirm step. In production this hands off to Square Appointments or Calendly, which own the calendar, the deposit and the SMS reminders.
- **A working cart** — pick a length, the price updates, add to bag, the drawer opens, the subtotal recalculates, and the bag survives a page reload. In production this hands off to Shopify or Stripe Checkout.

Both are the questions a salon owner asks first: *can people book without calling me,* and *can I sell hair while I sleep.*

## How it works

```
data/site.json     ─┐
data/services.json ─┤─> build.mjs ─> index.html
data/shop.json     ─┤
src/index.template ─┘
```

Services, prices, durations, products, lengths and stock all live in `data/`. `build.mjs` renders them into the page. Nothing about the menu or the shop is hand-written HTML.

`build.mjs` has zero dependencies.

## The cart

Client-side, in `localStorage` under `halo-bag`. Add, remove, subtotal, persistence across reloads. Every read and write is wrapped in try/catch, so a browser blocking site data degrades to an empty bag rather than a broken page.

It deliberately stops short of payment. The checkout button says so.

## Repository layout

```
data/site.json       Name, hours, address, marquee lines, demo notice.
data/services.json   Three services, each with a priced menu.
data/shop.json       Products, lengths and prices.
src/                 Page template with {{TOKEN}} placeholders.
build.mjs            Renders template + data. No dependencies.
assets/              Stylesheet and images.
index.html           Generated. Do not edit by hand.
```

## Running it

```bash
node build.mjs
python3 -m http.server 8000
```

## Design notes

- **Type:** Bodoni Moda for display, Parisienne for script accents, Inter for body.
- **Color:** cream `#FBF4F1`, blush `#F2D9D8`, wine `#6B1E32`, rose `#B9556B`.
  Rose is used at display sizes only; small text uses `--rose-ink` `#B04A61`, because
  the lighter rose is 4.22:1 on cream and fails AA below large-text size.
- **Motion:** hero image float, rotating badge, marquee, staggered reveals, hover scale.
  All disabled under `prefers-reduced-motion`.
- **SEO:** `HairSalon` JSON-LD.

## Before this goes to a real client

1. Replace every image in `assets/img/` with the salon's own photography. Placeholders are Unsplash, under the Unsplash License. Product shots especially: these are portraits standing in for bundle photography.
2. Connect booking to Square or Calendly.
3. Connect checkout to Shopify or Stripe.
4. Set `demo.show` to `false` in `data/site.json` to drop the demo banner.

## A note on the imagery

There is deliberately no "meet the team" section. Attaching invented stylist names and bios to photographs of real people would misrepresent them, which is not a thing to ship even on a demo.
