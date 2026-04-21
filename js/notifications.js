/**
 * 알림 시스템
 * - 주문 상태 변경 알림
 * - 문의 답변 알림
 * - 공지사항 알림
 */

(function() {
    'use strict';

    let db = null;
    let notificationListener = null;
    let unreadCount = 0;

    // 알림 타입
    const NOTIFICATION_TYPES = {
        ORDER_APPROVED: 'order_approved',
    ORDER_CANCELLED: 'order_cancelled',      // 주문 승인
        ORDER_SHIPPED: 'order_shipped',        // 배송 시작
        ORDER_DELIVERED: 'order_delivered',    // 배송 완료
        INQUIRY_ANSWERED: 'inquiry_answered',  // 1:1문의 답변
        PRODUCT_INQUIRY_ANSWERED: 'product_inquiry_answered', // 상품문의 답변
        NOTICE: 'notice',                      // 공지사항
        SUPPORT_PAID: 'support_paid'           // 쇼핑지원금 지급
    };

    // 알림 타입별 제목 템플릿
    const NOTIFICATION_TITLES = {
        [NOTIFICATION_TYPES.ORDER_APPROVED]: '구매요청이 승인되었습니다',
        [NOTIFICATION_TYPES.ORDER_CANCELLED]: '구매 취소 완료',
        [NOTIFICATION_TYPES.ORDER_SHIPPED]: '배송이 시작되었습니다',
        [NOTIFICATION_TYPES.ORDER_DELIVERED]: '배송이 완료되었습니다',
        [NOTIFICATION_TYPES.INQUIRY_ANSWERED]: '1:1문의에 답변이 등록되었습니다',
        [NOTIFICATION_TYPES.PRODUCT_INQUIRY_ANSWERED]: '상품문의에 답변이 등록되었습니다',
        [NOTIFICATION_TYPES.NOTICE]: '새로운 공지사항이 등록되었습니다',
        [NOTIFICATION_TYPES.SUPPORT_PAID]: '쇼핑지원금이 지급되었습니다'
    };

    /**
     * Firebase 초기화
     */
    function initFirebase() {
        return new Promise(function(resolve) {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('알림: Firebase SDK 대기 중...');
                setTimeout(function() { initFirebase().then(resolve); }, 300);
                return;
            }
            try {
                var config = window.firebaseConfig || {
                    apiKey: 'AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg',
                    authDomain: 'shopping-31dce.firebaseapp.com',
                    projectId: 'shopping-31dce',
                    storageBucket: 'shopping-31dce.firebasestorage.app',
                    messagingSenderId: '344605730776',
                    appId: '1:344605730776:web:925f9d6206b1ff2e0374ad',
                    measurementId: 'G-B7V6HK8Z7X'
                };
                if (!firebase.apps.length) {
                    firebase.initializeApp(config);
                }
                db = firebase.firestore();
                console.log('✅ 알림: Firebase 초기화 완료');
                resolve(db);
            } catch (e) {
                console.error('❌ 알림: Firebase 초기화 오류', e);
                resolve(null);
            }
        });
    }

    /**
     * 현재 로그인한 사용자 정보 가져오기
     */
    function getCurrentUser() {
        try {
            var loginUser = localStorage.getItem('loginUser');
            if (loginUser) {
                return JSON.parse(loginUser);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    async function resolveNotificationUserKeys(userId) {
        var userKeys = [];
        function addKey(value) {
            var key = (value || '').toString().trim();
            if (!key) return;
            if (userKeys.indexOf(key) === -1) userKeys.push(key);
        }

        addKey(userId);
        try {
            if (firebase && firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid) {
                addKey(firebase.auth().currentUser.uid);
            }
        } catch (e) {}

        try {
            if (db && userId) {
                var memberSnapshot = await db.collection('members').where('userId', '==', userId).limit(1).get();
                if (!memberSnapshot.empty) addKey(memberSnapshot.docs[0].id);
            }
        } catch (e) {}

        return userKeys;
    }

    /**
     * 알림 생성 (관리자 페이지에서 호출)
     */
    async function createNotification(userId, type, title, message, link, metadata) {
        if (!db) {
            await initFirebase();
        }
        if (!db) {
            console.error('❌ 알림 생성 실패: Firebase 초기화 실패');
            return;
        }

        try {
            var notificationData = {
                userId: userId,
                type: type,
                title: title || NOTIFICATION_TITLES[type] || '알림',
                message: message || '',
                link: link || '',
                read: false,
                metadata: metadata || {},
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('notifications').add(notificationData);
            console.log('✅ 알림 생성 완료:', userId, type);
        } catch (error) {
            console.error('❌ 알림 생성 오류:', error);
        }
    }

    /**
     * 읽지 않은 알림 개수 가져오기
     */
    async function getUnreadCount(userId) {
        if (!db) {
            await initFirebase();
        }
        if (!db || !userId) return 0;

        try {
            var userKeys = await resolveNotificationUserKeys(userId);
            if (!userKeys.length) return 0;
            var uniqueUnread = {};
            for (var i = 0; i < userKeys.length; i++) {
                var snapshot = await db.collection('notifications')
                    .where('userId', '==', userKeys[i])
                    .where('read', '==', false)
                    .get();
                snapshot.forEach(function(doc) {
                    uniqueUnread[doc.id] = true;
                });
            }
            return Object.keys(uniqueUnread).length;
        } catch (error) {
            console.error('❌ 읽지 않은 알림 개수 조회 오류:', error);
            return 0;
        }
    }

    /**
     * 알림 목록 가져오기
     */
    async function getNotifications(userId, limit) {
        if (!db) {
            await initFirebase();
        }
        if (!db || !userId) return [];

        try {
            var userKeys = await resolveNotificationUserKeys(userId);
            if (!userKeys.length) return [];

            var mergedMap = {};
            for (var i = 0; i < userKeys.length; i++) {
                var query = db.collection('notifications').where('userId', '==', userKeys[i]);
                if (limit) query = query.limit(limit);
                var snapshot = await query.get();
                snapshot.forEach(function(doc) {
                    var data = doc.data();
                    mergedMap[doc.id] = {
                        id: doc.id,
                        createdAt: data.createdAt,
                        read: data.read,
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        link: data.link,
                        userId: data.userId
                    };
                });
            }
            var notifications = Object.keys(mergedMap).map(function(id) { return mergedMap[id]; });
            notifications.sort(function(a, b) {
                var at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                var bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                return bt - at;
            });
            if (limit && notifications.length > limit) notifications = notifications.slice(0, limit);
            return notifications;
        } catch (error) {
            console.error('❌ 알림 목록 조회 오류:', error);
            return [];
        }
    }

    /**
     * 알림 읽음 처리
     */
    async function markAsRead(notificationId) {
        if (!db) {
            await initFirebase();
        }
        if (!db || !notificationId) return;

        try {
            await db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('❌ 알림 읽음 처리 오류:', error);
        }
    }

    /**
     * 모든 알림 읽음 처리
     */
    async function markAllAsRead(userId) {
        if (!db) {
            await initFirebase();
        }
        if (!db || !userId) return;

        try {
            var batch = db.batch();
            var userKeys = await resolveNotificationUserKeys(userId);
            for (var i = 0; i < userKeys.length; i++) {
                var snapshot = await db.collection('notifications')
                    .where('userId', '==', userKeys[i])
                    .where('read', '==', false)
                    .get();
                snapshot.forEach(function(doc) {
                    batch.update(doc.ref, {
                        read: true,
                        readAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            }
            
            await batch.commit();
            console.log('✅ 모든 알림 읽음 처리 완료');
        } catch (error) {
            console.error('❌ 모든 알림 읽음 처리 오류:', error);
        }
    }

    /**
     * 브라우저 알림 권한 요청
     */
    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('이 브라우저는 알림을 지원하지 않습니다.');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            var permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * 브라우저 알림 표시
     */
    function showBrowserNotification(title, options) {
        if (!('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'granted') {
            var notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });

            notification.onclick = function() {
                window.focus();
                if (options && options.link) {
                    window.location.href = options.link;
                }
                notification.close();
            };

            // 5초 후 자동 닫기
            setTimeout(function() {
                notification.close();
            }, 5000);
        }
    }

    /**
     * 알림 배지 업데이트
     */
    function updateNotificationBadge(count) {
        var badge = document.getElementById('notificationBadge');
        var countEl = document.getElementById('notificationCount');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
        
        if (countEl) {
            countEl.textContent = count;
        }
        
        unreadCount = count;
    }

    /**
     * 실시간 알림 리스너 시작
     */
    async function startNotificationListener(userId) {
        if (!db || !userId) return;

        // 기존 리스너 제거
        if (notificationListener) {
            notificationListener();
        }

        getUnreadCount(userId).then(function(count) {
            updateNotificationBadge(count);
        });

        var userKeys = await resolveNotificationUserKeys(userId);
        if (!userKeys.length) return;
        var unsubscribeList = [];
        for (var i = 0; i < userKeys.length; i++) {
            (function(userKey) {
                var unsubscribe = db.collection('notifications')
                    .where('userId', '==', userKey)
                    .onSnapshot(function(snapshot) {
                        snapshot.docChanges().forEach(function(change) {
                            if (change.type !== 'added') return;
                            var notification = change.doc.data();
                            if (notification.read === true) return;

                            getUnreadCount(userId).then(function(count) {
                                updateNotificationBadge(count);
                            });

                            requestNotificationPermission().then(function(hasPermission) {
                                if (hasPermission) {
                                    showBrowserNotification(notification.title || '알림', {
                                        body: notification.message || '',
                                        link: notification.link || ''
                                    });
                                }
                            });
                        });
                    }, function(error) {
                        console.error('❌ 알림 리스너 오류:', error);
                    });
                unsubscribeList.push(unsubscribe);
            })(userKeys[i]);
        }
        notificationListener = function() {
            unsubscribeList.forEach(function(unsubscribe) {
                if (typeof unsubscribe === 'function') unsubscribe();
            });
        };
    }

    /**
     * 알림 리스너 중지
     */
    function stopNotificationListener() {
        if (notificationListener) {
            notificationListener();
            notificationListener = null;
        }
    }

    /**
     * 초기화
     */
    async function init() {
        console.log('🔵 알림 시스템 초기화 시작');
        
        await initFirebase();
        
        var user = getCurrentUser();
        if (user && user.userId) {
            // 브라우저 알림 권한 요청
            await requestNotificationPermission();
            
            // 실시간 알림 리스너 시작
            startNotificationListener(user.userId);
        }
    }

    // 전역으로 노출
    window.notificationService = {
        createNotification: createNotification,
        getUnreadCount: getUnreadCount,
        getNotifications: getNotifications,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        updateNotificationBadge: updateNotificationBadge,
        startNotificationListener: startNotificationListener,
        stopNotificationListener: stopNotificationListener,
        NOTIFICATION_TYPES: NOTIFICATION_TYPES,
        init: init
    };

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

