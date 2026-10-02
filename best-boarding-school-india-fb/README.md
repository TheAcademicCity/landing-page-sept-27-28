# Landing variant: `best-boarding-school-india-fb` (FB)

Replica of the **primary** landing (`/best-boarding-school-india/`) at a **different URL slug** — same **WhatsApp** CTAs (side stack, contact, mobile bar). WhatsApp prefill: **Admission details please!!** (`data-whatsapp-prefill` on `<html>`). Shared assets live at the repo root.

## Live URL (example)

`https://admission-enquiry.theacademiccity.com/best-boarding-school-india-fb/`

## Server

Add to `server/.env`:

```env
LANDING_VARIANT_PATHS=/best-boarding-school-india-v1,/best-boarding-school-india-v1-fb,/best-boarding-school-india-fb
```

Restart the Node server.

## Refresh from primary

```powershell
.\scripts\sync-landing-variant.ps1 -VariantSlug best-boarding-school-india-fb
```

Do **not** run `apply-zoho-chat-variant.ps1` on this folder (that is for Zoho chat variants only).

## Nginx (production)

```nginx
location /best-boarding-school-india-fb/ {
    alias /path/to/Landing Page 1 - Sept/;
    try_files $uri $uri/ /best-boarding-school-india-fb/index.html;
}
```
