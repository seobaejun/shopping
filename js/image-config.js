/**
 * 상품 이미지가 개인 서버에 있을 때 사용.
 * 이미지 경로가 /product/... 형태면 이 주소를 앞에 붙여서 요청합니다.
 * 예: IMAGE_BASE_URL = 'https://내서버.com' 이면
 *     /product/product_xxx_main_img.jpg → https://내서버.com/product/product_xxx_main_img.jpg
 */
// 개인 서버 주소만 넣으세요 (끝에 슬래시 없이). 비우면 현재 사이트에서 이미지 요청
window.IMAGE_BASE_URL = ''; // 예: 'https://이미지서버주소.com'

/**
 * 상품 이미지 URL을 표시용 절대 URL로 변환
 * @param {string} url - DB/엑셀에 저장된 경로 (상대 /product/... 또는 전체 URL)
 * @returns {string} 브라우저에서 요청할 수 있는 URL
 */
window.resolveProductImageUrl = function (url) {
    if (url == null || typeof url !== 'string') return '';
    var v = url.trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^data:/.test(v)) return v;
    var base = window.IMAGE_BASE_URL;
    if (base && typeof base === 'string' && base.trim() && v.charAt(0) === '/') {
        return base.replace(/\/$/, '') + v;
    }
    if (typeof window !== 'undefined' && window.location) {
        var origin = window.location.origin || '';
        var pathname = window.location.pathname || '';
        var basePath = pathname.indexOf('/admin') !== -1 ? pathname.split('/admin')[0] : pathname.replace(/\/[^/]*$/, '') || '';
        if (!basePath && pathname.indexOf('/') !== -1) basePath = pathname.split('/').slice(0, -1).join('/');
        var prefix = basePath.slice(-1) === '/' ? basePath : basePath + '/';
        return origin + (v.charAt(0) === '/' ? prefix + v.slice(1) : prefix + v);
    }
    return v.charAt(0) === '/' ? v : '/' + v;
};
