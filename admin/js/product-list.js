// admin/js/product-list.js
// 버전: 2026-02-06-20:00

let currentProductPage = 1;
const productsPerPage = 15;
let allProductsData = []; // 모든 상품 데이터
let searchResultsData = []; // 검색 결과 데이터
let _productListCategoryMap = {}; // 카테고리 ID → 이름 (Firestore 기준)
/** 전체 페이지 선택 시 사용. 페이지를 넘겨도 선택 유지 */
let selectedProductIds = new Set();

/** 수정 모달에서 선택된 category id에 해당하는 1차/2차/3차 id 경로 반환 [id1, id2, id3] */
function getEditModalCategoryPath(categories, categoryId) {
    if (!categoryId || !Array.isArray(categories)) return ['', '', ''];
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return ['', '', ''];
    if (cat.level === 1) return [cat.id, '', ''];
    if (cat.level === 2) return [cat.parentId || '', cat.id, ''];
    if (cat.level === 3) {
        const parent = categories.find(c => c.id === cat.parentId);
        return [parent ? (parent.parentId || '') : '', cat.parentId || '', cat.id];
    }
    return ['', '', ''];
}

// Firebase 초기화 대기 함수
async function waitForFirebaseAdmin(maxWait = 10000) {
    const startTime = Date.now();
    while (!window.firebaseAdmin) {
        if (Date.now() - startTime > maxWait) {
            throw new Error('Firebase Admin 초기화 시간 초과');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return window.firebaseAdmin;
}

// 모든 상품 로드 함수
async function loadAllProducts() {
    console.log('🔵🔵🔵 loadAllProducts 함수 호출됨');
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('✅ 상품목록: Firebase Admin 초기화 완료');

        const products = await firebaseAdmin.productService.getProducts();
        allProductsData = products;
        window.allProductsData = allProductsData;

        console.log('✅ 상품목록: Firestore에서 데이터 가져오기 완료:', products.length, '개');

        // 카테고리 맵만 업데이트 (카테고리 select는 이미 loadPageData에서 로드됨)
        // 카테고리 select를 다시 로드하지 않도록 주의
        try {
            const firebaseAdmin = await waitForFirebaseAdmin();
            const db = firebaseAdmin.db || firebase.firestore();
            const snapshot = await db.collection('categories')
                .orderBy('sortOrder', 'asc')
                .get();
            
            _productListCategoryMap = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                const displayName = (data.name != null && String(data.name).trim() !== '')
                    ? String(data.name).trim()
                    : ((data.categoryName != null && String(data.categoryName).trim() !== '')
                        ? String(data.categoryName).trim()
                        : ((data.title != null && String(data.title).trim() !== '')
                            ? String(data.title).trim()
                            : doc.id));
                _productListCategoryMap[doc.id] = displayName;
            });
            console.log('✅ 카테고리 맵 업데이트 완료:', Object.keys(_productListCategoryMap).length, '개');
        } catch (error) {
            console.warn('카테고리 맵 업데이트 실패:', error);
        }

        document.getElementById('totalProductCount').textContent = products.length;
        
        // 상품이 없으면 안내 메시지 표시
        if (products.length === 0) {
            selectedProductIds.clear();
            const tbody = document.getElementById('productListBody');
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">등록된 상품이 없습니다.<br><a href="#" onclick="document.querySelector(\'[data-page=product-register]\').click(); return false;" class="btn btn-primary" style="margin-top:10px;display:inline-block;">상품 등록</a></td></tr>';
            renderProductListPagination(0);
            const bulkBtn = document.getElementById('productListBulkDeleteBtn');
            if (bulkBtn) bulkBtn.style.display = 'none';
        } else {
            currentProductPage = 1;
            updateProductListPage();
        }

    } catch (error) {
        console.error('❌ 상품목록: 데이터 로드 오류:', error);
        alert('상품 목록 로드 중 오류가 발생했습니다: ' + error.message);
    }
}

// 상품 검색 함수
async function searchProducts() {
    console.log('🔵🔵🔵 searchProducts 함수 호출됨');
    const searchName = document.getElementById('productSearchName')?.value.trim().toLowerCase() || '';
    const searchCategory = document.getElementById('productSearchCategory')?.value || '';
    const searchStatus = document.getElementById('productSearchStatus')?.value || '';

    searchResultsData = allProductsData.filter(product => {
        const productName = product.name?.toLowerCase() || '';
        const productCategory = product.category || '';
        const productStatus = product.status || '';

        const nameMatch = !searchName || productName.includes(searchName);
        const categoryMatch = !searchCategory || productCategory === searchCategory;
        const statusMatch = !searchStatus || productStatus === searchStatus;

        return nameMatch && categoryMatch && statusMatch;
    });

    document.getElementById('searchProductCount').textContent = searchResultsData.length;
    renderSearchResultsTable(searchResultsData);
}

// 전체 상품 목록 페이지 갱신 (현재 페이지 기준 슬라이스 렌더 + 페이징)
function updateProductListPage() {
    const total = allProductsData.length;
    const start = (currentProductPage - 1) * productsPerPage;
    const slice = allProductsData.slice(start, start + productsPerPage);
    renderAllProductsTable(slice, start);
    renderProductListPagination(total);
}

// 페이지 이동
function goToProductPage(pageNum) {
    const totalPages = Math.max(1, Math.ceil(allProductsData.length / productsPerPage));
    if (pageNum < 1 || pageNum > totalPages) return;
    currentProductPage = pageNum;
    updateProductListPage();
}

const MAX_PAGINATION_BUTTONS = 9;

// 페이징 UI 렌더 (항상 표시, 페이지 많을 때 축약)
function renderProductListPagination(totalItems) {
    const container = document.getElementById('productListPagination');
    if (!container) return;
    container.style.display = 'flex';
    const totalPages = Math.max(1, Math.ceil(totalItems / productsPerPage));
    let html = '';
    html += `<button type="button" class="product-list-page-btn" ${currentProductPage <= 1 ? 'disabled' : `onclick="goToProductPage(1)"`} title="처음">&lt;&lt;</button>`;
    html += `<button type="button" class="product-list-page-btn" ${currentProductPage <= 1 ? 'disabled' : `onclick="goToProductPage(${currentProductPage - 1})"`} title="이전">&lt;</button>`;
    const half = Math.floor(MAX_PAGINATION_BUTTONS / 2);
    let start = Math.max(1, currentProductPage - half);
    let end = Math.min(totalPages, start + MAX_PAGINATION_BUTTONS - 1);
    if (end - start + 1 < MAX_PAGINATION_BUTTONS) start = Math.max(1, end - MAX_PAGINATION_BUTTONS + 1);
    if (start > 1) html += `<button type="button" class="product-list-page-btn" disabled>...</button>`;
    for (let p = start; p <= end; p++) {
        const active = p === currentProductPage;
        html += `<button type="button" class="product-list-page-btn${active ? ' active' : ''}" data-page="${p}" onclick="goToProductPage(${p})">${p}</button>`;
    }
    if (end < totalPages) html += `<button type="button" class="product-list-page-btn" disabled>...</button>`;
    html += `<button type="button" class="product-list-page-btn" ${currentProductPage >= totalPages ? 'disabled' : `onclick="goToProductPage(${currentProductPage + 1})"`} title="다음">&gt;</button>`;
    html += `<button type="button" class="product-list-page-btn" ${currentProductPage >= totalPages ? 'disabled' : `onclick="goToProductPage(${totalPages})"`} title="마지막">&gt;&gt;</button>`;
    container.innerHTML = html || '<button type="button" class="product-list-page-btn active">1</button>';
}

