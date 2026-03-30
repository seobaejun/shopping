// 아까 106명 성공했던 방식 그대로
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');
const XLSX = require('xlsx');

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
    authDomain: "shopping-31dce.firebaseapp.com",
    projectId: "shopping-31dce",
    storageBucket: "shopping-31dce.firebasestorage.app",
    messagingSenderId: "344605730776",
    appId: "1:344605730776:web:925f9d6206b1ff2e0374ad",
    measurementId: "G-B7V6HK8Z7X"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateTempPassword(userId, phone) {
    const phoneDigits = (phone || '').replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4) || '0000';
    return `${userId}${last4}`;
}

async function checkExistingUser(userId, email) {
    try {
        // userId로 확인
        if (userId) {
            const userQuery = await getDocs(query(collection(db, 'members'), where('userId', '==', userId)));
            if (!userQuery.empty) {
                return true;
            }
        }
        
        // email로 확인
        if (email) {
            const emailQuery = await getDocs(query(collection(db, 'members'), where('email', '==', email)));
            if (!emailQuery.empty) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log(`기존 회원 확인 오류 (${userId}):`, error.message);
        return true; // 오류 시 안전하게 스킵
    }
}

async function migrateUser(userData) {
    const { userId, email, name, phone, address, detailAddress, postcode, referralCode, joinDate, accountNumber } = userData;

    try {
        // 기존 회원 확인
        const exists = await checkExistingUser(userId, email);
        if (exists) {
            console.log(`⏭️  기존 회원 스킵: ${userId} (${email || 'no-email'})`);
            return { success: true, skipped: true };
        }

        // 임시 비밀번호 생성
        const tempPassword = generateTempPassword(userId, phone);

        // Firestore 문서 생성
        const memberData = {
            userId: userId,
            email: email || '',
            name: name || '',
            userName: name || '',
            phone: phone || '',
            postcode: postcode || '',
            address: address || '',
            detailAddress: detailAddress || '',
            referralCode: referralCode || '',
            recommender: referralCode || '관리자',
            mdCode: '',
            accountNumber: accountNumber || '',
            status: '정상',
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            purchaseAmount: 0,
            supportAmount: 0,
            tempPassword: tempPassword
        };

        const docRef = await addDoc(collection(db, 'members'), memberData);
        console.log(`✅ 회원 생성 성공: ${userId} -> ${docRef.id}`);

        return { success: true };

    } catch (error) {
        console.log(`❌ 사용자 생성 실패 (${userId}): ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function migrateUsers() {
    try {
        console.log('📊 엑셀 파일 읽는 중...');
        
        // 엑셀 파일 읽기
        const workbook = XLSX.readFile('./회원정보.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📋 총 ${data.length}개 회원 데이터 로드됨`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        // 배치 처리 (10개씩)
        const batchSize = 10;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} 처리 중...`);

            // 배치 내 순차 처리
            for (const row of batch) {
                // 엑셀 데이터 매핑
                const userData = {
                    userId: row.UserID || row['UserID'] || '',
                    email: row.Email || row['Email'] || '',
                    name: row.Name || row['Name'] || '',
                    phone: row.Phone1 || row.Phone2 || row['Phone1'] || row['Phone2'] || '',
                    address: row.Address || row['Address'] || '',
                    detailAddress: row.DetailAddress || row['DetailAddress'] || '',
                    postcode: row.PostCode1 || row['PostCode1'] || '',
                    referralCode: row.ReferralCode || row['ReferralCode'] || '',
                    joinDate: row.JoinDate || row['JoinDate'] || '',
                    accountNumber: row.AccountNumber || row['AccountNumber'] || ''
                };

                // 필수 필드 확인
                if (!userData.userId || userData.userId.trim() === '') {
                    console.log(`⚠️  UserID 없음, 스킵: ${JSON.stringify(userData)}`);
                    skipCount++;
                    continue;
                }

                const result = await migrateUser(userData);

                if (result.success) {
                    if (result.skipped) {
                        skipCount++;
                    } else {
                        successCount++;
                    }
                } else {
                    errorCount++;
                }

                // API 제한 방지
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // 배치 간 잠시 대기
            if (i + batchSize < data.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n🎉 마이그레이션 완료!`);
        console.log(`✅ 성공: ${successCount}명`);
        console.log(`⏭️  스킵: ${skipCount}명`);
        console.log(`❌ 실패: ${errorCount}명`);
        console.log(`📊 총 처리: ${successCount + skipCount + errorCount}명`);

    } catch (error) {
        console.log(`💥 마이그레이션 전체 실패: ${error.message}`);
        console.error(error);
    }
}

// 실행
migrateUsers().then(() => {
    console.log('마이그레이션 프로세스 종료');
    process.exit(0);
}).catch(error => {
    console.log(`치명적 오류: ${error.message}`);
    process.exit(1);
});