# Vercel 배포 가이드

저장소: **https://github.com/seobaejun/shopping**

## 방법 1: Vercel 대시보드로 배포 (권장)

GitHub 토큰을 코드에 넣을 필요 없이, Vercel이 GitHub와 연결해 자동 배포합니다.

1. **Vercel 가입/로그인**
   - https://vercel.com 접속
   - **Sign up** → **Continue with GitHub** 선택
   - GitHub 계정으로 로그인 (seobaejun)

2. **프로젝트 가져오기**
   - **Add New** → **Project**
   - **Import Git Repository**에서 `seobaejun/shopping` 선택
   - **Import** 클릭

3. **설정 확인**
   - **Root Directory**: 비워두기 (저장소 루트가 프로젝트 루트)
   - **Framework Preset**: Other (또는 Vite 등 사용 안 함)
   - **Build Command**: 비워두기 (정적 사이트)
   - **Output Directory**: `.` 또는 비워두기

4. **Deploy** 클릭

5. 배포 완료 후 `https://shopping-xxx.vercel.app` 형태의 URL이 발급됩니다.

---

## 방법 2: Vercel CLI로 배포

```bash
# Vercel CLI 설치 (한 번만)
npm i -g vercel

# 프로젝트 폴더로 이동
cd C:\10-2\shopping

# 배포 (처음 실행 시 로그인 안내)
vercel
```

- 처음 실행 시 브라우저에서 Vercel 로그인
- **Set up and deploy?** → Y
- **Which scope?** → 본인 계정
- **Link to existing project?** → N (새 프로젝트)
- **Project name** → shopping (원하는 이름)
- **Directory** → ./ (현재 폴더)

---

## 보안 안내

- **GitHub 토큰(비밀번호)은 코드·채팅·문서에 절대 넣지 마세요.**
- 이미 노출된 토큰이 있다면 GitHub에서 즉시 **Revoke** 후 새 토큰을 발급하세요.  
  경로: GitHub → Settings → Developer settings → Personal access tokens → 해당 토큰 Revoke
- Vercel 배포는 **방법 1**처럼 GitHub 연동만 하면 되므로, 배포용으로 GitHub 토큰을 Vercel에 입력할 필요가 없습니다.

---

## 배포 후 확인

- 메인: `https://[프로젝트명].vercel.app/`
- 관리자: `https://[프로젝트명].vercel.app/admin/`
- Firebase 등 환경 변수가 필요하면 Vercel 프로젝트 **Settings → Environment Variables**에서 추가하세요.
