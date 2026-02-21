# 10쇼핑게임 개발 서버 실행
# "localhost 데이터를 보내지 않았습니다" 오류는 서버가 꺼져 있을 때 발생합니다.
# 이 스크립트 실행 후 브라우저에서 http://localhost:3000 으로 접속하세요.

$Port = 3000
$Root = $PSScriptRoot

Write-Host ""
Write-Host "  [10쇼핑게임] 개발 서버 시작" -ForegroundColor Cyan
Write-Host "  접속 주소: http://localhost:$Port" -ForegroundColor Green
Write-Host "  관리자:    http://localhost:$Port/admin/index.html" -ForegroundColor Green
Write-Host "  종료:      Ctrl + C" -ForegroundColor Yellow
Write-Host ""

Set-Location $Root
python -m http.server $Port
