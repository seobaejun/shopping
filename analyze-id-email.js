// 아이디와 이메일 관계 분석
const fs = require('fs');

function analyzeIdEmailRelation() {
    try {
        // 유저 정보 파일 읽기
        const data = fs.readFileSync('c:\\10-2\\shopping\\유저 정보 (9).txt', 'utf8');
        const lines = data.split('\n').filter(line => line.trim());
        
        console.log('📊 아이디와 이메일 관계 분석\n');
        
        const analysis = [];
        let matchCount = 0;
        let noEmailCount = 0;
        let differentCount = 0;
        
        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i];
            const parts = line.split('|').map(p => p.trim());
            
            if (parts.length > 7) {
                const userId = parts[2]; // 아이디
                const email = parts[7];  // 이메일
                
                if (!email || email === '') {
                    noEmailCount++;
                    analysis.push({
                        userId,
                        email: '없음',
                        relation: '이메일 없음'
                    });
                } else {
                    const emailPrefix = email.split('@')[0];
                    if (userId === emailPrefix) {
                        matchCount++;
                        analysis.push({
                            userId,
                            email,
                            relation: '일치'
                        });
                    } else {
                        differentCount++;
                        analysis.push({
                            userId,
                            email,
                            relation: '다름'
                        });
                    }
                }
            }
        }
        
        console.log('📋 샘플 분석 결과 (처음 20명):');
        analysis.forEach((item, index) => {
            console.log(`${index + 1}. 아이디: ${item.userId} | 이메일: ${item.email} | 관계: ${item.relation}`);
        });
        
        console.log('\n📊 통계:');
        console.log(`✅ 아이디 = 이메일 앞부분: ${matchCount}명`);
        console.log(`❌ 아이디 ≠ 이메일 앞부분: ${differentCount}명`);
        console.log(`⚠️  이메일 없음: ${noEmailCount}명`);
        
        console.log('\n🎯 결론:');
        if (matchCount > differentCount) {
            console.log('대부분의 사용자가 아이디 = 이메일 앞부분 패턴을 따릅니다.');
        } else if (differentCount > matchCount) {
            console.log('⚠️ 많은 사용자가 아이디와 이메일 앞부분이 다릅니다!');
            console.log('임시 비밀번호 안내를 수정해야 합니다.');
        } else {
            console.log('아이디와 이메일 관계가 혼재되어 있습니다.');
        }
        
    } catch (error) {
        console.error('분석 실패:', error);
    }
}

analyzeIdEmailRelation();