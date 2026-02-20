/**
 * 마이페이지 전용 Firestore 조회 모듈
 * - 로그인 사용자 식별 통일 (docId, userId)
 * - 회원 1건, 주문 목록 등 마이페이지용 조회 함수
 */

(function (global) {
    'use strict';

    var db = null;
    var initPromise = null;

    var FIREBASE_CONFIG = {
        apiKey: 'AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg',
        authDomain: 'shopping-31dce.firebaseapp.com',
        projectId: 'shopping-31dce',
        storageBucket: 'shopping-31dce.firebasestorage.app',
        messagingSenderId: '344605730776',
        appId: '1:344605730776:web:925f9d6206b1ff2e0374ad',
        measurementId: 'G-B7V6HK8Z7X'
    };

    /**
     * Firebase 앱·Firestore 초기화 (마이페이지에서만 사용)
     * firebase-init.js의 firebaseConfig 또는 위 FIREBASE_CONFIG 사용
     */
    function getMypageDb() {
        if (db) return Promise.resolve(db);
        if (initPromise) return initPromise;
        initPromise = (function init() {
            return new Promise(function (resolve) {
                if (typeof firebase === 'undefined' || !firebase.firestore) {
                    console.warn('mypage-api: Firebase SDK 대기 중...');
                    setTimeout(function () { init().then(resolve); }, 300);
                    return;
                }
                try {
                    var config = (global.window && global.window.firebaseConfig) || FIREBASE_CONFIG;
                    if (!firebase.apps.length) {
                        firebase.initializeApp(config);
                    }
                    db = firebase.firestore();
                    resolve(db);
                } catch (e) {
                    console.error('mypage-api: Firebase 초기화 오류', e);
                    resolve(null);
                }
            });
        })();
        return initPromise;
    }

    /**
     * localStorage에서 로그인 사용자 정보 반환
     * @returns {object|null} { docId, userId, name, email, phone, accountNumber, ... } 또는 null
     */
    function getLoginUser() {
        try {
            if (localStorage.getItem('isLoggedIn') !== 'true') return null;
            var raw = localStorage.getItem('loginUser');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    /**
     * 마이페이지에서 사용할 회원 식별자 통일
     * - docId: Firestore members 문서 id (주문 memberId와 매칭)
     * - userId: 로그인 아이디 (members.userId와 동일)
     * @returns {Promise<{ docId: string, userId: string }|null>}
     */
    function getCurrentMemberId() {
        var login = getLoginUser();
        if (!login || !login.userId) return Promise.resolve(null);

        var docId = login.docId || null;
        var userId = login.userId;

        if (docId) {
            return Promise.resolve({ docId: docId, userId: userId });
        }

        return getMypageDb().then(function (database) {
            if (!database) return { docId: null, userId: userId };
            return database.collection('members')
                .where('userId', '==', userId)
                .limit(1)
                .get()
                .then(function (snap) {
                    if (snap.empty) return { docId: null, userId: userId };
                    return { docId: snap.docs[0].id, userId: userId };
                })
                .catch(function () { return { docId: null, userId: userId }; });
        });
    }

    /**
     * 현재 로그인 회원의 Firestore 회원 문서 1건 조회
     * @returns {Promise<object|null>} { id, userId, name, email, phone, ... } 또는 null
     */
    function getCurrentMember() {
        return getCurrentMemberId().then(function (ids) {
            if (!ids || !ids.docId) return null;
            return getMypageDb().then(function (database) {
                if (!database) return null;
                return database.collection('members').doc(ids.docId).get()
                    .then(function (doc) {
                        if (!doc.exists) return null;
                        return { id: doc.id, ...doc.data() };
                    })
                    .catch(function () { return null; });
            });
        });
    }

    /**
     * 현재 로그인 회원의 주문 목록 조회 (memberId 또는 userId로 필터)
     * @param {object} options - { limit: number } (선택)
     * @returns {Promise<Array>} 주문 배열, 최신순
     */
    function getMyOrders(options) {
        options = options || {};
        var limit = options.limit || 500;

        return getCurrentMemberId().then(function (ids) {
            if (!ids) return [];
            return getMypageDb().then(function (database) {
                if (!database) return [];
                var col = database.collection('orders');
                return col.get().then(function (snap) {
                    var list = [];
                    snap.docs.forEach(function (d) {
                        var data = d.data();
                        var id = d.id;
                        var match = (data.memberId === ids.docId) || (data.userId === ids.userId) ||
                            (data.memberId === ids.userId) || (data.userId === ids.docId);
                        if (match) list.push({ id: id, ...data });
                    });
                    list.sort(function (a, b) {
                        var at = (a.createdAt && (a.createdAt.seconds != null ? a.createdAt.seconds : 0)) || 0;
                        var bt = (b.createdAt && (b.createdAt.seconds != null ? b.createdAt.seconds : 0)) || 0;
                        return bt - at;
                    });
                    return list.slice(0, limit);
                }).catch(function () { return []; });
            });
        });
    }

    /**
     * 내 주첨 결과 목록 (관리자가 추첨 확정 시 Firestore에 저장하는 경우 사용)
     * @returns {Promise<Array>} { round, productName, result: 'winner'|'loser', support }[]
     */
    function getMyLotteryResults() {
        return getCurrentMemberId().then(function (ids) {
            if (!ids) return [];
            return getMypageDb().then(function (database) {
                if (!database) return [];
                return database.collection('lottery_results').get()
                    .then(function (snap) {
                        var list = [];
                        snap.docs.forEach(function (d) {
                            var data = d.data();
                            var match = (data.memberId === ids.docId) || (data.userId === ids.userId);
                            if (match) list.push({ id: d.id, ...data });
                        });
                        list.sort(function (a, b) {
                            var at = (a.date && a.date.seconds) ? a.date.seconds : 0;
                            var bt = (b.date && b.date.seconds) ? b.date.seconds : 0;
                            return bt - at;
                        });
                        return list;
                    })
                    .catch(function () { return []; });
            });
        });
    }

    /**
     * 게시판 글 목록 조회 (공지/이벤트 등, 읽기 전용)
     * @param {string} boardType - 'notice' | 'event' | 'qna' | 'review'
     * @param {object} [opts] - { limit: number }
     * @returns {Promise<Array>} { id, title, content, authorName, createdAt, ... }[]
     */
    function getBoardPosts(boardType, opts) {
        if (!boardType) return Promise.resolve([]);
        return getMypageDb().then(function (database) {
            if (!database) return [];
            var limit = (opts && opts.limit) || 50;
            return database.collection('posts')
                .where('boardType', '==', boardType)
                .get()
                .then(function (snap) {
                    var list = [];
                    snap.docs.forEach(function (d) {
                        list.push({ id: d.id, ...d.data() });
                    });
                    list.sort(function (a, b) {
                        var at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                        var bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                        return bt - at;
                    });
                    return list.slice(0, limit);
                })
                .catch(function () { return []; });
        });
    }

    /**
     * 회원 정보 수정 (마이페이지에서만 사용, 허용 필드만)
     * @param {string} docId - members 문서 id
     * @param {object} data - name, phone, postcode, address, detailAddress, bank, accountNumber, marketingEmail, marketingSms, addresses
     * @returns {Promise<void>}
     */
    function updateMember(docId, data) {
        if (!docId || !data) return Promise.reject(new Error('docId와 data가 필요합니다.'));
        return getMypageDb().then(function (database) {
            if (!database) return Promise.reject(new Error('Firestore를 사용할 수 없습니다.'));
            var allowed = {};
            if (data.name !== undefined) allowed.name = data.name;
            if (data.phone !== undefined) allowed.phone = data.phone;
            if (data.postcode !== undefined) allowed.postcode = data.postcode;
            if (data.address !== undefined) allowed.address = data.address;
            if (data.detailAddress !== undefined) allowed.detailAddress = data.detailAddress;
            if (data.bank !== undefined) allowed.bank = data.bank;
            if (data.accountNumber !== undefined) allowed.accountNumber = data.accountNumber;
            if (data.marketingEmail !== undefined) allowed.marketingEmail = data.marketingEmail === true;
            if (data.marketingSms !== undefined) allowed.marketingSms = data.marketingSms === true;
            if (data.addresses !== undefined && Array.isArray(data.addresses)) allowed.addresses = data.addresses;
            allowed.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            return database.collection('members').doc(docId).update(allowed);
        });
    }

    /**
     * 회원 탈퇴 처리 (상태만 변경, 개인정보는 보관 정책에 따라 유지 또는 삭제)
     * @param {string} docId - members 문서 id
     * @returns {Promise<void>}
     */
    function withdrawMember(docId) {
        if (!docId) return Promise.reject(new Error('회원 정보를 확인할 수 없습니다.'));
        return getMypageDb().then(function (database) {
            if (!database) return Promise.reject(new Error('Firestore를 사용할 수 없습니다.'));
            return database.collection('members').doc(docId).update({
                status: 'withdrawn',
                withdrawnAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    var mypageApi = {
        getMypageDb: getMypageDb,
        getLoginUser: getLoginUser,
        getCurrentMemberId: getCurrentMemberId,
        getCurrentMember: getCurrentMember,
        getMyOrders: getMyOrders,
        getMyLotteryResults: getMyLotteryResults,
        getBoardPosts: getBoardPosts,
        updateMember: updateMember,
        withdrawMember: withdrawMember
    };

    if (global.window) {
        global.window.mypageApi = mypageApi;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = mypageApi;
    }
})(typeof window !== 'undefined' ? window : this);





