/**
 * 상품 이미지가 개인 서버에 있을 때 사용.
 * - HTTPS(배포): /item/... 으로 요청 → Vercel이 1.228.243.28으로 프록시 (Mixed Content 방지)
 * - HTTP(로컬): http://1.228.243.28/item/... 직접 요청
 */
window.IMAGE_BASE_URL = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:')
    ? '/item'
    : 'http://1.228.243.28/item';

/**
 * 상품 이미지 URL을 표시용 절대 URL로 변환
 * @param {string} url - DB/엑셀에 저장된 경로 (data/editor//product/xxx.png 또는 상대 /product/... 또는 전체 URL)
 * @returns {string} 브라우저에서 요청할 수 있는 URL
 */
window.resolveProductImageUrl = function (url) {
    if (url == null || typeof url !== 'string') return '';
    var v = url.trim();
    if (!v) return '';
    if (/^data:/.test(v)) return v;
    if (/^https?:\/\//i.test(v)) {
        if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && /^http:\/\/1\.228\.243\.28\/item\//i.test(v)) {
            return v.replace(/^http:\/\/1\.228\.243\.28\/item\/?/i, '/item/');
        }
        return v;
    }
    var base = window.IMAGE_BASE_URL;
    if (base && typeof base === 'string' && base.trim()) {
        var match = v.match(/product\/([^/]+)$/);
        if (match) {
            return base.replace(/\/$/, '') + '/' + match[1];
        }
        if (v.charAt(0) === '/') {
            return base.replace(/\/$/, '') + v;
        }
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
