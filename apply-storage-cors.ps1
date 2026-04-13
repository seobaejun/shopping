# Firebase Storage에 CORS 설정 적용 (공지 PDF 다운로드용 fetch 허용)
# 필요: Google Cloud SDK (gsutil) 설치, gcloud 로그인
# 버킷 이름은 Firebase 콘솔 > Storage 에서 확인하세요.

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CorsFile = Join-Path $ScriptDir "storage-cors.json"
if (-not (Test-Path $CorsFile)) {
    Write-Host "storage-cors.json 을 찾을 수 없습니다: $CorsFile"
    exit 1
}

# 프로젝트 shopping-31dce 기준 (firebase-config.js 의 storageBucket 과 동일 계열)
$Buckets = @(
    "shopping-31dce.firebasestorage.app",
    "shopping-31dce.appspot.com"
)

$gsutil = Get-Command gsutil -ErrorAction SilentlyContinue
if (-not $gsutil) {
    Write-Host "gsutil 이 없습니다. Google Cloud SDK 를 설치한 뒤 다시 실행하세요."
    Write-Host "https://cloud.google.com/sdk/docs/install"
    exit 1
}

foreach ($b in $Buckets) {
    Write-Host "시도: gs://$b"
    try {
        gsutil cors set $CorsFile "gs://$b"
        Write-Host "적용 완료: gs://$b"
        exit 0
    } catch {
        Write-Host "실패: $_"
    }
}

Write-Host "위 버킷 이름이 프로젝트와 다르면 이 스크립트의 `$Buckets 를 수정하세요."
exit 1
