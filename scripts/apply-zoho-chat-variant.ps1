# Apply V-1-style Zoho SalesIQ (no WhatsApp icons) to a variant index.html
param(
  [Parameter(Mandatory = $true)]
  [string]$VariantSlug
)

$root = Split-Path $PSScriptRoot -Parent
$variantDir = Join-Path $root $VariantSlug
$indexPath = Join-Path $variantDir "index.html"
if (-not (Test-Path $indexPath)) {
  Write-Error "Missing $indexPath — run sync-landing-variant.ps1 first."
  exit 1
}

if ($VariantSlug -eq 'best-boarding-school-india-v1') {
  $cssName = 'zoho-v1-overrides.css'
  $cssSrc = Join-Path $root 'best-boarding-school-india-v1\zoho-v1-overrides.css'
} else {
  $cssName = 'zoho-salesiq-overrides.css'
  $cssSrc = Join-Path $root 'best-boarding-school-india-v1-fb\zoho-salesiq-overrides.css'
  if (-not (Test-Path $cssSrc)) {
    $cssSrc = Join-Path $root 'best-boarding-school-india-v1\zoho-v1-overrides.css'
  }
}
Copy-Item $cssSrc (Join-Path $variantDir $cssName) -Force

$c = [IO.File]::ReadAllText($indexPath)

if ($c -notmatch 'zoho-salesiq-overrides|zoho-v1-overrides') {
  $c = $c -replace '(<link rel="stylesheet" href="\.\./css/enquiry-modal\.css[^"]+">)', "`$1`n  <link rel=`"stylesheet`" href=`"$cssName?v=20261002salesiqmobile`">"
}

$c = $c -replace 'aria-label="Enquire, call and WhatsApp"', 'aria-label="Enquire and call"'
$c = [regex]::Replace(
  $c,
  '(?s)<div class="side-action-divider" aria-hidden="true"></div>\s*<a\s+class="side-action-bot side-action-wa whatsapp-button".*?</a>\s*',
  '<div class="side-action-divider" aria-hidden="true"></div>' + "`n    ",
  1
)

$contactBtn = @'
<button type="button" class="contact-section__cta contact-section__cta--outline" data-zoho-chat-open>
            <svg aria-hidden="true"><use href="#ic-message"/></svg>
            Live chat
          </button>
'@

$c = [regex]::Replace(
  $c,
  '(?s)<a class="contact-section__cta contact-section__cta--outline (?:mobile-whatsapp-section|whatsapp-button)"[^>]*>.*?</a>',
  $contactBtn.TrimEnd(),
  2
)

$c = [regex]::Replace(
  $c,
  '<a class="wa mobile-whatsapp-section"[^>]*>.*?</a>',
  '<button type="button" class="wa zoho-chat-bar-btn" data-zoho-chat-open aria-label="Open live chat"><svg aria-hidden="true"><use href="#ic-message"/></svg>Chat</button>',
  1
)

$c = $c -replace '<script src="\.\./js/whatsapp-link\.js[^"]+"></script>\s*', ''
if ($c -notmatch 'zsiqscript') {
  $c = $c -replace '(<script src="\.\./js/site-chrome\.js)',
@'
  <script>window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}</script>
  <script id="zsiqscript" src="https://salesiq.zohopublic.in/widget?wc=siq4ec795e2bca1da2c2ef11208374174cb56aa3e08d8517178026165bd5d5de979" defer></script>

  $1
'@
}
if ($c -notmatch 'zoho-salesiq-v1\.js') {
  $c = $c -replace '(<script src="\.\./js/enhanced-conversions\.js[^"]+"></script>)',
    "`$1`n  <script src=`"../js/zoho-salesiq-v1.js?v=20261002salesiqmobile`"></script>"
}

[IO.File]::WriteAllText($indexPath, $c)
Write-Host "Applied Zoho SalesIQ chat setup to $VariantSlug"
