// Firebase Admin 초기화 및 Firestore 연동

// Firebase 설정 (환경 변수에서 가져오기 또는 직접 설정)
const firebaseConfig = {
  apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
  authDomain: "shopping-31dce.firebaseapp.com",
  projectId: "shopping-31dce",
  storageBucket: "shopping-31dce.firebasestorage.app",
  messagingSenderId: "344605730776",
  appId: "1:344605730776:web:925f9d6206b1ff2e0374ad",
  measurementId: "G-B7V6HK8Z7X"
};

// Firebase 초기화 (CDN 사용)
let db = null;
let initialized = false;

// Firebase 초기화 함수
async function initFirebase() {
    if (initialized && db) {
        console.log('Firebase 이미 초기화됨');
        return db;
    }
    
    try {
        // Firebase 모듈이 로드되었는지 확인
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK가 로드되지 않았습니다.');
            // 1초 후 다시 시도
            setTimeout(() => {
                if (typeof firebase !== 'undefined') {
                    initFirebase();
                } else {
                    console.error('Firebase SDK 로드 실패. CDN 링크를 확인하세요.');
                }
            }, 1000);
            return null;
        }
        
        console.log('Firebase SDK 로드 확인됨');
        
        // Firebase 앱 초기화
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase 앱 초기화 완료');
        } else {
            console.log('Firebase 앱 이미 초기화됨');
        }
        
        // Firestore 인스턴스 가져오기 (compat 버전)
        db = firebase.firestore();
        
        // Firestore 설정
        // compat 버전에서는 timestampsInSnapshots 설정이 필요 없음
        
        initialized = true;
        console.log('Firebase Firestore 초기화 완료', db);
        
        // 연결 테스트
        try {
            const testRef = db.collection('_test').doc('connection');
            await testRef.set({ test: true, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            console.log('Firestore 연결 테스트 성공');
            await testRef.delete();
        } catch (testError) {
            console.error('Firestore 연결 테스트 실패:', testError);
            console.error('Firestore 보안 규칙을 확인하세요. 개발 중에는 다음 규칙을 사용하세요:');
            console.error('rules_version = "2";');
            console.error('service cloud.firestore {');
            console.error('  match /databases/{database}/documents {');
            console.error('    match /{document=**} {');
            console.error('      allow read, write: if true;');
            console.error('    }');
            console.error('  }');
            console.error('}');
        }
        
        return db;
    } catch (error) {
        console.error('Firebase 초기화 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        return null;
    }
}

// Firestore 컬렉션 참조
const collections = {
    members: () => {
        if (!db) {
            console.error('Firestore DB가 초기화되지 않았습니다.');
            throw new Error('Firestore가 초기화되지 않았습니다. initFirebase()를 먼저 호출하세요.');
        }
        return db.collection('members');
    },
    products: () => {
        if (!db) {
            console.error('Firestore DB가 초기화되지 않았습니다.');
            throw new Error('Firestore가 초기화되지 않았습니다. initFirebase()를 먼저 호출하세요.');
        }
        return db.collection('products');
    },
    orders: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('orders');
    },
    lotteries: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('lotteries');
    },
    settlements: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('settlements');
    },
    deliveries: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('deliveries');
    },
    categories: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('categories');
    },
    admins: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('admins');
    },
    settings: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('settings');
    }
};