// 검색 초기화 함수
function resetProductSearch() {
    console.log('🔵🔵🔵 resetProductSearch 함수 호출됨');
    document.getElementById('productSearchName').value = '';
    document.getElementById('productSearchCategory').value = '';
    document.getElementById('productSearchStatus').value = '';
    
    // 검색 결과 초기화 (빈 메시지 표시)
    searchResultsData = [];
    document.getElementById('searchProductCount').textContent = '0';
    const tbody = document.getElementById('productSearchResultsBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-message">검색 결과가 여기에 표시됩니다.</td></tr>';
    }
}

// 상품 상태 변경 함수
async function changeProductStatus(productId, newStatus) {
    console.log('🔵 상품 상태 변경:', productId, newStatus);
    
    if (!confirm(`상품 상태를 "${getStatusText(newStatus)}"(으)로 변경하시겠습니까?`)) {
        // 취소 시 원래 상태로 되돌리기
        await loadAllProducts();
        return;
    }

    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        await firebaseAdmin.productService.updateProduct(productId, { status: newStatus });
        
        console.log('✅ 상품 상태 변경 완료');
        
        // 데이터 다시 로드
        await loadAllProducts();
        
        // 검색 결과가 있으면 검색도 다시 수행
        if (searchResultsData.length > 0) {
            await searchProducts();
        }
        
    } catch (error) {
        console.error('❌ 상품 상태 변경 오류:', error);
        alert('상품 상태 변경 중 오류가 발생했습니다: ' + error.message);
        await loadAllProducts();
    }
}

/** 상품 목록 셀용 이미지 HTML (로드 실패 시 플레이스홀더 표시) */
function renderProductListImage(product) {
    const raw = product.mainImageUrl || product.imageUrl || product.image;
    const url = (typeof window.resolveProductImageUrl === 'function' && raw) ? window.resolveProductImageUrl(raw) : raw;
    const placeholder = '<div class="product-thumb-placeholder" style="width:60px;height:60px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:12px;color:#999;">이미지</div>';
    if (!url) return placeholder;
    return '<span class="product-thumb-wrap" style="display:inline-block;width:60px;height:60px;position:relative;">' +
        '<img src="' + escapeHtml(url) + '" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\';var s=this.nextElementSibling;if(s) s.style.display=\'flex\';">' +
        '<div class="product-thumb-placeholder" style="width:60px;height:60px;background:#e0e0e0;display:none;align-items:center;justify-content:center;border-radius:4px;font-size:12px;color:#999;position:absolute;left:0;top:0;">이미지</div>' +
        '</span>';
}

// 검색 결과 테이블 렌더링
function renderSearchResultsTable(products) {
    const tbody = document.getElementById('productSearchResultsBody');
    if (!tbody) {
        console.error('❌ productSearchResultsBody 요소를 찾을 수 없습니다.');
        return;
    }

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-message">검색 결과가 없습니다.</td></tr>';
        return;
    }

    const rows = [];
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const categoryName = getCategoryName(product.category);
        const supportAmount = (product.supportAmount != null && product.supportAmount > 0) ? product.supportAmount : Math.round((product.price || 0) * ((product.supportRate || 5) / 100));

        rows.push(`
            <tr>
                <td>${i + 1}</td>
                <td>
                    ${renderProductListImage(product)}
                </td>
                <td style="text-align: center;">${escapeHtml(product.name)}</td>
                <td>${categoryName}</td>
                <td>${formatPrice(product.price)}원</td>
                <td>${formatPrice(supportAmount)}원</td>
                <td>${product.stock || 0}</td>
                <td>
                    <select class="status-select" onchange="changeProductStatus('${product.id}', this.value)">
                        <option value="sale" ${product.status === 'sale' ? 'selected' : ''}>판매중</option>
                        <option value="soldout" ${product.status === 'soldout' ? 'selected' : ''}>품절</option>
                        <option value="hidden" ${product.status === 'hidden' ? 'selected' : ''}>숨김</option>
                    </select>
                </td>
                <td>${formatDate(product.createdAt)}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="openEditProductModal('${product.id}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    }
    tbody.innerHTML = rows.join('');
}

// 전체 상품 테이블 렌더링 (products: 현재 페이지 상품 배열, startIndex: 번호 시작값)
function renderAllProductsTable(products, startIndex) {
    const tbody = document.getElementById('productListBody');
    if (!tbody) {
        console.error('❌ productListBody 요소를 찾을 수 없습니다.');
        return;
    }

if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">등록된 상품이 없습니다.</td></tr>';
            return;
        }

    const start = startIndex != null ? startIndex : 0;
    const rows = [];
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const categoryName = getCategoryName(product.category);
        const supportAmount = (product.supportAmount != null && product.supportAmount > 0) ? product.supportAmount : Math.round((product.price || 0) * ((product.supportRate || 5) / 100));

        const isChecked = selectedProductIds.has(product.id);
        rows.push(`
            <tr>
                <td><input type="checkbox" class="product-row-checkbox" data-product-id="${escapeHtml(product.id)}" value="${escapeHtml(product.id)}" ${isChecked ? 'checked' : ''}></td>
                <td>${start + i + 1}</td>
                <td>
                    ${renderProductListImage(product)}
                </td>
                <td style="text-align: center;">${escapeHtml(product.name)}</td>
                <td>${categoryName}</td>
                <td>${formatPrice(product.price)}원</td>
                <td>${formatPrice(supportAmount)}원</td>
                <td>${product.stock || 0}</td>
                <td>
                    <select class="status-select" onchange="changeProductStatus('${product.id}', this.value)">
                        <option value="sale" ${product.status === 'sale' ? 'selected' : ''}>판매중</option>
                        <option value="soldout" ${product.status === 'soldout' ? 'selected' : ''}>품절</option>
                        <option value="hidden" ${product.status === 'hidden' ? 'selected' : ''}>숨김</option>
                    </select>
                </td>
                <td>${formatDate(product.createdAt)}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="openEditProductModal('${product.id}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    }
    tbody.innerHTML = rows.join('');
    updateProductListBulkDeleteVisibility();
    bindProductListHeadCheckbox();
}

function updateProductListBulkDeleteVisibility() {
    const btn = document.getElementById('productListBulkDeleteBtn');
    if (!btn) return;
    btn.style.display = selectedProductIds.size > 0 ? 'inline-block' : 'none';
}

/** 전체 선택 버튼: 모든 페이지 상품 선택 */
function selectAllProductsAcrossPages() {
    if (!allProductsData || allProductsData.length === 0) {
        alert('선택할 상품이 없습니다.');
        return;
    }
    allProductsData.forEach(p => { if (p.id) selectedProductIds.add(p.id); });
    updateProductListPage();
    updateProductListBulkDeleteVisibility();
    syncHeadCheckboxState();
}

