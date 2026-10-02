# Landing variant: `best-boarding-school-india-v1`

Replica of the main landing page at a **different URL slug**. Shared assets (`css/`, `js/`, `images/`, etc.) live at the **repository root** — only entry pages are duplicated here.

## Live URL (example)

`https://admission-enquiry.theacademiccity.com/best-boarding-school-india-v1/`

## Zoho SalesIQ (V1)

This variant uses **Zoho SalesIQ** live chat instead of WhatsApp floating/icon CTAs. Widget script is in `index.html`; helpers in `../js/zoho-salesiq-v1.js`.

## Customize this variant

Edit `index.html` and `thank-you.html` in this folder. When you change shared styles or scripts, update files at the repo root (both landings use the same `css/` and `js/`).

HTML in this folder uses **`../css/`**, **`../js/`**, **`../images/`** so assets load from the repo root when the URL is a subfolder (e.g. `python -m http.server` or static hosting).

To sync from the primary landing after large updates:

```powershell
.\scripts\sync-landing-variant.ps1 -VariantSlug best-boarding-school-india-v1
.\scripts\apply-zoho-chat-variant.ps1 -VariantSlug best-boarding-school-india-v1
```

Then re-apply any V1-specific copy or tracking changes.

## Server

Set in `server/.env`:

```env
LANDING_VARIANT_PATHS=/best-boarding-school-india-v1,/best-boarding-school-india-v1-fb,/best-boarding-school-india-fb
```

Restart the Node server. The app serves this folder’s `index.html` first, then falls back to root static files for assets.

## Nginx (production)

Add a location block mirroring the primary landing (same `alias` root, or proxy to Node with the variant path):

```nginx
location /best-boarding-school-india-v1/ {
    alias /path/to/Landing Page 1 - Sept/;
    try_files $uri $uri/ /best-boarding-school-india-v1/index.html;
}
```

Adjust `alias` and `try_files` to match how `/best-boarding-school-india/` is already configured.