// 회원 관리 함수
const memberService = {
    // 회원 목록 가져오기
    async getMembers(filters = {}) {
        try {
            console.log('🔵 getMembers 함수 호출됨, filters:', filters);
            
            // DB 초기화 확인
            if (!db) {
                console.log('DB가 없어서 초기화 시도...');
                await initFirebase();
            }
            
            if (!db) {
                throw new Error('Firestore DB 초기화 실패');
            }
            
            console.log('✅ DB 확인 완료, members 컬렉션 접근 시도...');
            
            // 직접 members 컬렉션에 접근
            const membersRef = db.collection('members');
            console.log('members 컬렉션 참조 생성 완료');
            
            // 필터 적용
            let query = membersRef;
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            
            if (filters.searchTerm) {
                // 검색어로 필터링 (이름, 아이디, 이메일)
                console.log('검색어 필터 적용:', filters.searchTerm);
                const snapshot = await query.get();
                const filtered = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(member => 
                        (member.name || '').includes(filters.searchTerm) ||
                        (member.userId || '').includes(filters.searchTerm) ||
                        (member.email || '').includes(filters.searchTerm)
                    );
                console.log('✅ 검색 결과:', filtered.length, '명');
                return filtered;
            }
            
            // 정렬 없이 먼저 시도 (가장 확실한 방법)
            console.log('members 컬렉션에서 데이터 가져오기 시작...');
            const snapshot = await query.get();
            console.log('✅ Firestore 쿼리 성공, 문서 개수:', snapshot.docs.length);
            
            if (snapshot.empty) {
                console.warn('⚠️ members 컬렉션이 비어있습니다.');
                return [];
            }
            
            const members = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data
                };
            });
            
            console.log('✅ 회원 데이터 변환 완료:', members.length, '명');
            console.log('첫 번째 회원 샘플:', members[0]);
            
            // createdAt이 있으면 클라이언트 측에서 정렬
            if (members.length > 0 && members[0].createdAt) {
                members.sort((a, b) => {
                    const aTime = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0) || 0;
                    const bTime = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0) || 0;
                    return bTime - aTime; // 내림차순
                });
                console.log('✅ createdAt 기준 정렬 완료');
            }
            
            return members;
        } catch (error) {
            console.error('❌ 회원 목록 가져오기 오류:', error);
            console.error('오류 메시지:', error.message);
            console.error('오류 코드:', error.code);
            console.error('오류 스택:', error.stack);
            
            // 에러를 다시 던져서 호출자가 알 수 있도록
            throw error;
        }
    },
    
    // 회원 추가
    async addMember(memberData) {
        try {
            const docRef = await collections.members().add({
                ...memberData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('회원 추가 오류:', error);
            throw error;
        }
    },
    
    // 회원 수정
    async updateMember(memberId, memberData) {
        try {
            await collections.members().doc(memberId).update({
                ...memberData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('회원 수정 오류:', error);
            throw error;
        }
    },
    
    // 회원 삭제
    async deleteMember(memberId) {
        try {
            await collections.members().doc(memberId).delete();
        } catch (error) {
            console.error('회원 삭제 오류:', error);
            throw error;
        }
    }
};

// 상품 관리 함수
const productService = {
    // 상품 목록 가져오기
    async getProducts(filters = {}) {
        try {
            if (!db) {
                console.warn('Firestore가 초기화되지 않아 빈 배열 반환');
                return [];
            }
            
            let query = collections.products();
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            
            // createdAt 필드가 없을 수 있으므로 try-catch로 처리
            try {
                const snapshot = await query.orderBy('createdAt', 'desc').get();
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (orderError) {
                // createdAt으로 정렬 실패 시 그냥 가져오기
                console.warn('createdAt 정렬 실패, 기본 정렬 사용:', orderError);
                const snapshot = await query.get();
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error('상품 목록 가져오기 오류:', error);
            console.error('오류 코드:', error.code);
            console.error('오류 메시지:', error.message);
            return [];
        }
    },
    
    // 상품 추가
    async addProduct(productData) {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            console.log('상품 추가 시도:', productData);
            const productRef = collections.products();
            const docRef = await productRef.add({
                ...productData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('상품 추가 성공, ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('상품 추가 오류:', error);
            console.error('오류 상세:', error.message, error.code);
            throw error;
        }
    },
    
    // 상품 수정
    async updateProduct(productId, productData) {
        try {
            await collections.products().doc(productId).update({
                ...productData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('상품 수정 오류:', error);
            throw error;
        }
    },
    
    // 상품 삭제
    async deleteProduct(productId) {
        try {
            await collections.products().doc(productId).delete();
        } catch (error) {
            console.error('상품 삭제 오류:', error);
            throw error;
        }
    }
};

// 주문 관리 함수
const orderService = {
    // 주문 목록 가져오기 (status 사용 시 복합 인덱스 없이 동작하도록 정렬은 메모리에서)
    async getOrders(filters = {}) {
        try {
            let query = collections.orders();
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.memberId) {
                query = query.where('memberId', '==', filters.memberId);
            }
            const snapshot = await query.get();
            let list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const byCreated = (a, b) => {
                const at = a.createdAt && (a.createdAt.seconds != null ? a.createdAt.seconds : (a.createdAt.toDate ? a.createdAt.toDate().getTime() / 1000 : 0));
                const bt = b.createdAt && (b.createdAt.seconds != null ? b.createdAt.seconds : (b.createdAt.toDate ? b.createdAt.toDate().getTime() / 1000 : 0));
                return (bt || 0) - (at || 0);
            };
            list.sort(byCreated);
            return list;
        } catch (error) {
            console.error('주문 목록 가져오기 오류:', error);
            return [];
        }
    },
    
    // 주문 추가
    async addOrder(orderData) {
        try {
            const docRef = await collections.orders().add({
                ...orderData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('주문 추가 오류:', error);
            throw error;
        }
    },
    
    // 주문 수정
    async updateOrder(orderId, orderData) {
        try {
            await collections.orders().doc(orderId).update({
                ...orderData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('주문 수정 오류:', error);
            throw error;
        }
    }
};

// 추첨 관리 함수
const lotteryService = {
    // 추첨 목록 가져오기
    async getLotteries(filters = {}) {
        try {
            let query = collections.lotteries();
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.round) {
                query = query.where('round', '==', filters.round);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('추첨 목록 가져오기 오류:', error);
            return [];
        }
    },
    
    // 추첨 추가
    async addLottery(lotteryData) {
        try {
            const docRef = await collections.lotteries().add({
                ...lotteryData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('추첨 추가 오류:', error);
            throw error;
        }
    },
    
    // 추첨 수정
    async updateLottery(lotteryId, lotteryData) {
        try {
            await collections.lotteries().doc(lotteryId).update({
                ...lotteryData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('추첨 수정 오류:', error);
            throw error;
        }
    }
};

// 설정 관리 함수
const settingsService = {
    // 설정 가져오기
    async getSettings() {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            const settingsDoc = await collections.settings().doc('main').get();
            if (settingsDoc.exists) {
                return settingsDoc.data();
            }
            return null;
        } catch (error) {
            console.error('설정 가져오기 오류:', error);
            return null;
        }
    },
    
    // 설정 저장
    async saveSettings(settingsData) {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            await collections.settings().doc('main').set({
                ...settingsData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('설정 저장 완료');
            return true;
        } catch (error) {
            console.error('설정 저장 오류:', error);
            throw error;
        }
    }
};

// 페이지 로드 시 Firebase 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}

// 전역으로 export
window.firebaseAdmin = {
    initFirebase,
    db,
    memberService,
    productService,
    orderService,
    lotteryService,
    settingsService
};