/** 헤더 체크박스 상태: 현재 페이지가 전부 선택됐으면 체크, 일부면 indeterminate, 없으면 해제 */
function syncHeadCheckboxState() {
    const head = document.getElementById('productListHeadCheckbox');
    if (!head) return;
    const total = allProductsData.length;
    const start = (currentProductPage - 1) * productsPerPage;
    const end = Math.min(start + productsPerPage, total);
    let currentPageSelected = 0;
    for (let i = start; i < end; i++) {
        if (allProductsData[i].id && selectedProductIds.has(allProductsData[i].id)) currentPageSelected++;
    }
    const pageSize = end - start;
    head.checked = pageSize > 0 && currentPageSelected === pageSize;
    head.indeterminate = currentPageSelected > 0 && currentPageSelected < pageSize;
}

function bindProductListHeadCheckbox() {
    const head = document.getElementById('productListHeadCheckbox');
    const onHeadToggle = () => {
        const start = (currentProductPage - 1) * productsPerPage;
        const end = Math.min(start + productsPerPage, allProductsData.length);
        const isChecked = head.checked;
        for (let i = start; i < end; i++) {
            const id = allProductsData[i].id;
            if (id) (isChecked ? selectedProductIds.add(id) : selectedProductIds.delete(id));
        }
        document.querySelectorAll('.product-row-checkbox').forEach(cb => {
            const id = cb.getAttribute('data-product-id') || cb.value;
            if (id) cb.checked = selectedProductIds.has(id);
        });
        updateProductListBulkDeleteVisibility();
        syncHeadCheckboxState();
    };
    if (head) {
        head.onclick = onHeadToggle;
        head.checked = false;
        head.indeterminate = false;
    }
    document.querySelectorAll('.product-row-checkbox').forEach(cb => {
        cb.onclick = () => {
            const id = (cb.getAttribute('data-product-id') || cb.value || '').trim();
            if (id) {
                if (cb.checked) selectedProductIds.add(id);
                else selectedProductIds.delete(id);
            }
            updateProductListBulkDeleteVisibility();
            syncHeadCheckboxState();
        };
    });
    syncHeadCheckboxState();
}

async function bulkDeleteSelectedProducts() {
    const ids = Array.from(selectedProductIds).filter(Boolean);
    if (!ids.length) {
        alert('삭제할 상품을 선택하세요.');
        return;
    }
    if (!confirm('선택한 ' + ids.length + '개 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        if (!firebaseAdmin || !firebaseAdmin.productService || typeof firebaseAdmin.productService.deleteProduct !== 'function') {
            alert('Firebase 상품 삭제 기능을 사용할 수 없습니다. 페이지를 새로고침 후 다시 시도하세요.');
            return;
        }
        let done = 0;
        for (const id of ids) {
            try {
                await firebaseAdmin.productService.deleteProduct(id);
                done++;
            } catch (e) {
                console.error('상품 삭제 실패:', id, e);
            }
        }
        alert(done + '건 삭제되었습니다.');
        selectedProductIds.clear();
        await loadAllProducts();
        if (searchResultsData.length > 0) await searchProducts();
    } catch (err) {
        console.error('일괄 삭제 오류:', err);
        alert('삭제 중 오류가 발생했습니다: ' + (err.message || String(err)));
    }
}

// 수정 모달용 상세 설명 항목 추가/삭제
let editDetailRowCounter = 0;

function addEditDetailRow() {
    editDetailRowCounter++;
    const container = document.getElementById('editDetailRowsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'detail-row';
    newRow.setAttribute('data-row-id', editDetailRowCounter);
    newRow.innerHTML = `
        <div class="detail-row-inputs">
            <div class="form-group" style="flex: 1; margin: 0;">
                <input type="text" class="form-control edit-detail-title" placeholder="항목명">
            </div>
            <div class="form-group" style="flex: 1; margin: 0;">
                <input type="text" class="form-control edit-detail-content" placeholder="내용">
            </div>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeEditDetailRow(${editDetailRowCounter})" style="flex-shrink: 0;">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `;
    container.appendChild(newRow);
}

function removeEditDetailRow(rowId) {
    const row = document.querySelector(`#editDetailRowsContainer [data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
    }
}

// 수정 모달용 상세 이미지 업로드 추가/삭제
let editDetailImageUploadCounter = 0;

function addEditDetailImageUpload() {
    editDetailImageUploadCounter++;
    const container = document.getElementById('editDetailImagesContainer');
    
    const newUpload = document.createElement('div');
    newUpload.className = 'detail-image-upload';
    newUpload.setAttribute('data-edit-image-id', editDetailImageUploadCounter);
    newUpload.innerHTML = `
        <div class="image-upload-box small">
            <input type="file" id="editDetailImage${editDetailImageUploadCounter}" accept="image/*" onchange="previewEditDetailImage(event, ${editDetailImageUploadCounter})" hidden>
            <label for="editDetailImage${editDetailImageUploadCounter}" class="upload-label">
                <div id="editDetailImagePreview${editDetailImageUploadCounter}" class="image-preview">
                    <i class="fas fa-plus"></i>
                </div>
            </label>
        </div>
    `;
    container.appendChild(newUpload);
}

function addEditProductOptionRow() {
    const container = document.getElementById('editProductOptionsContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'product-option-row';
    row.setAttribute('data-edit-option-id', Date.now());
    row.innerHTML = `<input type="text" class="form-control edit-option-label" placeholder="옵션명" style="max-width: 200px;">
        <input type="number" class="form-control edit-option-price" placeholder="가격" style="max-width: 120px;"> 원
        <button type="button" class="btn btn-sm btn-danger btn-remove-edit-option"><i class="fas fa-minus"></i></button>`;
    container.appendChild(row);
    const removeBtn = row.querySelector('.btn-remove-edit-option');
    if (removeBtn) removeBtn.onclick = function () { this.closest('.product-option-row').remove(); };
}
function removeLastEditDetailImageUpload() {
    const container = document.getElementById('editDetailImagesContainer');
    const uploads = container.querySelectorAll('.detail-image-upload');
    
    // 최소 1개는 남겨두기
    if (uploads.length > 1) {
        const lastUpload = uploads[uploads.length - 1];
        lastUpload.remove();
    } else {
        alert('최소 1개의 이미지 업로드 칸은 유지되어야 합니다.');
    }
}

// 수정 모달 대표 이미지 미리보기
function previewEditMainImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('editMainImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="대표 이미지">`;
        };
        reader.readAsDataURL(file);
    }
}

