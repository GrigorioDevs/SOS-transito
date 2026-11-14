$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Test-Path '.env')) { throw 'Execute configurar-local.ps1 primeiro.' }
$values = @{}
Get-Content '.env' | ForEach-Object {
  if ($_ -match '^(POSTGRES_PASSWORD|SOS_APP_PASSWORD)=(.+)$') { $values[$matches[1]] = $matches[2] }
}
if (-not $values['POSTGRES_PASSWORD']) { throw 'Senha de migracao ausente.' }
$connection = 'Host=127.0.0.1;Port=55432;Database=sos_transito_dev;Username=sos_owner;Password=' + $values['POSTGRES_PASSWORD']
dotnet ef database update --project backend/Sos.Infra --startup-project backend/Sos.Api --connection $connection
if ($LASTEXITCODE -ne 0) { throw 'Falha na migracao. Confira banco, porta e logs.' }
Write-Host 'Banco atualizado. A API usa sos_app, com permissao de leitura nesta etapa.'
