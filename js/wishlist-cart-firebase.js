/**
 * 관심상품/장바구니 Firestore 저장
 * - 로그인 사용자: Firestore user_cart_wishlist 컬렉션에 저장 (사라지지 않음)
 * - 비로그인: localStorage만 사용 (로그인 시 Firestore와 동기화 가능)
 */

(function (global) {
    'use strict';

    var COLLECTION_NAME = 'user_cart_wishlist';
    var STORAGE_KEY_WISHLIST = 'wishlist';
    var STORAGE_KEY_CART = 'cart';

    function getDb() {
        if (typeof firebase === 'undefined' || !firebase.firestore) return Promise.resolve(null);
        try {
            if (!firebase.apps || !firebase.apps.length) {
                var config = (global.window && global.window.firebaseConfig) || {};
                if (config.apiKey) firebase.initializeApp(config);
            }
            return Promise.resolve(firebase.firestore());
        } catch (e) {
            return Promise.resolve(null);
        }
    }

    /** 로그인 사용자 ID (userId). 없으면 null */
    function getCurrentUserId() {
        try {
            if (global.window.mypageApi && typeof global.window.mypageApi.getLoginUser === 'function') {
                var user = global.window.mypageApi.getLoginUser();
                if (user && user.userId) return user.userId;
            }
            if (global.localStorage.getItem('isLoggedIn') === 'true') {
                var raw = global.localStorage.getItem('loginUser');
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.userId) return parsed.userId;
                }
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    /** Firestore 문서 ID용으로 userId 정규화 (허용 문자만) */
    function sanitizeDocId(userId) {
        if (!userId || typeof userId !== 'string') return '';
        return userId.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }

    /** 관심상품 목록 조회 (로그인 시 Firestore, 아니면 localStorage) */
    function getWishlist() {
        var userId = getCurrentUserId();
        if (userId) {
            return getDb().then(function (db) {
                if (!db) return getWishlistFromStorage();
                var docId = sanitizeDocId(userId);
                if (!docId) return getWishlistFromStorage();
                return db.collection(COLLECTION_NAME).doc(docId).get()
                    .then(function (snap) {
                        var data = snap.exists ? snap.data() : null;
                        var list = (data && Array.isArray(data.wishlist)) ? data.wishlist : [];
                        try { global.localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(list)); } catch (e) { /* ignore */ }
                        return list;
                    })
                    .catch(function (e) {
                        console.warn('wishlist Firestore 조회 실패, localStorage 사용:', e);
                        return getWishlistFromStorage();
                    });
            });
        }
        return Promise.resolve(getWishlistFromStorage());
    }

    function getWishlistFromStorage() {
        try {
            var raw = global.localStorage.getItem(STORAGE_KEY_WISHLIST) || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    /** 관심상품 저장 (로그인 시 Firestore + localStorage, 아니면 localStorage만) */
    function setWishlist(arr) {
        if (!Array.isArray(arr)) arr = [];
        try { global.localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(arr)); } catch (e) { /* ignore */ }
        var userId = getCurrentUserId();
        if (!userId) return Promise.resolve();
        return getDb().then(function (db) {
            if (!db) return;
            var docId = sanitizeDocId(userId);
            if (!docId) return;
            return db.collection(COLLECTION_NAME).doc(docId).set({
                wishlist: arr,
                cart: getCartFromStorage(),
                updatedAt: firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp
                    ? firebase.firestore.FieldValue.serverTimestamp()
                    : new Date()
            }, { merge: true }).then(function () {
                console.log('wishlist Firestore 저장 완료:', docId);
            });
        }).catch(function (e) {
            console.warn('wishlist Firestore 저장 실패:', e);
        });
    }

    /** 장바구니 목록 조회 */
    function getCart() {
        var userId = getCurrentUserId();
        if (userId) {
            return getDb().then(function (db) {
                if (!db) return getCartFromStorage();
                var docId = sanitizeDocId(userId);
                if (!docId) return getCartFromStorage();
                return db.collection(COLLECTION_NAME).doc(docId).get()
                    .then(function (snap) {
                        var data = snap.exists ? snap.data() : null;
                        var list = (data && Array.isArray(data.cart)) ? data.cart : [];
                        try { global.localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(list)); } catch (e) { /* ignore */ }
                        return list;
                    })
                    .catch(function (e) {
                        console.warn('cart Firestore 조회 실패, localStorage 사용:', e);
                        return getCartFromStorage();
                    });
            });
        }
        return Promise.resolve(getCartFromStorage());
    }

    function getCartFromStorage() {
        try {
            var raw = global.localStorage.getItem(STORAGE_KEY_CART) || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    /** 장바구니 저장 */
    function setCart(arr) {
        if (!Array.isArray(arr)) arr = [];
        try { global.localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(arr)); } catch (e) { /* ignore */ }
        var userId = getCurrentUserId();
        if (!userId) return Promise.resolve();
        return getDb().then(function (db) {
            if (!db) return;
            var docId = sanitizeDocId(userId);
            if (!docId) return;
            return db.collection(COLLECTION_NAME).doc(docId).set({
                cart: arr,
                wishlist: getWishlistFromStorage(),
                updatedAt: firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp
                    ? firebase.firestore.FieldValue.serverTimestamp()
                    : new Date()
            }, { merge: true }).then(function () {
                console.log('cart Firestore 저장 완료:', docId);
            });
        }).catch(function (e) {
            console.warn('cart Firestore 저장 실패:', e);
        });
    }

    /** 로그인 시 localStorage 데이터를 Firestore로 한 번 올리고, 이후 Firestore 기준으로 사용 */
    function syncLocalToFirebase() {
        var userId = getCurrentUserId();
        if (!userId) return Promise.resolve();
        return getDb().then(function (db) {
            if (!db) return;
            var docId = sanitizeDocId(userId);
            if (!docId) return;
            var wishlist = getWishlistFromStorage();
            var cart = getCartFromStorage();
            return db.collection(COLLECTION_NAME).doc(docId).set({
                wishlist: wishlist,
                cart: cart,
                updatedAt: firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp
                    ? firebase.firestore.FieldValue.serverTimestamp()
                    : new Date()
            }, { merge: true }).then(function () {
                console.log('user_cart_wishlist 동기화 완료:', docId);
            });
        }).catch(function (e) {
            console.warn('syncLocalToFirebase 실패:', e);
        });
    }

    global.wishlistCartFirebase = {
        getCurrentUserId: getCurrentUserId,
        getWishlist: getWishlist,
        setWishlist: setWishlist,
        getCart: getCart,
        setCart: setCart,
        syncLocalToFirebase: syncLocalToFirebase,
        getWishlistFromStorage: getWishlistFromStorage,
        getCartFromStorage: getCartFromStorage
    };

    // 페이지 로드 시: 로그인 사용자면 로컬 데이터 Firestore 업로드 + 다른 기기에서 로그인 시 Firestore에서 내려받기
    function onLoadSync() {
        var userId = getCurrentUserId();
        if (!userId) return;
        var hasLocal = getWishlistFromStorage().length > 0 || getCartFromStorage().length > 0;
        if (hasLocal) {
            syncLocalToFirebase();
        }
        getWishlist().then(function () {});
        getCart().then(function () {});
    }
    if (global.document && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(onLoadSync, 300); });
    } else {
        setTimeout(onLoadSync, 300);
    }
})(typeof window !== 'undefined' ? window : this);
