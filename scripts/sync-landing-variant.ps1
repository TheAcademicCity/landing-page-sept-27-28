# Copy WhatsApp LP (root index.html) into a variant folder and fix asset paths for subfolder URLs.
#
# NORMAL WORKFLOW: Edit root index.html (WhatsApp) and best-boarding-school-india-v1/index.html (Zobot) directly.
# Do NOT use this script to maintain those two primary LPs.
#
# Legacy: optional refresh for -fb folders from WhatsApp LP only. Never sync into best-boarding-school-india-v1
# (that overwrites Zobot with WhatsApp). See LANDING-PAGES.md.
#
# (python -m http.server, static nginx alias, etc.)
param(
  [Parameter(Mandatory = $true)]
  [string]$VariantSlug
)

$root = Split-Path $PSScriptRoot -Parent
$variantDir = Join-Path $root $VariantSlug
if (-not (Test-Path $variantDir)) {
  New-Item -ItemType Directory -Path $variantDir | Out-Null
}

Copy-Item (Join-Path $root "index.html") (Join-Path $variantDir "index.html") -Force
Copy-Item (Join-Path $root "thank-you.html") (Join-Path $variantDir "thank-you.html") -Force

foreach ($file in @("index.html", "thank-you.html")) {
  $path = Join-Path $variantDir $file
  $c = [IO.File]::ReadAllText($path)
  $c = [regex]::Replace($c, 'href="images/', 'href="../images/')
  $c = [regex]::Replace($c, 'src="images/', 'src="../images/')
  $c = [regex]::Replace($c, 'content="images/', 'content="../images/')
  $c = [regex]::Replace($c, '(?<!\.\./)(?<=["''\s,])images/', '../images/')
  $c = [regex]::Replace($c, 'href="css/', 'href="../css/')
  $c = [regex]::Replace($c, '(?<!\.\./)(?<=["''])js/', '../js/')
  $c = $c -replace 'href="favicon\.ico"', 'href="../favicon.ico"'
  $c = $c -replace 'href="manifest\.json"', 'href="../manifest.json"'
  $c = $c -replace 'href="icon\.png"', 'href="../icon.png"'
  $c = $c -replace 'href="apple-icon\.png"', 'href="../apple-icon.png"'
  if ($file -eq "index.html" -and $c -notmatch 'data-landing-slug') {
    $c = $c -replace '<html lang="en">', "<html lang=`"en`" data-landing-slug=`"$VariantSlug`">"
  }
  [IO.File]::WriteAllText($path, $c)
}

Write-Host "Synced $VariantSlug from root index/thank-you (asset paths use ../)."
