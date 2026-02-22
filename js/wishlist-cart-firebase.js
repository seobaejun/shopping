/**
 * 관심상품/장바구니 - Firestore 단일 저장소
 * - 로그인 사용자: Firestore만 읽기/쓰기 (PC/기기 동일 데이터)
 * - 비로그인: localStorage만 사용
 */

(function (global) {
    'use strict';

    var COLLECTION_NAME = 'user_cart_wishlist';
    var STORAGE_KEY_WISHLIST = 'wishlist';
    var STORAGE_KEY_CART = 'cart';
    var RETRY_DELAY_MS = 400;
    var MAX_DB_RETRIES = 5;
    var MAX_READ_RETRIES = 2;

    function getDb() {
        if (typeof firebase === 'undefined' || !firebase.firestore) return null;
        try {
            if (!firebase.apps || !firebase.apps.length) {
                var config = (global.window && global.window.firebaseConfig) || {};
                if (config.apiKey) firebase.initializeApp(config);
            }
            return firebase.firestore();
        } catch (e) {
            return null;
        }
    }

    function getDbWithRetry(retriesLeft) {
        retriesLeft = retriesLeft == null ? MAX_DB_RETRIES : retriesLeft;
        var db = getDb();
        if (db) return Promise.resolve(db);
        if (retriesLeft <= 0) return Promise.resolve(null);
        return new Promise(function (resolve) {
            setTimeout(function () {
                getDbWithRetry(retriesLeft - 1).then(resolve);
            }, RETRY_DELAY_MS);
        });
    }

    /** 로그인 사용자 ID - Firebase Auth만 사용 (localStorage 사용 안 함) */
    function getCurrentUserId() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                var uid = firebase.auth().currentUser.uid;
                return uid ? String(uid) : null;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function sanitizeDocId(userId) {
        if (!userId || typeof userId !== 'string') return '';
        return userId.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }

    function serverTimestamp() {
        return firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date();
    }

    function fetchWishlistOnce(db, docId) {
        return db.collection(COLLECTION_NAME).doc(docId).get()
            .then(function (snap) {
                var data = snap.exists ? snap.data() : null;
                var list = (data && Array.isArray(data.wishlist)) ? data.wishlist : [];
                try { global.localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(list)); } catch (e) { /* ignore */ }
                return list;
            });
    }

    /** 로그인 시 Firestore에서만 조회. 비로그인만 localStorage. 읽기 실패 시 재시도 */
    function getWishlist() {
        var userId = getCurrentUserId();
        if (!userId) return Promise.resolve(getWishlistFromStorage());
        var docId = sanitizeDocId(userId);
        if (!docId) return Promise.resolve([]);
        return getDbWithRetry().then(function (db) {
            if (!db) return [];
            var attempt = 0;
            function tryGet() {
                return fetchWishlistOnce(db, docId).catch(function (e) {
                    console.warn('wishlist Firestore 조회 실패:', e);
                    attempt += 1;
                    if (attempt < MAX_READ_RETRIES) {
                        return new Promise(function (resolve) {
                            setTimeout(function () { tryGet().then(resolve); }, 350);
                        });
                    }
                    return [];
                });
            }
            return tryGet();
        });
    }

    function getWishlistFromStorage() {
        try {
            var raw = global.localStorage.getItem(STORAGE_KEY_WISHLIST) || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    /** 로그인 시 Firestore에만 저장. 기존 doc 읽어서 cart 유지 후 wishlist만 갱신 */
    function setWishlist(arr) {
        if (!Array.isArray(arr)) arr = [];
        var userId = getCurrentUserId();
        if (!userId) {
            try { global.localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(arr)); } catch (e) { /* ignore */ }
            return Promise.resolve();
        }
        return getDbWithRetry().then(function (db) {
            if (!db) return;
            var docId = sanitizeDocId(userId);
            if (!docId) return;
            return db.collection(COLLECTION_NAME).doc(docId).get()
                .then(function (snap) {
                    var existing = (snap && snap.exists && snap.data()) ? snap.data() : {};
                    var cart = Array.isArray(existing.cart) ? existing.cart : [];
                    return db.collection(COLLECTION_NAME).doc(docId).set({
                        wishlist: arr,
                        cart: cart,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                })
                .then(function () {
                    try { global.localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(arr)); } catch (e) { /* ignore */ }
                });
        }).catch(function (e) {
            console.warn('wishlist Firestore 저장 실패:', e);
        });
    }

    function fetchCartOnce(db, docId) {
        return db.collection(COLLECTION_NAME).doc(docId).get()
            .then(function (snap) {
                var data = snap.exists ? snap.data() : null;
                var list = (data && Array.isArray(data.cart)) ? data.cart : [];
                try { global.localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(list)); } catch (e) { /* ignore */ }
                return list;
            });
    }

    /** 로그인 시 Firestore에서만 조회. 읽기 실패 시 재시도 */
    function getCart() {
        var userId = getCurrentUserId();
        if (!userId) return Promise.resolve(getCartFromStorage());
        var docId = sanitizeDocId(userId);
        if (!docId) return Promise.resolve([]);
        return getDbWithRetry().then(function (db) {
            if (!db) return [];
            var attempt = 0;
            function tryGet() {
                return fetchCartOnce(db, docId).catch(function (e) {
                    console.warn('cart Firestore 조회 실패:', e);
                    attempt += 1;
                    if (attempt < MAX_READ_RETRIES) {
                        return new Promise(function (resolve) {
                            setTimeout(function () { tryGet().then(resolve); }, 350);
                        });
                    }
                    return [];
                });
            }
            return tryGet();
        });
    }

    function getCartFromStorage() {
        try {
            var raw = global.localStorage.getItem(STORAGE_KEY_CART) || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    /** 로그인 시 Firestore에만 저장. 기존 doc 읽어서 wishlist 유지 후 cart만 갱신 */
    function setCart(arr) {
        if (!Array.isArray(arr)) arr = [];
        var userId = getCurrentUserId();
        if (!userId) {
            try { global.localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(arr)); } catch (e) { /* ignore */ }
            return Promise.resolve();
        }
        return getDbWithRetry().then(function (db) {
            if (!db) return;
            var docId = sanitizeDocId(userId);
            if (!docId) return;
            return db.collection(COLLECTION_NAME).doc(docId).get()
                .then(function (snap) {
                    var existing = (snap && snap.exists && snap.data()) ? snap.data() : {};
                    var wishlist = Array.isArray(existing.wishlist) ? existing.wishlist : [];
                    return db.collection(COLLECTION_NAME).doc(docId).set({
                        cart: arr,
                        wishlist: wishlist,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                })
                .then(function () {
                    try { global.localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(arr)); } catch (e) { /* ignore */ }
                });
        }).catch(function (e) {
            console.warn('cart Firestore 저장 실패:', e);
        });
    }

    global.wishlistCartFirebase = {
        getCurrentUserId: getCurrentUserId,
        getWishlist: getWishlist,
        setWishlist: setWishlist,
        getCart: getCart,
        setCart: setCart,
        getWishlistFromStorage: getWishlistFromStorage,
        getCartFromStorage: getCartFromStorage
    };

    // 로그인 사용자: 페이지 로드 시 Firestore에서만 불러와서 로컬 캐시 갱신 (로컬→Firestore 덮어쓰기 없음)
    function onLoadFetch() {
        var userId = getCurrentUserId();
        if (!userId) return;
        getWishlist().then(function () {});
        getCart().then(function () {});
    }
    if (global.document && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(onLoadFetch, 300); });
    } else {
        setTimeout(onLoadFetch, 300);
    }
})(typeof window !== 'undefined' ? window : this);
