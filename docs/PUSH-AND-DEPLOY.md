# 푸시 및 Vercel 배포

- **GitHub 저장소**: `origin` → https://github.com/seobaejun/shopping
- **Vercel 배포용**: `vercel` → https://github.com/seobaejun/10shopping (Vercel이 이 저장소를 감시함)

배포까지 하려면 **두 원격 모두 푸시**해야 함:

```bash
cd c:\10-2\shopping
git push origin main
git push vercel main
```

`vercel` remote가 없으면 한 번만 추가:

```bash
git remote add vercel https://github.com/seobaejun/10shopping.git
```
