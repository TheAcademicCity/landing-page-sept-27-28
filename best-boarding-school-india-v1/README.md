# Zobot LP — `best-boarding-school-india-v1`

**Source of truth** for the Zoho SalesIQ / Zobot landing experience.

## Live URL

`https://admission-enquiry.theacademiccity.com/best-boarding-school-india-v1/`

## Edit here

- **`index.html`** — page content, chat CTAs, SalesIQ embed, `zoho-v1-overrides.css` link
- **`thank-you.html`** — post-form thank-you for this URL path
- **`zoho-v1-overrides.css`** — SalesIQ mobile launcher overrides (variant-local)

Shared styles/scripts/images: repo root `../css/`, `../js/`, `../images/`.

## Zoho SalesIQ

Widget in `index.html`; helpers in `../js/zoho-salesiq-v1.js`. No WhatsApp / `whatsapp-link.js` on this LP.

## Do not

- Run `sync-landing-variant.ps1` on this slug (replaces Zobot with WhatsApp HTML).
- Use this folder as a mirror of root `index.html` — maintain Zobot and WhatsApp LPs separately.

See **`LANDING-PAGES.md`** at repo root.

## Server

Listed in `LANDING_VARIANT_PATHS` in `server/.env` (with legacy `-fb` slugs until retired).
