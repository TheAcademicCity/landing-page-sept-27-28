# TACS chatbot LP — `best-boarding-school-india-v1`

**Source of truth** for the TACS admissions chatbot landing experience (replaces Zoho SalesIQ on this URL only).

## Live URL

`https://admission-enquiry.theacademiccity.com/best-boarding-school-india-v1/`

## Edit here

- **`index.html`** — page content, Chat / Live chat CTAs, TACS widget embed, `tacs-chatbot-v1.css`
- **`thank-you.html`** — post-form thank-you for this URL path
- **`tacs-chatbot-v1.css`** — Chat button styling (variant-local)

Shared styles/scripts/images: repo root `../css/`, `../js/`, `../images/`.

## Chatbot

Local/staging widget: `../js/tacs-chatbot-widget.js` (copied from the TAC Chatbot `client` widget build).

API (local): `http://localhost:3021/api` via `window.TACS_CHATBOT_API`.

Do **not** load `zoho-salesiq-v1.js` or the SalesIQ `zsiqscript` on this page. Other variants still use SalesIQ.

## Do not

- Run `sync-landing-variant.ps1` on this slug (replaces this HTML with WhatsApp HTML).
- Use this folder as a mirror of root `index.html`.

See **`LANDING-PAGES.md`** at repo root.

## Server

Listed in `LANDING_VARIANT_PATHS` in `server/.env` (with legacy `-fb` slugs until retired).
