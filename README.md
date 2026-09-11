# Halo Hair Studio

A salon site that books appointments **and** sells the hair the salon installs.

**Live demo:** https://tahvia127.github.io/halo-hair/
**Built by:** Framework Studio. Halo is a fictional salon; every page carries a demo notice.

---

## What this one proves

- **Booking that respects the calendar.** Pick a service, a day and a time. Days and times come from the opening hours in `data/site.json`, read in the salon's own time zone (not the visitor's). A time is only offered if the whole appointment fits before closing, so a five-hour braid set can't start at 4pm. Long appointments show the deposit. In production this hands off to Square Appointments or Acuity.
- **A shop that works.** Collection tiles and chips filter the grid. Each product has shade and length pickers that reprice live. The bag merges duplicates, keeps shade, length and quantity, shows progress toward free shipping and survives a reload. In production this hands off to Shopify or Stripe Checkout.
- **A shade guide that sells.** Ten raw-hair shades hang on a rack. Pick one to see what it's like and which products come in it, then "Shop shade 27" filters the shop and preselects that shade on every card.
- **A menu the owner can read.** Five services open into priced menus with durations. Every line has a Book button that preselects it in the booking form.

## How it works

```
data/site.json     ─┐  name, hours (machine-readable), copy, marquee, demo notice
data/services.json ─┤  services, menu items, minutes, prices, deposit rule
data/shop.json     ─┤  shades, collections, products, lengths, prices
src/index.template ─┘
        │
        └─> build.mjs ─> index.html          (zero dependencies)
            assets/js/site.js  reads window.HALO, written by the build
```

`build.mjs` **fails the build** instead of shipping a broken page if a product names a shade or collection that doesn't exist, an image is missing, a menu item has no price or duration, or the opening hours are malformed.

Opening hours are entered once, as times. The build groups them for display ("Tuesday & Wednesday, 9am to 7pm"), writes `openingHoursSpecification` JSON-LD from them, and the booking form and the "open now" line read the same data.

## Repository layout

```
data/                 Everything the owner would edit.
src/                  Page template with {{TOKEN}} placeholders.
build.mjs             Renders template + data, validates both.
assets/js/site.js     Behaviour: booking, filters, shade rack, bag.
assets/css/styles.css Stylesheet.
assets/img/           Photography (see CREDITS.md).
index.html            Generated. Do not edit by hand.
```

## Running it

```bash
node build.mjs
python3 -m http.server 8000
```

## Design notes

- **Type:** Instrument Serif with italic accents for display, Jost for body, Mrs Saint Delafield for occasional script.
- **Colour:** cream `#FBF6F1`, petal pink `#F8D5E1`, espresso `#2A1D1A`, gold `#C9A45A`. Small pink text uses `--pink-ink` `#A13F66` (5.7:1 on cream). Every text pair clears WCAG AA.
- **Motifs:** the arch (hero portrait, collection tiles, menu photos) and the halo ring (logo, hero headline), plus illustrated tools orbiting a pink disc and a gold rail of hair swatches.
- **Motion:** image settle, drawn halo, orbiting badge, marquee, floating tools with parallax, pink sweep on service rows, a photo that follows the cursor across the menu, swinging swatches, staggered reveals. All of it is off under `prefers-reduced-motion`.
- **Accessibility:** real buttons and radio groups with arrow-key support, focus trapped in the bag drawer and returned on close, `aria-live` on the shade panel and booking summary.

## Before this goes to a real client

1. Replace every image in `assets/img/` with the salon's own photography.
2. Connect booking to Square or Acuity, and checkout to Shopify or Stripe.
3. Set `demo.show` to `false` in `data/site.json` to drop the demo notice.

## A note on the imagery

There is deliberately no "meet the team" section. Attaching invented stylist names and bios to photographs of real people would misrepresent them, which is not a thing to ship even on a demo.
