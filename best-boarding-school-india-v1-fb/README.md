# Landing variant: `best-boarding-school-india-v1-fb`

Replica of the primary landing at a **different URL slug**. Shared assets (`css/`, `js/`, `images/`, etc.) live at the **repository root**.

## Live URL (example)

`https://admission-enquiry.theacademiccity.com/best-boarding-school-india-v1-fb/`

## Zoho SalesIQ (same as V1)

This variant uses **Zoho SalesIQ** live chat instead of WhatsApp CTAs. Widget script is in `index.html`; helpers in `../js/zoho-salesiq-v1.js`. Mobile uses the action-bar **Chat** button (no extra bottom-right Zoho bubble).

## Local preview

From the **project root** (or Node on port 3010):

`http://localhost:3010/best-boarding-school-india-v1-fb/`

HTML uses **`../css/`**, **`../js/`**, **`../images/`** so assets load correctly from this subfolder.

## Sync from primary landing

After updating root `index.html` / `thank-you.html`:

```powershell
.\scripts\sync-landing-variant.ps1 -VariantSlug best-boarding-school-india-v1-fb
.\scripts\apply-zoho-chat-variant.ps1 -VariantSlug best-boarding-school-india-v1-fb
```

## Server

In `server/.env`:

```env
LANDING_VARIANT_PATHS=/best-boarding-school-india-v1,/best-boarding-school-india-v1-fb,/best-boarding-school-india-fb
```

Restart Node after changing env.

## Nginx

```nginx
location /best-boarding-school-india-v1-fb/ {
    alias /path/to/Landing Page 1 - Sept/;
    try_files $uri $uri/ /best-boarding-school-india-v1-fb/index.html;
}
```