// 수정 모달 상세 이미지 미리보기
function previewEditDetailImage(event, imageId) {
    const file = event.target.files[0];
    const preview = document.getElementById(`editDetailImagePreview${imageId}`);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="상세 이미지">`;
        };
        reader.readAsDataURL(file);
    }
}

// 파일을 Base64로 변환하는 함수
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 상품 수정 모달 열기
async function openEditProductModal(productId) {
    console.log('🔵 상품 수정 모달 열기:', productId);
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const product = allProductsData.find(p => p.id === productId);
        
        if (!product) {
            alert('상품 정보를 찾을 수 없습니다.');
            return;
        }

        // 카테고리 목록 먼저 로드
        if (typeof window.loadCategoriesForProduct === 'function') {
            await window.loadCategoriesForProduct();
            console.log('✅ 상품 수정 모달 - 카테고리 로드 완료');
        }

        // 기본 정보
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name || '';
        const categories = window.__productCategoriesList || [];
        const path = getEditModalCategoryPath(categories, product.category || '');
        const editCat1 = document.getElementById('editProductCategory1');
        const editCat2 = document.getElementById('editProductCategory2');
        const editCat3 = document.getElementById('editProductCategory3');
        if (editCat1 && path[0]) {
            editCat1.value = path[0];
            if (typeof window.__fillEditCategory2 === 'function') window.__fillEditCategory2();
            if (editCat2 && path[1]) {
                editCat2.value = path[1];
                if (typeof window.__fillEditCategory3 === 'function') window.__fillEditCategory3();
                if (editCat3 && path[2]) editCat3.value = path[2];
            }
        }
        document.getElementById('editProductManufacturer').value = product.manufacturer || product.brand || '';
        document.getElementById('editProductShortDesc').value = product.shortDesc || '';

        // 가격 정보
        document.getElementById('editProductOriginalPrice').value = product.originalPrice || product.price || 0;
        document.getElementById('editProductPrice').value = product.price || 0;
        document.getElementById('editProductDiscountRate').value = product.discountRate || 0;
        document.getElementById('editProductSupportAmount').value = product.supportAmount != null ? product.supportAmount : (product.supportRate != null ? Math.round((product.price || 0) * (product.supportRate || 5) / 100) : 0);

        // 재고 및 옵션
        document.getElementById('editProductStock').value = (product.stock != null && product.stock !== '') ? product.stock : 9999;
        document.getElementById('editProductMinOrder').value = product.minOrder || 1;
        document.getElementById('editProductMaxOrder').value = product.maxOrder || 10;
        document.getElementById('editProductStatus').value = product.status || 'sale';

        // 선택 옵션
        const optionsContainer = document.getElementById('editProductOptionsContainer');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            const opts = product.options && Array.isArray(product.options) && product.options.length > 0
                ? product.options
                : [{ label: '기본', price: product.price || 0 }];
            opts.forEach((opt, idx) => {
                const row = document.createElement('div');
                row.className = 'product-option-row';
                row.setAttribute('data-edit-option-id', idx);
                row.innerHTML = `<input type="text" class="form-control edit-option-label" placeholder="옵션명" value="${escapeHtml(opt.label || '')}" style="max-width: 200px;">
                    <input type="number" class="form-control edit-option-price" placeholder="가격" value="${opt.price != null ? opt.price : ''}" style="max-width: 120px;"> 원
                    <button type="button" class="btn btn-sm btn-danger btn-remove-edit-option"><i class="fas fa-minus"></i></button>`;
                optionsContainer.appendChild(row);
            });
            optionsContainer.querySelectorAll('.btn-remove-edit-option').forEach(btn => {
                btn.onclick = function () { this.closest('.product-option-row').remove(); };
            });
        }

        // 배송 정보
        document.getElementById('editProductDeliveryFee').value = product.deliveryFee || 0;
        document.getElementById('editProductDeliveryMethod').value = product.deliveryMethod || 'parcel';
        document.getElementById('editProductDeliveryDays').value = product.deliveryDays || '2-3일';
        document.getElementById('editProductFreeDeliveryAmount').value = product.freeDeliveryAmount || 0;

        // 대표 이미지 - 기존 이미지 URL을 hidden 필드에 저장하고 미리보기는 초기 상태로
        const mainImageUrl = product.mainImageUrl || product.imageUrl || product.image || '';
        document.getElementById('editProductMainImageUrl').value = mainImageUrl;
        const mainImageDisplayUrl = (typeof window.resolveProductImageUrl === 'function' && mainImageUrl) ? window.resolveProductImageUrl(mainImageUrl) : mainImageUrl;
        // 미리보기는 항상 초기 상태로 (업로드 아이콘 표시)
        const mainImagePreview = document.getElementById('editMainImagePreview');
        if (mainImageUrl) {
            mainImagePreview.innerHTML = `<img src="${escapeHtml(mainImageDisplayUrl)}" alt="" style="max-width: 100%; max-height: 200px; object-fit: contain;" onerror="this.style.display='none'">`;
        } else {
            mainImagePreview.innerHTML = `
                <i class="fas fa-cloud-upload-alt fa-3x"></i>
                <p>클릭하여 이미지 업로드</p>
                <small>권장 크기: 600x600px (JPG, PNG)</small>
            `;
        }

        // 상품 설명 (상세) / (글)
        const descEl = document.getElementById('editProductDescription');
        if (descEl) descEl.value = product.description || '';
        if (typeof Quill !== 'undefined' && document.getElementById('editProductDescriptionEditor')) {
            if (!window.editProductDescriptionQuill) {
                window.editProductDescriptionQuill = new Quill(document.getElementById('editProductDescriptionEditor'), {
                    theme: 'snow',
                    placeholder: '상품 설명을 입력하세요.',
                    modules: { toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'image'], ['clean']] }
                });
            }
            window.editProductDescriptionQuill.root.innerHTML = product.descriptionHtml || '';
        }

        // 상세 설명 항목 채우기
        const detailContainer = document.getElementById('editDetailRowsContainer');
        detailContainer.innerHTML = ''; // 기존 항목 초기화
        editDetailRowCounter = 0;

        if (product.details && Array.isArray(product.details) && product.details.length > 0) {
            product.details.forEach((detail, index) => {
                const newRow = document.createElement('div');
                newRow.className = 'detail-row';
                newRow.setAttribute('data-row-id', index);
                newRow.innerHTML = `
                    <div class="detail-row-inputs">
                        <div class="form-group" style="flex: 1; margin: 0;">
                            <input type="text" class="form-control edit-detail-title" placeholder="항목명" value="${escapeHtml(detail.title || '')}">
                        </div>
                        <div class="form-group" style="flex: 1; margin: 0;">
                            <input type="text" class="form-control edit-detail-content" placeholder="내용" value="${escapeHtml(detail.content || '')}">
                        </div>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeEditDetailRow(${index})" style="flex-shrink: 0;">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                `;
                detailContainer.appendChild(newRow);
                editDetailRowCounter = index;
            });
        } else {
            // 기본 행 하나 추가
            addEditDetailRow();
        }

        // 상세 이미지 채우기
        const imageContainer = document.getElementById('editDetailImagesContainer');
        imageContainer.innerHTML = ''; // 기존 항목 초기화
        editDetailImageUploadCounter = 0;

        if (product.detailImageUrls && Array.isArray(product.detailImageUrls) && product.detailImageUrls.length > 0) {
            product.detailImageUrls.forEach((imageUrl, index) => {
                const newUpload = document.createElement('div');
                newUpload.className = 'detail-image-upload';
                newUpload.setAttribute('data-edit-image-id', index);
                newUpload.innerHTML = `
                    <div class="image-upload-box small">
                        <input type="file" id="editDetailImage${index}" accept="image/*" onchange="previewEditDetailImage(event, ${index})" hidden>
                        <label for="editDetailImage${index}" class="upload-label">
                            <div id="editDetailImagePreview${index}" class="image-preview">
                                <i class="fas fa-plus"></i>
                                ${imageUrl ? '<small style="color: #4A5FC1; font-size: 10px;">기존 이미지 유지</small>' : ''}
                            </div>
                        </label>
                        <input type="hidden" class="existing-detail-image" value="${escapeHtml(imageUrl || '')}">
                    </div>
                `;
                imageContainer.appendChild(newUpload);
                editDetailImageUploadCounter = index;
            });
        } else {
            // 기본 업로드 박스 하나 추가
            addEditDetailImageUpload();
        }
        const editDetailUrlsEl = document.getElementById('editDetailImageUrlsInput');
        if (editDetailUrlsEl) editDetailUrlsEl.value = '';

        // 모달 표시
        const modal = document.getElementById('editProductModal');
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
    } catch (error) {
        console.error('❌ 상품 수정 모달 열기 오류:', error);
        alert('상품 정보를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 상품 수정 모달 닫기
function closeEditProductModal() {
    const modal = document.getElementById('editProductModal');
    modal.style.display = 'none';
}

// 상품 수정 저장
async function saveEditProduct() {
    console.log('🔵 상품 수정 저장');
    
    const productId = document.getElementById('editProductId').value;
    
    // 기본 정보
    const name = document.getElementById('editProductName').value.trim();
    
    const editCat1 = document.getElementById('editProductCategory1');
    const editCat2 = document.getElementById('editProductCategory2');
    const editCat3 = document.getElementById('editProductCategory3');
    const category = (editCat3 && editCat3.value) || (editCat2 && editCat2.value) || (editCat1 && editCat1.value) || '';
    const manufacturer = document.getElementById('editProductManufacturer').value.trim();
    const shortDesc = document.getElementById('editProductShortDesc').value.trim();

    // 가격 정보
    const originalPrice = parseInt(document.getElementById('editProductOriginalPrice').value) || 0;
    const price = parseInt(document.getElementById('editProductPrice').value);
    const discountRate = parseInt(document.getElementById('editProductDiscountRate').value) || 0;
    const supportAmount = parseInt(document.getElementById('editProductSupportAmount').value, 10) || 0;

    // 재고 및 옵션
    const stock = parseInt(document.getElementById('editProductStock').value);
    const minOrder = parseInt(document.getElementById('editProductMinOrder').value) || 1;
    const maxOrder = parseInt(document.getElementById('editProductMaxOrder').value) || 10;
    const status = document.getElementById('editProductStatus').value;

    // 배송 정보
    const deliveryFee = parseInt(document.getElementById('editProductDeliveryFee').value) || 0;
    const deliveryMethod = document.getElementById('editProductDeliveryMethod').value;
    const deliveryDays = document.getElementById('editProductDeliveryDays').value.trim();
    const freeDeliveryAmount = parseInt(document.getElementById('editProductFreeDeliveryAmount').value) || 0;

    // 추가 설정은 상품등록에 없으므로 기존 값 유지
    const currentProduct = allProductsData.find(p => p.id === productId) || {};
    const isNew = currentProduct.isNew || false;
    const isBest = currentProduct.isBest || false;
    const isRecommended = currentProduct.isRecommended || false;

    // 대표 이미지 처리: URL 입력 또는 파일 업로드
    const editMainImageFile = document.getElementById('editMainImage').files[0];
    let mainImageUrl = document.getElementById('editProductMainImageUrl').value.trim();
    if (editMainImageFile) {
        mainImageUrl = await fileToBase64(editMainImageFile);
    } else if (mainImageUrl) {
        mainImageUrl = toAbsoluteImageUrl(mainImageUrl);
    }
    
    // 상세 이미지 수집: 기존/업로드 + URL 입력란
    const detailImageUrls = [];
    const imageUploads = document.querySelectorAll('#editDetailImagesContainer .detail-image-upload');
    for (const upload of imageUploads) {
        const fileInput = upload.querySelector('input[type="file"]');
        const existingImageInput = upload.querySelector('.existing-detail-image');
        if (fileInput && fileInput.files[0]) {
            const base64 = await fileToBase64(fileInput.files[0]);
            detailImageUrls.push(base64);
        } else if (existingImageInput && existingImageInput.value) {
            detailImageUrls.push(existingImageInput.value);
        }
    }
    const editDetailUrlsInput = document.getElementById('editDetailImageUrlsInput');
    if (editDetailUrlsInput && editDetailUrlsInput.value.trim()) {
        editDetailUrlsInput.value.trim().split(/[\s,;|\n]+/).forEach(s => {
            const u = s.trim();
            if (u) detailImageUrls.push(toAbsoluteImageUrl(u));
        });
    }

    // 상품 설명 (상세) / (글)
    const description = (document.getElementById('editProductDescription') && document.getElementById('editProductDescription').value) || '';
    let descriptionHtml = '';
    if (window.editProductDescriptionQuill && window.editProductDescriptionQuill.root) {
        descriptionHtml = window.editProductDescriptionQuill.root.innerHTML || '';
    }

    // 선택 옵션 수집
    const options = [];
    const optionRows = document.querySelectorAll('#editProductOptionsContainer .product-option-row');
    optionRows.forEach((row, i) => {
        const labelInput = row.querySelector('.edit-option-label');
        const priceInput = row.querySelector('.edit-option-price');
        const label = (labelInput && labelInput.value.trim()) || ('옵션' + (i + 1));
        const price = (priceInput && parseInt(priceInput.value, 10)) || 0;
        if (label || !isNaN(price)) options.push({ label: label || ('옵션' + (i + 1)), price: isNaN(price) ? 0 : price });
    });
    if (options.length === 0) options.push({ label: '기본', price: price });

    // 상세 설명 항목 수집
    const detailTitles = document.querySelectorAll('.edit-detail-title');
    const detailContents = document.querySelectorAll('.edit-detail-content');
    const details = [];
    
    for (let i = 0; i < detailTitles.length; i++) {
        const title = detailTitles[i].value.trim();
        const content = detailContents[i].value.trim();
        if (title && content) {
            details.push({ title, content });
        }
    }

    // 유효성 검사
    if (!name) {
        alert('상품명을 입력해주세요.');
        return;
    }
    if (!category) {
        alert('카테고리를 선택해주세요.');
        return;
    }
    if (isNaN(price) || price < 0) {
        alert('올바른 판매가를 입력해주세요.');
        return;
    }
    if (isNaN(stock) || stock < 0) {
        alert('올바른 재고를 입력해주세요.');
        return;
    }

    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        const updateData = {
            name,
            category,
            manufacturer,
            shortDesc,
            description,
            descriptionHtml,
            originalPrice,
            price,
            discountRate,
            supportAmount,
            stock,
            minOrder,
            maxOrder,
            status,
            options,
            deliveryFee,
            deliveryMethod,
            deliveryDays,
            freeDeliveryAmount,
            isNew,
            isBest,
            isRecommended,
            details,
            mainImageUrl,
            detailImageUrls,
            imageUrl: mainImageUrl,
            updatedAt: new Date()
        };

        await firebaseAdmin.productService.updateProduct(productId, updateData);
        
        alert('상품 정보가 수정되었습니다.');
        closeEditProductModal();
        
        // 데이터 다시 로드
        await loadAllProducts();
        
        // 검색 결과가 있으면 검색도 다시 수행
        if (searchResultsData.length > 0) {
            await searchProducts();
        }
        
    } catch (error) {
        console.error('❌ 상품 수정 오류:', error);
        alert('상품 수정 중 오류가 발생했습니다: ' + error.message);
    }
}

// 상품 삭제 함수
async function deleteProduct(productId) {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        await firebaseAdmin.productService.deleteProduct(productId);
        alert('상품이 삭제되었습니다.');
        
        // 데이터 다시 로드
        await loadAllProducts();
        
        // 검색 결과가 있으면 검색도 다시 수행
        if (searchResultsData.length > 0) {
            await searchProducts();
        }
    } catch (error) {
        console.error('❌ 상품 삭제 오류:', error);
        alert('상품 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// 유틸리티 함수들
function getStatusText(status) {
    const statusMap = {
        'sale': '판매중',
        'soldout': '품절',
        'hidden': '숨김'
    };
    return statusMap[status] || '알 수 없음';
}

function getCategoryName(category) {
    if (!category) return '-';
    return _productListCategoryMap[category] || category;
}

function formatPrice(price) {
    return (price || 0).toLocaleString('ko-KR');
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- 상품 일괄등록 (엑셀) ----------
function openBulkProductModal() {
    const modal = document.getElementById('bulkProductModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    }
}
function closeBulkProductModal() {
    const modal = document.getElementById('bulkProductModal');
    if (modal) modal.style.display = 'none';
}

/** 엑셀 헤더(첫 행)와 매칭되는 상품 필드명 반환. g5_shop_item 등 다양한 컬럼명 지원 */
function getExcelHeaderMapping() {
    return {
        '상품명': 'name', '상품이름': 'name', '품명': 'name', 'name': 'name', 'it_name': 'name',
        '가격': 'price', '판매가': 'price', '상품가격': 'price', 'price': 'price', '판매가격': 'price', 'it_price': 'price',
        '정가': 'originalPrice', '원가': 'originalPrice', '정상가': 'originalPrice', 'it_cust_price': 'originalPrice',
        '카테고리': 'category', 'ca_name': 'category', 'ca_id': 'category', 'ca_id2': 'category', 'ca_id3': 'category', '분류': 'category', 'category': 'category',
        '재고': 'stock', '재고수량': 'stock', '수량': 'stock', 'stock': 'stock', 'it_stock': 'stock', 'it_stock_qty': 'stock',
        '제조사': 'manufacturer', '브랜드': 'manufacturer', '제조자': 'manufacturer', 'it_maker': 'manufacturer', 'it_brand': 'manufacturer',
        '쇼핑지원금': 'supportAmount', '지원금': 'supportAmount', '적립금': 'supportAmount', 'supportAmount': 'supportAmount',
        '설명': 'description', '상품설명': 'description', '상세설명': 'description', '상품상세정보': 'description', 'description': 'description', 'it_explan': 'description', 'it_explan2': 'description', '상세내용': 'description', '상세': 'description',
        '간단설명': 'shortDesc', '요약설명': 'shortDesc', 'shortDesc': 'shortDesc', 'it_basic': 'shortDesc',
        '이미지': 'imageUrl', '이미지주소': 'imageUrl', '상품이미지': 'imageUrl', '대표이미지': 'imageUrl',
        '메인이미지': 'imageUrl', '메인이미지주소': 'imageUrl', '대표이미지주소': 'imageUrl', '메인이미지가서버에저장된주소': 'imageUrl',
        'it_img': 'imageUrl', 'it_img1': 'imageUrl', '이미지1': 'imageUrl', 'it_img2': 'imageUrl', 'it_img3': 'imageUrl',
        'img': 'imageUrl', 'image': 'imageUrl', '이미지경로': 'imageUrl', '이미지파일': 'imageUrl',
        '상세이미지': 'detailImageUrl', '이미지2': 'detailImageUrl', '이미지3': 'detailImageUrl', '이미지4': 'detailImageUrl', '이미지5': 'detailImageUrl', '상세이미지주소': 'detailImageUrl', '상세이미지가서버에저장된주소': 'detailImageUrl', 'detailImageUrl': 'detailImageUrl',
        '옵션': 'options', 'option': 'options', 'it_option': 'options', '추가옵션': 'options'
    };
}

/** 엑셀 옵션 문자열을 { label, price }[] 로 파싱. "이름:가격;이름:가격" 또는 "색상:레드^가격:10000" */
function parseOptionsFromExcel(str, defaultPrice) {
    if (str == null || String(str).trim() === '') return null;
    const s = String(str).trim();
    const defaultP = parseInt(defaultPrice, 10) || 0;
    const out = [];
    const parts = s.split(/[;\n|]/);
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;
        const priceMatch = part.match(/가격[:^]?\s*(\d[\d,]*)/i);
        const price = priceMatch ? (parseNumber(priceMatch[1]) || defaultP) : defaultP;
        const simple = part.match(/^([^:^]+)[:^]\s*(\d[\d,]*)\s*$/);
        if (simple) {
            out.push({ label: simple[1].trim(), price: parseNumber(simple[2]) || defaultP });
            continue;
        }
        const kvBlocks = part.split(/\^/);
        let label = '';
        for (let j = 0; j < kvBlocks.length; j++) {
            const kv = kvBlocks[j].trim();
            const m = kv.match(/^(?:색상|옵션|종류|사이즈|size|color)[:=\s]+(.+)$/i);
            if (m) {
                label = m[1].trim();
                break;
            }
        }
        if (!label && kvBlocks[0]) label = kvBlocks[0].replace(/\d[\d,]*\s*$/, '').trim() || ('옵션' + (i + 1));
        if (label) out.push({ label: label, price: price });
    }
    return out.length > 0 ? out : null;
}

/** 이미지 값이 상대 경로면 절대 URL로 변환. IMAGE_BASE_URL(개인 서버)이 있으면 그쪽으로, 없으면 현재 사이트 기준 */
function toAbsoluteImageUrl(value) {
    if (!value || typeof value !== 'string') return '';
    const v = value.trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^data:/.test(v)) return v;
    const base = typeof window !== 'undefined' && window.IMAGE_BASE_URL && String(window.IMAGE_BASE_URL).trim();
    if (base && v.startsWith('/')) return base.replace(/\/$/, '') + v;
    if (typeof window === 'undefined' || !window.location) return v.startsWith('/') ? v : '/' + v;
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '';
    const basePath = pathname.includes('/admin') ? pathname.split('/admin')[0] : '';
    const prefix = basePath.endsWith('/') ? basePath : basePath + '/';
    const path = v.startsWith('/') ? v.slice(1) : v;
    return origin + prefix + path;
}

/** 엑셀 셀 숫자 파싱 (쉼표·공백 제거 후 정수) */
function parseNumber(val) {
    if (val == null || val === '') return NaN;
    const s = String(val).replace(/[\s,]/g, '');
    return parseInt(s, 10);
}

/** 공백·BOM·NBSP 제거 후 키 정규화 */
function normalizeHeaderKey(s) {
    if (s == null || typeof s !== 'string') return '';
    return s.replace(/\uFEFF/g, '').replace(/[\s\u00A0\u2002-\u200B\u202F\u205F\u3000]/g, '').trim();
}

/** 헤더 문자열에 포함되면 해당 필드로 매핑 (가격/지원금/제조사 등 누락 방지) */
var HEADER_CONTAINS_MAP = [
    { sub: '가격', field: 'price' }, { sub: 'price', field: 'price' }, { sub: '판매가', field: 'price' }, { sub: '원가', field: 'originalPrice' }, { sub: '정가', field: 'originalPrice' }, { sub: '정상가', field: 'originalPrice' },
    { sub: '지원금', field: 'supportAmount' }, { sub: '적립금', field: 'supportAmount' }, { sub: 'support', field: 'supportAmount' },
    { sub: '제조사', field: 'manufacturer' }, { sub: 'maker', field: 'manufacturer' }, { sub: '브랜드', field: 'manufacturer' }, { sub: 'brand', field: 'manufacturer' },
    { sub: '상세설명', field: 'description' }, { sub: '설명', field: 'description' }, { sub: 'description', field: 'description' }, { sub: 'explan', field: 'description' },
    { sub: '재고', field: 'stock' }, { sub: '수량', field: 'stock' }, { sub: 'stock', field: 'stock' },
    { sub: '카테고리', field: 'category' }, { sub: '분류', field: 'category' }, { sub: 'category', field: 'category' }, { sub: 'ca_id', field: 'category' },
    { sub: '상품명', field: 'name' }, { sub: 'it_name', field: 'name' }, { sub: '품명', field: 'name' },
    { sub: '이미지', field: 'imageUrl' }, { sub: 'img', field: 'imageUrl' }, { sub: 'it_img', field: 'imageUrl' },
    { sub: '옵션', field: 'options' }, { sub: 'option', field: 'options' }
];

/** 한 행을 헤더로 써서 colToField 채우기. 정확일치 → 포함매칭 → 부분매칭(키 3자 이상) */
function buildColToFieldFromRow(row, mapping, maxCols) {
    const len = Math.max((row && row.length) || 0, maxCols || 0);
    const headers = [];
    const colToField = {};
    for (let i = 0; i < len; i++) {
        const raw = row && row[i] != null ? String(row[i]) : '';
        const h = raw.trim().replace(/\uFEFF/g, '');
        headers[i] = h;
        const key = normalizeHeaderKey(h);
        if (!key) continue;
        const keyLower = key.toLowerCase();
        let matched = false;
        for (const [excelName, field] of Object.entries(mapping)) {
            const en = normalizeHeaderKey(excelName);
            if (!en) continue;
            if (key === en || keyLower === en.toLowerCase()) {
                colToField[i] = field;
                matched = true;
                break;
            }
        }
        if (matched) continue;
        if (mapping[h] != null || mapping[key] != null) {
            colToField[i] = mapping[h] ?? mapping[key];
            continue;
        }
        for (var c = 0; c < HEADER_CONTAINS_MAP.length && !matched; c++) {
            var entry = HEADER_CONTAINS_MAP[c];
            if (key.indexOf(entry.sub) !== -1 || keyLower.indexOf(entry.sub.toLowerCase()) !== -1) {
                if (!colToField[i]) { colToField[i] = entry.field; matched = true; }
                break;
            }
        }
        if (matched) continue;
        for (const [excelName, field] of Object.entries(mapping)) {
            const en = normalizeHeaderKey(excelName);
            if (!en || en.length < 2) continue;
            if (key.length >= en.length && key.indexOf(en) !== -1) {
                colToField[i] = field;
                break;
            }
            if (key.length >= 3 && en.length >= key.length && en.indexOf(key) !== -1) {
                colToField[i] = field;
                break;
            }
        }
    }
    return { colToField, headers };
}

/** 엑셀 시트(배열의 배열)를 상품 객체 배열로 변환. 0행+1행 병합 헤더로 열 수 넓힌 뒤, 1행/2행 중 매칭 많은 쪽 사용. */
function parseExcelToProducts(data) {
    if (!data || data.length < 2) return [];
    const mapping = getExcelHeaderMapping();
    const row0 = data[0] || [];
    const row1 = data[1] || [];
    const maxCols = Math.max(row0.length, row1.length, ...(data.slice(2, 6).map(r => (r && r.length) || 0)));
    var mergedRow = [];
    for (let i = 0; i < maxCols; i++) {
        const v0 = row0[i] != null ? String(row0[i]).trim() : '';
        const v1 = row1[i] != null ? String(row1[i]).trim() : '';
        mergedRow[i] = v0 || v1 || '';
    }
    const build = (row) => buildColToFieldFromRow(row, mapping, maxCols);
    const a = build(row0);
    const b = build(row1);
    const merged = build(mergedRow);
    const countMapped = (obj) => new Set(Object.values(obj.colToField)).size;
    const hasField = (obj, f) => Object.values(obj.colToField).indexOf(f) !== -1;
    const score = (obj) => (hasField(obj, 'name') ? 100 : 0) + (hasField(obj, 'price') ? 50 : 0) + countMapped(obj);
    const best = [merged, b, a].sort((x, y) => score(y) - score(x))[0];
    const dataStartRow = (best === merged || best === b) ? 2 : 1;
    const { colToField, headers } = best;
    var hasMapped = function (field) { return Object.keys(colToField).some(function (i) { return colToField[i] === field; }); };
    function setFallback(field, indices) {
        if (hasMapped(field)) return;
        for (var i = 0; i < indices.length; i++) {
            if (indices[i] < maxCols && !colToField[indices[i]]) {
                colToField[indices[i]] = field;
                return;
            }
        }
    }
    setFallback('name', [6, 2, 4, 0]);
    setFallback('price', [24, 20, 12, 8, 6, 5]);
    setFallback('manufacturer', [8, 10, 3]);
    setFallback('category', [1, 2, 0]);
    setFallback('stock', [4, 12, 14]);
    setFallback('supportAmount', [54, 8, 9]);
    setFallback('description', [12, 14, 10]);
    setFallback('imageUrl', [20, 6, 7]);
    setFallback('detailImageUrl', [34, 21, 22]);
    setFallback('options', [12, 13]);
    if (data.length > dataStartRow && typeof console !== 'undefined' && console.log) {
        var logLine = headers.slice(0, 30).map(function (h, i) { return colToField[i] ? (h || '(빈)') + '→' + colToField[i] : (h ? h + '→(미매핑)' : ''); }).filter(Boolean).join(', ');
        console.log('[일괄등록] 엑셀 헤더(데이터시작행 ' + dataStartRow + ', 열수 ' + maxCols + '):', logLine || '(없음)');
    }
    const getCol = (field) => {
        const k = Object.keys(colToField).find(i => colToField[i] === field);
        return k != null ? parseInt(k, 10) : -1;
    };
    const getCols = (field) => Object.keys(colToField).filter(i => colToField[i] === field).map(i => parseInt(i, 10));
    const products = [];
    for (let r = dataStartRow; r < data.length; r++) {
        const row = data[r];
        if (!Array.isArray(row)) continue;
        const nameCol = getCol('name');
        const name = (nameCol >= 0 ? row[nameCol] : row[0]) != null ? String(row[nameCol >= 0 ? nameCol : 0]).trim() : '';
        if (!name) continue;
        const priceCol = getCol('price');
        const priceVal = priceCol >= 0 ? row[priceCol] : row[1];
        const price = parseNumber(priceVal) || 0;
        const supportCol = getCol('supportAmount');
        const supportAmount = supportCol >= 0 && row[supportCol] != null ? parseNumber(row[supportCol]) : 0;
        const imgCol = getCol('imageUrl');
        const imageUrl = imgCol >= 0 && row[imgCol] != null ? String(row[imgCol]).trim() : '';
        const detailImgCols = getCols('detailImageUrl');
        let detailImageUrl = detailImgCols.map(c => row[c] != null ? String(row[c]).trim() : '').filter(Boolean).join('\n');
        const optCol = getCol('options');
        const optionsRaw = optCol >= 0 && row[optCol] != null ? String(row[optCol]).trim() : '';
        const optionsParsed = parseOptionsFromExcel(optionsRaw, price);
        products.push({
            name: name,
            price: price,
            imageUrl: imageUrl,
            detailImageUrl: detailImageUrl,
            supportAmount: isNaN(supportAmount) ? 0 : supportAmount,
            options: optionsParsed
        });
    }
    return products;
}

async function handleBulkProductFile(file) {
    if (!file) return;
    const modal = document.getElementById('bulkProductModal');
    const msgEl = document.getElementById('bulkProductModalMessage');
    const progressWrap = document.getElementById('bulkProductProgressBar');
    const progressFill = document.getElementById('bulkProductProgressFill');
    openBulkProductModal();
    if (msgEl) msgEl.textContent = '엑셀 파일을 읽는 중...';
    if (progressWrap) progressWrap.style.display = 'none';

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('엑셀 라이브러리를 불러올 수 없습니다. 페이지를 새로고침 후 다시 시도하세요.');
        }
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
                    const firstSheet = wb.Sheets[wb.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsArrayBuffer(file);
        });

        const products = parseExcelToProducts(data);
        if (products.length === 0) {
            if (msgEl) msgEl.textContent = '등록할 상품 데이터가 없습니다. 엑셀 첫 행에 상품명 등 헤더가 있는지 확인하세요.';
            return;
        }
        const firebaseAdmin = await waitForFirebaseAdmin();
        if (progressWrap) progressWrap.style.display = 'block';
        if (progressFill) progressFill.style.width = '0%';
        let done = 0;
        const total = products.length;
        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            const mainImgUrl = toAbsoluteImageUrl((p.imageUrl || '').trim());
            const detailRaw = (p.detailImageUrl || '').trim();
            const detailUrls = detailRaw ? detailRaw.split(/[\s,;|\n]+/).map(s => s.trim()).filter(Boolean).map(toAbsoluteImageUrl) : [];
            const detailImageUrls = detailUrls.length > 0 ? detailUrls : (mainImgUrl ? [mainImgUrl] : []);
            const opts = (p.options && p.options.length > 0) ? p.options : [{ label: '기본', price: p.price }];
            const productData = {
                name: p.name,
                category: '',
                price: p.price,
                originalPrice: p.price,
                stock: 9999,
                status: 'sale',
                description: '',
                descriptionHtml: '',
                details: [],
                mainImageUrl: mainImgUrl || (detailImageUrls[0] || ''),
                detailImageUrls: detailImageUrls,
                imageUrl: mainImgUrl || (detailImageUrls[0] || ''),
                manufacturer: '',
                shortDesc: '',
                supportAmount: p.supportAmount || 0,
                minOrder: 1,
                maxOrder: 10,
                deliveryFee: 0,
                deliveryMethod: 'parcel',
                deliveryDays: '2-3일',
                freeDeliveryAmount: 0,
                isNew: false,
                isBest: false,
                isRecommended: false,
                options: opts,
                createdAt: new Date()
            };
            await firebaseAdmin.productService.addProduct(productData);
            done++;
            if (progressFill) progressFill.style.width = Math.round((done / total) * 100) + '%';
            if (msgEl) msgEl.textContent = `${done} / ${total}건 등록 중...`;
        }
        if (msgEl) msgEl.textContent = `${total}건 상품이 등록되었습니다. 목록을 새로 불러옵니다. (이미지가 비어 있던 상품은 엑셀에 이미지 열이 있는지 확인 후 다시 일괄등록하세요.)`;
        if (progressFill) progressFill.style.width = '100%';
        setTimeout(() => {
            closeBulkProductModal();
            loadAllProducts();
        }, 1500);
    } catch (error) {
        console.error('일괄등록 오류:', error);
        if (msgEl) msgEl.textContent = '오류: ' + (error.message || String(error));
        if (progressWrap) progressWrap.style.display = 'none';
    }
}

