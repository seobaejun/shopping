# PC마다 관심상품/장바구니가 다르게 보이는 이유

## 1. 구조상 원인

### (1) 스크립트가 일부 페이지만 로드됨
- **wishlist-cart-firebase.js**는 **mypage.html**, **product-detail.html**에서만 로드됩니다.
- **index.html**, **products-list.html**, **search-results.html** 등에는 이 스크립트가 없습니다.
- 그래서 “Firestore만 쓴다”는 로직이 **일부 페이지만** 적용되고, 나머지 페이지에서는 예전 방식(localStorage 등)이 쓰이거나, 아예 다른 방식으로 개수를 쓸 수 있습니다.

### (2) 로그인 사용자 인식 방식이 페이지마다 다름
- `getCurrentUserId()`는 다음 순서로 사용자를 찾습니다.
  1. **mypageApi.getLoginUser()** (mypage-api.js)
  2. **localStorage**의 `isLoggedIn`, `loginUser`
- **mypage.html**에는 mypage-api.js가 있어서 `mypageApi.getLoginUser()`를 씁니다.
- **product-detail.html**에는 mypage-api.js가 없어서 **localStorage만** 사용합니다.
- 페이지마다 “지금 로그인한 사람”을 보는 경로가 달라지고, 어떤 페이지에서는 userId를 못 찾아서 **비로그인으로 처리 → localStorage만 사용**될 수 있습니다.  
  → 그 PC의 localStorage만 보이므로 **PC마다 다르게** 보입니다.

### (3) Firestore 읽기 실패 시
- 로그인된 경우 코드는 Firestore만 읽도록 되어 있고, 실패하면 빈 배열 `[]`을 반환합니다.
- 특정 PC에서만 **네트워크 오류**, **Firebase 초기화 실패**(스크립트 순서/캐시), **권한 오류** 등으로 읽기가 실패하면, 그 PC에서는 **0개**로 보입니다.
- 반대로 다른 PC에서는 정상적으로 Firestore를 읽으면 **정상 개수**가 보이므로, **PC마다 다르게** 보이게 됩니다.

### (4) 예전 코드/캐시
- 수정한 JS가 **배포되지 않았거나**, 브라우저/CDN이 **예전 JS를 캐시**하고 있으면,  
  예전처럼 “localStorage + Firestore”를 같이 쓰는 동작이 계속 돌아갑니다.
- 예전 코드는 “로그인해도 localStorage를 함께 사용”하므로, **PC별로 localStorage가 다르다 → PC마다 다르게** 보입니다.

---

## 2. 정리: “PC마다 다르게 보인다”의 가능한 이유

| 원인 | 설명 |
|------|------|
| **스크립트 미로드** | index 등 일부 페이지에는 wishlist-cart-firebase.js가 없어, 그 페이지에서는 Firestore 기준이 아님. |
| **userId 인식 불일치** | mypage는 mypageApi, product-detail은 localStorage만 사용 → 어떤 페이지에서는 “비로그인”으로 인식해 localStorage만 사용. |
| **Firestore 읽기 실패** | 특정 PC에서만 읽기 실패 시 그 PC에서는 0개, 다른 PC에서는 정상 → PC마다 다름. |
| **배포/캐시** | 새 코드가 반영되지 않아 예전 이중 저장 로직이 돌아가면, PC별 localStorage 차이로 다르게 보임. |

---

## 3. 권장 대응

1. **모든 페이지에서 동일한 “로그인 사용자” 기준 사용**  
   - `getCurrentUserId()`를 **localStorage 기준으로 통일**하거나,  
   - 공통 스크립트를 한 번 로드해 두고, 그 안에서만 localStorage를 참조하도록 하면, “이 페이지에선 로그인인데 저 페이지에선 비로그인” 같은 차이가 줄어듭니다.

2. **관심상품/장바구니를 보여주는 모든 페이지에 wishlist-cart-firebase.js + Firebase 로드**  
   - Firestore만 쓰는 로직이 **같은 스크립트, 같은 초기화**로 모든 페이지에 적용되도록 합니다.

3. **배포 후 캐시 무효화**  
   - 배포 후에도 안 바뀌면 JS 파일에 쿼리 스트링 버전 올리기 (예: `wishlist-cart-firebase.js?v=2`), 또는 브라우저 강력 새로고침으로 확인.

4. **Firestore 읽기 실패 시 로그 확인**  
   - 콘솔에 `wishlist Firestore 조회 실패` / `cart Firestore 조회 실패`가 뜨는지 확인하면, “그 PC에서만 실패”인지 알 수 있습니다.

위 내용이 “PC마다 관심상품/장바구니가 다르게 표시되는 이유”에 대한 설명입니다.
