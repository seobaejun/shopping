# 이미지 서버 연결을 위한 정보 요청

## 📋 개요

상품 이미지 저장을 위한 서버 연결 정보가 필요합니다.
아래 항목을 작성하여 보내주시면 감사하겠습니다.

---

## 🔑 필요한 서버 정보

### 1. 서버 접속 정보

```yaml
SSH 접속:
  ✅ 서버 IP 주소: _________________ (예: 123.456.789.012)
  ✅ SSH 포트: ________ (기본값: 22)
  ✅ SSH 사용자명: _________________ (예: root, ubuntu, admin)
  ✅ SSH 비밀번호 또는 Key 파일: _________________ (비밀번호 또는 .pem 파일)

예시:
  IP: 192.168.1.100
  포트: 22
  사용자: ubuntu
  비밀번호: MyPassword123! (또는 privatekey.pem)
```

### 2. 이미지 저장 경로 정보

```yaml
웹 서버 설정:
  ✅ 웹 루트 경로: _________________ (예: /var/www/html 또는 /usr/share/nginx/html)
  ✅ 이미지 저장 폴더: _________________ (예: /var/www/html/uploads/products)
  ✅ 폴더 권한: ________ (755 또는 775, 쓰기 권한 필요)

예시:
  웹 루트: /var/www/html
  이미지 경로: /var/www/html/uploads/products
  권한: 755 (rwxr-xr-x)
```

### 3. 도메인 또는 Public IP

```yaml
이미지 URL 접근:
  ✅ 도메인: _________________ (예: https://images.yourdomain.com)
     또는
  ✅ Public IP: _________________ (예: http://123.456.789.012)
  
  ✅ 포트 (80, 443 이외라면): ________ (예: 8080, 3000 등)

예시 이미지 URL:
  https://images.yourdomain.com/uploads/products/product-001.jpg
  또는
  http://123.456.789.012/uploads/products/product-001.jpg
```

### 4. 파일 업로드 방법 (둘 중 하나 선택)

#### 옵션 A: FTP/SFTP 계정

```yaml
✅ FTP 호스트: _________________ (예: ftp.yourdomain.com 또는 IP)
✅ FTP 포트: ________ (21: FTP, 22: SFTP)
✅ FTP 사용자명: _________________
✅ FTP 비밀번호: _________________
✅ FTP 루트 경로: _________________ (예: /public_html 또는 /)
```

#### 옵션 B: API 엔드포인트 (있다면)

```yaml
✅ 업로드 API URL: _________________ (예: https://api.yourdomain.com/upload)
✅ API 인증 토큰: _________________ (Bearer token 또는 API Key)
✅ 허용 메서드: POST
✅ Content-Type: multipart/form-data
```

### 5. 서버 환경 정보

```yaml
✅ 운영체제: _________________ (Ubuntu 22.04, CentOS 7, Windows Server 등)
✅ 웹 서버: _________________ (Apache, Nginx, IIS)
✅ 최대 파일 크기 제한: ________ MB (예: 10MB, 50MB)
✅ 허용 파일 형식: _________________ (예: jpg, png, webp, gif)
```

### 6. 보안 관련

```yaml
✅ HTTPS 사용 여부: [ ] Yes  [ ] No
✅ SSL 인증서: [ ] 있음  [ ] 없음 (Let's Encrypt 등)
✅ CORS 설정: [ ] 필요  [ ] 불필요 (외부 도메인 접근 허용)
✅ 방화벽: [ ] 포트 80/443 오픈됨  [ ] 설정 필요
```

---

## 📋 고객 작성용 양식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 서버 접속 정보

- 서버 IP 주소: ________________
- SSH 포트: ________ (기본값: 22)
- SSH 사용자명: ________________
- SSH 비밀번호 또는 Key 파일: ________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. 이미지 저장 경로

- 웹 루트 경로: ________________ (예: /var/www/html)
- 이미지 저장 폴더: ________________ (예: /uploads/products)
- 폴더 쓰기 권한: [ ] 있음  [ ] 없음 (없으면 설정 필요)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. 이미지 접근 URL