// 전역으로 export
window.loadAllProducts = loadAllProducts;
window.searchProducts = searchProducts;
window.resetProductSearch = resetProductSearch;
window.deleteProduct = deleteProduct;
window.addTestProducts = addTestProducts;
window.changeProductStatus = changeProductStatus;
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.saveEditProduct = saveEditProduct;
window.goToProductPage = goToProductPage;
window.addEditDetailRow = addEditDetailRow;
window.addEditProductOptionRow = addEditProductOptionRow;
window.removeEditDetailRow = removeEditDetailRow;
window.addEditDetailImageUpload = addEditDetailImageUpload;
window.removeLastEditDetailImageUpload = removeLastEditDetailImageUpload;
window.previewEditMainImage = previewEditMainImage;
window.previewEditDetailImage = previewEditDetailImage;
window.closeBulkProductModal = closeBulkProductModal;
window.handleBulkProductFile = handleBulkProductFile;
window.bulkDeleteSelectedProducts = bulkDeleteSelectedProducts;
window.selectAllProductsAcrossPages = selectAllProductsAcrossPages;

/** 상품 등록 페이지 진입 시 일괄등록 버튼 바인딩 (loadPageData에서 호출) */
function initBulkProductUpload() {
    const btnBulk = document.getElementById('btnBulkProductUpload');
    const bulkInput = document.getElementById('bulkProductExcelInput');
    if (!btnBulk || !bulkInput) return;
    btnBulk.onclick = function () { bulkInput.click(); };
    bulkInput.onchange = function () {
        const file = this.files && this.files[0];
        if (file) handleBulkProductFile(file);
        this.value = '';
    };
}

// 페이지 로드 시 자동 초기화
(function() {
    console.log('🔵 product-list.js 로드 완료');
    
    // 검색 버튼 이벤트 리스너 등록
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductListPage);
    } else {
        initProductListPage();
    }

    function initProductListPage() {
        // 검색 버튼 이벤트 리스너
        const searchBtn = document.getElementById('searchProductsBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchProducts);
        }

        // 초기화 버튼 이벤트 리스너
        const resetBtn = document.getElementById('resetProductSearchBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetProductSearch);
        }

        const bulkDeleteBtn = document.getElementById('productListBulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', bulkDeleteSelectedProducts);
        }
        const selectAllBtn = document.getElementById('productListSelectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', selectAllProductsAcrossPages);
        }

        // 페이지가 활성화되어 있으면 데이터 로드
        // 주의: loadPageData에서 이미 loadAllProducts를 호출하므로 여기서는 호출하지 않음
        // 중복 호출을 방지하여 카테고리가 덮어쓰이지 않도록 함
    }
})();
