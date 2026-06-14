param(
  [string]$ProjectId = $env:FIREBASE_PROJECT_ID,
  [string]$Bucket = $env:FIRESTORE_BACKUP_BUCKET
)

$ErrorActionPreference = "Stop"

if (-not $ProjectId) {
  throw "Defina FIREBASE_PROJECT_ID ou informe -ProjectId."
}

if (-not $Bucket) {
  throw "Defina FIRESTORE_BACKUP_BUCKET ou informe -Bucket."
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
$destination = "gs://$Bucket/firestore/$timestamp"

Write-Host "Iniciando backup de $ProjectId em $destination"

gcloud firestore export $destination `
  --project=$ProjectId `
  --database="(default)" `
  --async

if ($LASTEXITCODE -ne 0) {
  throw "O comando de exportação do Firestore falhou."
}

Write-Host "Backup solicitado com sucesso."
