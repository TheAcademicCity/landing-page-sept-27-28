# Landing pages — two experiences

Production uses **two primary landing-page experiences** (independently editable HTML). Shared assets: `css/`, `js/`, `images/`.

## Source of truth

| Experience | Public URL | Edit this file | Channel |
|------------|------------|----------------|---------|
| **WhatsApp / Gallabox** | `/best-boarding-school-india/` | **`index.html`** (repo root) | WhatsApp CTAs, `whatsapp-link.js`, prefill `Admission details please!` |
| **Zoho SalesIQ / Zobot** | `/best-boarding-school-india-v1/` | **`best-boarding-school-india-v1/index.html`** | Chat CTAs, SalesIQ widget, `zoho-salesiq-v1.js`, `zoho-v1-overrides.css` |

- Change the **WhatsApp** hero or CTAs → edit **root** `index.html` only.
- Change the **Zobot** hero or CTAs → edit **`best-boarding-school-india-v1/index.html` only.
- Change shared styles/scripts/images → edit repo root `css/`, `js/`, `images/` (affects both unless overridden in HTML).

Thank-you pages: root `thank-you.html` (WhatsApp LP) and `best-boarding-school-india-v1/thank-you.html` (Zobot LP). Update both if thank-you copy should stay aligned.

## Legacy variants (do not use as source of truth)

Still served for live ads; **do not sync four LPs** as part of normal workflow:

- `/best-boarding-school-india-fb/` → `best-boarding-school-india-fb/`
- `/best-boarding-school-india-v1-fb/` → `best-boarding-school-india-v1-fb/`

Retire these after attribution and Gallabox/SalesIQ testing. See each folder’s README.

## Scripts (legacy / one-off)

- `scripts/sync-landing-variant.ps1` — copies **root** WhatsApp HTML into a variant folder and rewrites asset paths. **Do not run on `best-boarding-school-india-v1`** (overwrites Zobot with WhatsApp). Legacy FB folders only if you intentionally refresh from WhatsApp LP.
- `scripts/apply-zoho-chat-variant.ps1` — converts a synced copy to Zoho chat. **Not** the normal way to maintain `best-boarding-school-india-v1/`; edit that folder directly.

## Server

`server/env.example`: `LANDING_BASE_PATH` + `LANDING_VARIANT_PATHS` (includes legacy `-fb` slugs until retired).
