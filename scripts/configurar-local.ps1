$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
function New-LocalSecret {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}
if (-not (Test-Path '.env')) {
  $owner = New-LocalSecret
  $app = New-LocalSecret
  @("POSTGRES_PASSWORD=$owner", "SOS_APP_PASSWORD=$app") |
    Set-Content -Path '.env' -Encoding ascii
  Write-Host 'Arquivo de configuracao local criado.'
}
$values = @{}
Get-Content '.env' | ForEach-Object {
  if ($_ -match '^(POSTGRES_PASSWORD|SOS_APP_PASSWORD)=(.+)$') {
    $values[$matches[1]] = $matches[2]
  }
}
if (-not $values['POSTGRES_PASSWORD'] -or -not $values['SOS_APP_PASSWORD']) {
  throw '.env incompleto. Confira as duas senhas locais.'
}
$connection = 'Host=127.0.0.1;Port=55432;Database=sos_transito_dev;Username=sos_app;Password=' + $values['SOS_APP_PASSWORD']
dotnet user-secrets set 'ConnectionStrings:Default' $connection --project backend/Sos.Api
if ($LASTEXITCODE -ne 0) { throw 'Falha ao configurar User Secrets.' }
Write-Host 'Pronto. Agora execute docker compose up -d.'
