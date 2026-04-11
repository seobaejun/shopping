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
     * 내 토큰 입금 내역 조회 (tokenDeposits 컬렉션에서 본인 것만)
     * @returns {Promise<Array>} { amount, status, createdAt }[]
     */
    function getMyTokenDeposits() {
        return getCurrentMemberId().then(function (ids) {
            if (!ids || !ids.userId) return [];
            return getMypageDb().then(function (database) {
                if (!database) return [];
                return database.collection('tokenDeposits')
                    .where('userId', '==', ids.userId)
                    .get()
                    .then(function (snap) {
                        var list = [];
                        snap.docs.forEach(function (d) {
                            var data = d.data();
                            list.push({ 
                                id: d.id, 
                                amount: data.amount || 0,
                                status: data.status || 'pending',
                                createdAt: data.createdAt,
                                date: data.date
                            });
                        });
                        list.sort(function (a, b) {
                            var at = (a.createdAt && a.createdAt.toDate) ? a.createdAt.toDate() : new Date(a.date || 0);
                            var bt = (b.createdAt && b.createdAt.toDate) ? b.createdAt.toDate() : new Date(b.date || 0);
                            return bt - at;
                        });
                        return list;
                    })
                    .catch(function () { return []; });
            });
        });
    }

    /**
     * 내 토큰 출금 내역 조회 (tokenWithdrawals 컬렉션에서 본인 것만)
     * @returns {Promise<Array>} { amount, status, createdAt }[]
     */
    function getMyTokenWithdrawals() {
        return getCurrentMemberId().then(function (ids) {
            if (!ids || !ids.userId) return [];
            return getMypageDb().then(function (database) {
                if (!database) return [];
                return database.collection('tokenWithdrawals')
                    .where('userId', '==', ids.userId)
                    .get()
                    .then(function (snap) {
                        var list = [];
                        snap.docs.forEach(function (d) {
                            var data = d.data();
                            list.push({ 
                                id: d.id, 
                                amount: data.quantity || data.amount || 0,
                                status: data.status || 'pending',
                                createdAt: data.createdAt,
                                date: data.date
                            });
                        });
                        list.sort(function (a, b) {
                            var at = (a.createdAt && a.createdAt.toDate) ? a.createdAt.toDate() : new Date(a.date || 0);
                            var bt = (b.createdAt && b.createdAt.toDate) ? b.createdAt.toDate() : new Date(b.date || 0);
                            return bt - at;
                        });
                        return list;
                    })
                    .catch(function () { return []; });
            });
        });
    }

    /**
     * 내 추첨결과 목록 (관리자 추첨 확정 시 저장되는 lotteryConfirmedResults에서 본인 것만 조회)
     * @returns {Promise<Array>} { round, productName, result: 'winner'|'loser', support }[]
     */
    function getMyLotteryResults() {
        return getCurrentMemberId().then(function (ids) {
            if (!ids || !ids.userId) return [];
            return getMypageDb().then(function (database) {
                if (!database) return [];
                return database.collection('lotteryConfirmedResults')
                    .where('userId', '==', ids.userId)
                    .get()
                    .then(function (snap) {
                        var list = [];
                        snap.docs.forEach(function (d) {
                            var data = d.data();
                            list.push({ 
                                id: d.id, 
                                round: data.round, 
                                productName: data.productName, 
                                result: data.result, 
                                support: data.support || data.calculatedSupport || 0, 
                                paymentStatus: data.paymentStatus || 'pending',
                                date: data.date 
                            });
                        });
                        list.sort(function (a, b) {
                            var at = (a.date && typeof a.date === 'string') ? a.date : '';
                            var bt = (b.date && typeof b.date === 'string') ? b.date : '';
                            return bt.localeCompare(at);
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
            if (data.mdCode !== undefined) {
                var code = (data.mdCode || '').trim();
                allowed.mdCode = code;
                allowed.referralCode = code;
                allowed.recommender = code || '관리자';
            }
            allowed.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            return database.collection('members').doc(docId).update(allowed);
        });
    }

    /**
     * Firestore 회원 문서를 탈퇴 상태로 변경
     */
    function applyMemberWithdrawn(database, docId) {
        return database.collection('members').doc(docId).update({
            status: 'withdrawn',
            withdrawnAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * 회원 탈퇴: Firebase Auth 계정 삭제(가능 시) 후 Firestore status=withdrawn
     * - 이메일·비밀번호 Auth 계정이 있으면 로그인 후 user.delete()
     * - Auth에 없으면(구 가입 등) members.password와 입력 비밀번호 일치 시 Firestore만 탈퇴 처리
     * @param {string} docId - members 문서 id
     * @param {string} password - 본인 확인용 비밀번호
     * @returns {Promise<void>}
     */
    function withdrawMember(docId, password) {
        if (!docId) return Promise.reject(new Error('회원 정보를 확인할 수 없습니다.'));
        var pwd = (password != null ? String(password) : '').trim();
        if (!pwd) {
            return Promise.reject(new Error('탈퇴 확인을 위해 비밀번호를 입력해 주세요.'));
        }

        return getMypageDb().then(function (database) {
            if (!database) return Promise.reject(new Error('Firestore를 사용할 수 없습니다.'));
            return database.collection('members').doc(docId).get().then(function (memberSnap) {
                if (!memberSnap.exists) {
                    return Promise.reject(new Error('회원 정보를 찾을 수 없습니다.'));
                }
                var member = memberSnap.data();
                var email = (member.email || '').trim();

                function verifyFirestorePasswordThenWithdraw() {
                    var stored = member.password != null ? String(member.password) : '';
                    if (stored !== pwd) {
                        return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                    }
                    return applyMemberWithdrawn(database, docId);
                }

                if (typeof firebase === 'undefined' || !firebase.auth || !email) {
                    return verifyFirestorePasswordThenWithdraw();
                }

                return firebase.auth().signInWithEmailAndPassword(email, pwd)
                    .then(function (cred) {
                        return cred.user.delete();
                    })
                    .then(function () {
                        return applyMemberWithdrawn(database, docId);
                    })
                    .catch(function (err) {
                        if (err && err.code === 'auth/user-not-found') {
                            return verifyFirestorePasswordThenWithdraw();
                        }
                        if (err && (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')) {
                            return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                        }
                        if (err && err.code === 'auth/too-many-requests') {
                            return Promise.reject(new Error('시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요.'));
                        }
                        if (err && err.code === 'auth/network-request-failed') {
                            return Promise.reject(new Error('네트워크 오류가 발생했습니다.'));
                        }
                        return Promise.reject(err);
                    });
            });
        });
    }

    /**
     * 토큰 입금 신청 (입금완료 버튼) - tokenDeposits 컬렉션에 pending 문서 추가
     * @param {string} memberId - members 문서 id
     * @param {{ quantity: number, amount: number }} data
     * @returns {Promise<string>} 생성된 문서 id
     */
    function createTokenDeposit(memberId, data) {
        if (!memberId || data == null) return Promise.reject(new Error('회원 정보와 입금 정보가 필요합니다.'));
        return getCurrentMember().then(function (member) {
            if (!member || member.id !== memberId) return Promise.reject(new Error('본인만 입금 신청할 수 있습니다.'));
            return getMypageDb().then(function (database) {
                if (!database) return Promise.reject(new Error('Firestore를 사용할 수 없습니다.'));
                var payload = {
                    memberId: memberId,
                    userId: (member.userId || '').toString(),
                    userName: (member.name || '').toString(),
                    quantity: Number(data.quantity) || 0,
                    amount: Number(data.amount) || 0,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // 토큰가져오기 추가 필드 지원
                if (data.type) {
                    payload.type = data.type;
                    // 토큰가져오기인 경우 실제 이메일/아이디 사용
                    payload.userId = (member.email || member.memberId || member.userId || '').toString();
                }
                if (data.fromAddress) payload.fromAddress = data.fromAddress;
                if (data.toAddress) payload.toAddress = data.toAddress;
                return database.collection('tokenDeposits').add(payload).then(function (ref) { return ref.id; });
            });
        });
    }

    /**
     * 토큰 출금 요청 - tokenWithdrawals 컬렉션에 pending 문서 추가
     * @param {string} memberId - members 문서 id
     * @param {{ walletAddress: string, quantity: number }} data
     * @returns {Promise<string>} 생성된 문서 id
     */
    function createTokenWithdrawal(memberId, data) {
        if (!memberId || data == null) return Promise.reject(new Error('회원 정보와 출금 정보가 필요합니다.'));
        return getCurrentMember().then(function (member) {
            if (!member || member.id !== memberId) return Promise.reject(new Error('본인만 출금 요청할 수 있습니다.'));
            return getMypageDb().then(function (database) {
                if (!database) return Promise.reject(new Error('Firestore를 사용할 수 없습니다.'));
                var payload = {
                    memberId: memberId,
                    userId: (member.userId || '').toString(),
                    userName: (member.name || '').toString(),
                    walletAddress: (data.walletAddress || '').toString().trim(),
                    quantity: Number(data.quantity) || 0,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                return database.collection('tokenWithdrawals').add(payload).then(function (ref) { return ref.id; });
            });
        });
    }

    var mypageApi = {
        getMypageDb: getMypageDb,
        getLoginUser: getLoginUser,
        getCurrentMemberId: getCurrentMemberId,
        getCurrentMember: getCurrentMember,
        getMyOrders: getMyOrders,
        getMyTokenDeposits: getMyTokenDeposits,
        getMyTokenWithdrawals: getMyTokenWithdrawals,
        getMyLotteryResults: getMyLotteryResults,
        getBoardPosts: getBoardPosts,
        updateMember: updateMember,
        withdrawMember: withdrawMember,
        createTokenDeposit: createTokenDeposit,
        createTokenWithdrawal: createTokenWithdrawal
    };

    if (global.window) {
        global.window.mypageApi = mypageApi;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = mypageApi;
    }
})(typeof window !== 'undefined' ? window : this);






