@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   [10쇼핑게임] 개발 서버 시작
echo   접속 주소: http://localhost:3000
echo   관리자:    http://localhost:3000/admin/index.html
echo   종료:      Ctrl + C
echo.

python -m http.server 3000
pause
