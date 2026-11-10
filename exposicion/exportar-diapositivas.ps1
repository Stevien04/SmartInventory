# Exporta cada diapositiva de slides.html a un PNG de 1920x1080 en video\diapositivas.
# Uso:  powershell -ExecutionPolicy Bypass -File video\exportar-diapositivas.ps1

$ErrorActionPreference = 'Stop'
$total = 11

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Join-Path $here 'slides.html'
$out  = Join-Path $here 'diapositivas'
New-Item -ItemType Directory -Force $out | Out-Null

$browser = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'No se encontro Chrome ni Edge.' }

$base = ([System.Uri]$html).AbsoluteUri
$profileDir = Join-Path $env:TEMP 'helpdesk-slides-profile'

for ($i = 1; $i -le $total; $i++) {
  $png = Join-Path $out ('{0:d2}.png' -f $i)
  if (Test-Path $png) { Remove-Item $png -Force }
  $browserArgs = @(
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1920,1080', "--user-data-dir=`"$profileDir`"", "--screenshot=`"$png`"", "`"$base`?s=$i`""
  )
  Start-Process -FilePath $browser -ArgumentList $browserArgs -Wait -WindowStyle Hidden
  if (-not (Test-Path $png)) { throw "No se genero $png" }
  Write-Output "OK $png"
}
