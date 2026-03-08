# GitHub(origin) + Vercel 원격(vercel)에 동시 푸시
Set-Location $PSScriptRoot
git push origin main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git push vercel main
exit $LASTEXITCODE