- 도메인: ________________ (예: https://images.yourdomain.com)
  또는
- Public IP: ________________ (예: http://123.456.789.012)
- 포트 (80/443 이외): ________ (없으면 공백)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. 파일 업로드 방법 (해당하는 것 체크)

□ SFTP 사용
  - SFTP 호스트: ________________
  - SFTP 포트: ________ (기본값: 22)
  - SFTP 사용자명: ________________
  - SFTP 비밀번호: ________________

□ API 엔드포인트 사용 (있다면)
  - 업로드 API URL: ________________
  - API Key 또는 Token: ________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. 서버 환경

- 운영체제: [ ] Ubuntu  [ ] CentOS  [ ] Windows  [ ] 기타: ________
- 웹 서버: [ ] Apache  [ ] Nginx  [ ] 기타: ________
- 최대 파일 크기 제한: ________ MB
- 허용 파일 형식: [ ] jpg  [ ] png  [ ] webp  [ ] 기타: ________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. 보안 설정

- HTTPS 사용: [ ] 예  [ ] 아니오
- SSL 인증서: [ ] 있음  [ ] 없음
- 외부 도메인 접근(CORS): [ ] 허용  [ ] 비허용

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 최소 필수 정보 (간단 버전)

바쁜 고객에게는 최소한 이 3가지만:

```
1. 서버 IP와 SSH 로그인 정보
   예: ssh ubuntu@123.456.789.012 (비밀번호: ****)

2. 이미지를 저장할 폴더 경로
   예: /var/www/html/uploads

3. 이미지 접근 URL
   예: http://123.456.789.012/uploads/product-001.jpg
```

---

## 🏗️ 프로젝트 구조 (Firebase + 이미지 서버)

```
📦 10쇼핑게임
├─ 📱 프론트엔드 (Netlify/Vercel)
│  ├─ index.html
│  ├─ product-detail.html
│  └─ admin/index.html
│
├─ 🔥 백엔드 (Firebase)
│  ├─ Firestore Database
│  │  ├─ products (상품 정보)
│  │  ├─ users (회원 정보)
│  │  ├─ orders (주문 정보)
│  │  └─ lottery (추첨 정보)
│  │
│  ├─ Authentication (회원 인증)
│  └─ Cloud Functions (서버리스 함수)
│
└─ 🖼️ 이미지 서버 (고객 서버)
   └─ /uploads/products/
      ├─ product-001.jpg
      ├─ product-002.jpg
      └─ ...
```

---

## 💻 이미지 업로드 구현 예시

### 방법 1: SFTP로 직접 업로드

```javascript
// admin 페이지에서 이미지 선택
const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    // Firebase Cloud Function으로 전송
    const response = await fetch('https://your-cloud-function-url/uploadImage', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    return result.imageUrl; // http://123.456.789.012/uploads/products/image.jpg
};
```

### 방법 2: Firebase Storage 사용 (대안)

```javascript
// Firebase Storage 사용 (고객 서버 불필요)
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const uploadToFirebase = async (file) => {
    const storage = getStorage();
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    return url; // Firebase 호스팅 URL
};
```

---

## 🔐 보안 체크리스트

고객 서버 연결 시 확인사항:

```yaml
✅ SSH Key 사용 (비밀번호보다 안전)
✅ 방화벽 설정 (필요한 포트만 오픈)
✅ HTTPS 사용 (SSL 인증서)
✅ 파일 업로드 크기 제한 (DDoS 방지)
✅ 허용 파일 형식 제한 (보안)
✅ 디렉토리 인덱싱 비활성화
✅ CORS 헤더 설정 (필요 시)
```

---

## 📡 연결 테스트 스크립트

고객에게 정보를 받은 후 테스트:

```bash
# SSH 연결 테스트
ssh -p 22 username@123.456.789.012

# SFTP 연결 테스트
sftp -P 22 username@123.456.789.012

# 이미지 URL 접근 테스트
curl http://123.456.789.012/test.jpg

# 포트 열림 확인
telnet 123.456.789.012 80
```

---

## 🚀 다음 단계

정보를 받은 후:

1. ✅ SSH 연결 테스트
2. ✅ 폴더 권한 확인
3. ✅ 테스트 이미지 업로드
4. ✅ URL 접근 확인
5. ✅ Firebase Cloud Function 구현
6. ✅ 관리자 페이지 업로드 기능 연결

---

## 📞 문의

추가 질문이나 도움이 필요하시면 언제든지 연락주세요!

