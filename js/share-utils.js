// SNS 공유 유틸리티 함수

// 페이스북 공유
function shareToFacebook(url) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// 인스타그램 공유 (웹 공유)
function shareToInstagram(url) {
    // 인스타그램은 웹에서 직접 공유 API가 없으므로 인스타그램 홈으로 이동
    // 사용자가 직접 게시물 작성하도록 유도
    window.open('https://www.instagram.com/', '_blank');
    // 동시에 링크 복사
    copyToClipboard(url);
    alert('링크가 복사되었습니다!\n인스타그램에서 게시물을 작성하고 링크를 붙여넣어주세요.');
}

// 링크 복사
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('✅ 링크 복사 완료');
        }).catch(err => {
            console.error('❌ 링크 복사 실패:', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// 링크 복사 fallback
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('✅ 링크 복사 완료 (fallback)');
    } catch (err) {
        console.error('❌ 링크 복사 실패 (fallback):', err);
    }
    
    document.body.removeChild(textArea);
}

// 공유 모달 표시
function showShareModal(productId, productName, productImage) {
    const currentUrl = window.location.origin + window.location.pathname;
    const shareUrl = productId ? `${currentUrl}?id=${productId}` : currentUrl;
    
    // 이미지 URL이 Base64인 경우 기본 이미지로 대체
    let shareImage = productImage;
    if (productImage && productImage.startsWith('data:image')) {
        shareImage = window.location.origin + '/images/logo.png'; // 기본 이미지
    }
    
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-overlay"></div>
        <div class="share-modal-content">
            <div class="share-modal-header">
                <h3>공유하기</h3>
                <button class="share-modal-close">&times;</button>
            </div>
            <div class="share-modal-body">
                <button class="share-option" data-type="facebook">
                    <i class="fab fa-facebook-f"></i>
                    <span>페이스북</span>
                </button>
                <button class="share-option" data-type="instagram">
                    <i class="fab fa-instagram"></i>
                    <span>인스타그램</span>
                </button>
                <button class="share-option" data-type="link">
                    <i class="fas fa-link"></i>
                    <span>링크복사</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 스타일 추가 (한 번만)
    if (!document.getElementById('share-modal-style')) {
        const style = document.createElement('style');
        style.id = 'share-modal-style';
        style.textContent = `
            .share-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .share-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
            }
            .share-modal-content {
                position: relative;
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            .share-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .share-modal-header h3 {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }
            .share-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .share-modal-close:hover {
                color: #333;
            }
            .share-modal-body {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
            }
            .share-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            .share-option:hover {
                background: #f5f5f5;
                border-color: #ffc107;
                transform: translateY(-2px);
            }
            .share-option i {
                font-size: 24px;
                color: #333;
            }
            .share-option span {
                font-size: 12px;
                color: #666;
            }
            .share-option[data-type="facebook"] i {
                color: #1877F2;
            }
            .share-option[data-type="instagram"] i {
                color: #E4405F;
            }
            .share-option[data-type="link"] i {
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 닫기 버튼
    const closeBtn = modal.querySelector('.share-modal-close');
    const overlay = modal.querySelector('.share-modal-overlay');
    
    const closeModal = () => {
        modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // 공유 옵션 클릭
    const shareOptions = modal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', () => {
            const type = option.dataset.type;
            
            switch(type) {
                case 'facebook':
                    shareToFacebook(shareUrl);
                    break;
                case 'instagram':
                    shareToInstagram(shareUrl);
                    break;
                case 'link':
                    copyToClipboard(shareUrl);
                    alert('링크가 복사되었습니다!');
                    break;
            }
            
            closeModal();
        });
    });
}

// 전역으로 노출
window.shareToFacebook = shareToFacebook;
window.shareToInstagram = shareToInstagram;
window.copyToClipboard = copyToClipboard;
window.showShareModal = showShareModal;

