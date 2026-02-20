// admin/js/product-list.js
// 버전: 2026-02-06-20:00

let currentProductPage = 1;
const productsPerPage = 10;
let allProductsData = []; // 모든 상품 데이터
let searchResultsData = []; // 검색 결과 데이터
let _productListCategoryMap = {}; // 카테고리 ID → 이름 (Firestore 기준)

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

// 테스트 상품 데이터 추가 함수
async function addTestProducts() {
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('✅ 테스트 상품 추가 시작');

        const testProducts = [
            {
                name: '메가커피 모바일금액권 3만원',
                category: 'coffee',
                price: 30000,
                stock: 100,
                status: 'sale',
                description: '메가커피에서 사용 가능한 모바일 금액권',
                createdAt: new Date()
            },
            {
                name: '스타벅스 아메리카노 Tall',
                category: 'coffee',
                price: 4500,
                stock: 50,
                status: 'sale',
                description: '스타벅스 아메리카노 톨 사이즈',
                createdAt: new Date()
            },
            {
                name: 'CU 편의점 금액권 1만원',
                category: 'food',
                price: 10000,
                stock: 200,
                status: 'sale',
                description: 'CU 편의점에서 사용 가능한 금액권',
                createdAt: new Date()
            },
            {
                name: '올리브영 상품권 2만원',
                category: 'beauty',
                price: 20000,
                stock: 150,
                status: 'sale',
                description: '올리브영에서 사용 가능한 상품권',
                createdAt: new Date()
            },
            {
                name: '다이소 상품권 5천원',
                category: 'life',
                price: 5000,
                stock: 300,
                status: 'sale',
                description: '다이소에서 사용 가능한 상품권',
                createdAt: new Date()
            }
        ];

        for (const product of testProducts) {
            await firebaseAdmin.productService.addProduct(product);
            console.log('✅ 테스트 상품 추가 완료:', product.name);
        }

        alert('테스트 상품 5개가 추가되었습니다!');
        await loadAllProducts();

    } catch (error) {
        console.error('❌ 테스트 상품 추가 오류:', error);
        alert('테스트 상품 추가 중 오류가 발생했습니다: ' + error.message);
    }
}

// 모든 상품 로드 함수
async function loadAllProducts() {
    console.log('🔵🔵🔵 loadAllProducts 함수 호출됨');
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('✅ 상품목록: Firebase Admin 초기화 완료');

        const products = await firebaseAdmin.productService.getProducts();
        allProductsData = products;

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
            const tbody = document.getElementById('productListBody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-message">
                        등록된 상품이 없습니다.<br>
                        <button class="btn btn-primary" onclick="addTestProducts()" style="margin-top: 10px;">
                            테스트 상품 5개 추가하기
                        </button>
                    </td>
                </tr>
            `;
        } else {
            renderAllProductsTable(allProductsData);
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
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">검색 결과가 여기에 표시됩니다.</td></tr>';
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

// 검색 결과 테이블 렌더링
function renderSearchResultsTable(products) {
    const tbody = document.getElementById('productSearchResultsBody');
    if (!tbody) {
        console.error('❌ productSearchResultsBody 요소를 찾을 수 없습니다.');
        return;
    }

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">검색 결과가 없습니다.</td></tr>';
        return;
    }

    const rows = [];
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const categoryName = getCategoryName(product.category);

        rows.push(`
            <tr>
                <td>${i + 1}</td>
                <td>
                    <div style="width: 60px; height: 60px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 12px; color: #999;">
                        이미지
                    </div>
                </td>
                <td style="text-align: left;">${escapeHtml(product.name)}</td>
                <td>${categoryName}</td>
                <td>${formatPrice(product.price)}원</td>
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

// 전체 상품 테이블 렌더링
function renderAllProductsTable(products) {
    const tbody = document.getElementById('productListBody');
    if (!tbody) {
        console.error('❌ productListBody 요소를 찾을 수 없습니다.');
        return;
    }

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">등록된 상품이 없습니다.</td></tr>';
        return;
    }

    const rows = [];
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const categoryName = getCategoryName(product.category);

        rows.push(`
            <tr>
                <td>${i + 1}</td>
                <td>
                    <div style="width: 60px; height: 60px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 12px; color: #999;">
                        이미지
                    </div>
                </td>
                <td style="text-align: left;">${escapeHtml(product.name)}</td>
                <td>${categoryName}</td>
                <td>${formatPrice(product.price)}원</td>
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
        
        // 분류 체크박스 설정 (배열 처리)
        const displayCategories = Array.isArray(product.displayCategory) 
            ? product.displayCategory 
            : [product.displayCategory || 'all'];
        
        document.querySelectorAll('#editDisplayCategoryCheckboxes input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = displayCategories.includes(checkbox.value);
        });
        
        document.getElementById('editProductCategory').value = product.category || '';
        document.getElementById('editProductBrand').value = product.brand || '';
        document.getElementById('editProductShortDesc').value = product.shortDesc || '';

        // 가격 정보
        document.getElementById('editProductOriginalPrice').value = product.originalPrice || product.price || 0;
        document.getElementById('editProductPrice').value = product.price || 0;
        document.getElementById('editProductDiscountRate').value = product.discountRate || 0;
        document.getElementById('editProductSupportRate').value = product.supportRate || 5;

        // 재고 및 옵션
        document.getElementById('editProductStock').value = product.stock || 0;
        document.getElementById('editProductMinOrder').value = product.minOrder || 1;
        document.getElementById('editProductMaxOrder').value = product.maxOrder || 10;
        document.getElementById('editProductStatus').value = product.status || 'sale';

        // 배송 정보
        document.getElementById('editProductDeliveryFee').value = product.deliveryFee || 0;
        document.getElementById('editProductDeliveryMethod').value = product.deliveryMethod || 'parcel';
        document.getElementById('editProductDeliveryDays').value = product.deliveryDays || '2-3일';
        document.getElementById('editProductFreeDeliveryAmount').value = product.freeDeliveryAmount || 0;

        // 추가 설정
        document.getElementById('editProductIsNew').checked = product.isNew || false;
        document.getElementById('editProductIsBest').checked = product.isBest || false;
        document.getElementById('editProductIsRecommended').checked = product.isRecommended || false;

        // 대표 이미지 - 기존 이미지 URL을 hidden 필드에 저장하고 미리보기는 초기 상태로
        const mainImageUrl = product.mainImageUrl || product.imageUrl || product.image || '';
        document.getElementById('editProductMainImageUrl').value = mainImageUrl;
        
        // 미리보기는 항상 초기 상태로 (업로드 아이콘 표시)
        const mainImagePreview = document.getElementById('editMainImagePreview');
        mainImagePreview.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x"></i>
            <p>클릭하여 이미지 업로드</p>
            <small>권장 크기: 600x600px (JPG, PNG)</small>
            ${mainImageUrl ? '<small style="color: #4A5FC1; margin-top: 5px;">기존 이미지 유지됨</small>' : ''}
        `;

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
    
    // 분류 체크박스 값 수집 (배열)
    const displayCategoryCheckboxes = document.querySelectorAll('#editDisplayCategoryCheckboxes input[type="checkbox"]:checked');
    const displayCategory = Array.from(displayCategoryCheckboxes).map(cb => cb.value);
    
    const category = document.getElementById('editProductCategory').value;
    const brand = document.getElementById('editProductBrand').value.trim();
    const shortDesc = document.getElementById('editProductShortDesc').value.trim();

    // 가격 정보
    const originalPrice = parseInt(document.getElementById('editProductOriginalPrice').value) || 0;
    const price = parseInt(document.getElementById('editProductPrice').value);
    const discountRate = parseInt(document.getElementById('editProductDiscountRate').value) || 0;
    const supportRate = parseInt(document.getElementById('editProductSupportRate').value) || 5;

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

    // 추가 설정
    const isNew = document.getElementById('editProductIsNew').checked;
    const isBest = document.getElementById('editProductIsBest').checked;
    const isRecommended = document.getElementById('editProductIsRecommended').checked;

    // 대표 이미지 처리
    const editMainImageFile = document.getElementById('editMainImage').files[0];
    let mainImageUrl = document.getElementById('editProductMainImageUrl').value.trim();
    
    if (editMainImageFile) {
        // 새 이미지가 업로드된 경우
        mainImageUrl = await fileToBase64(editMainImageFile);
    }
    
    // 상세 이미지 수집
    const detailImageUrls = [];
    const imageUploads = document.querySelectorAll('#editDetailImagesContainer .detail-image-upload');
    
    for (const upload of imageUploads) {
        const fileInput = upload.querySelector('input[type="file"]');
        const existingImageInput = upload.querySelector('.existing-detail-image');
        
        if (fileInput && fileInput.files[0]) {
            // 새 이미지가 업로드된 경우
            const base64 = await fileToBase64(fileInput.files[0]);
            detailImageUrls.push(base64);
        } else if (existingImageInput && existingImageInput.value) {
            // 기존 이미지 유지
            detailImageUrls.push(existingImageInput.value);
        }
    }

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
            displayCategory,
            category,
            brand,
            shortDesc,
            originalPrice,
            price,
            discountRate,
            supportRate,
            stock,
            minOrder,
            maxOrder,
            status,
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
            imageUrl: mainImageUrl, // 하위 호환성
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
window.addEditDetailRow = addEditDetailRow;
window.removeEditDetailRow = removeEditDetailRow;
window.addEditDetailImageUpload = addEditDetailImageUpload;
window.removeLastEditDetailImageUpload = removeLastEditDetailImageUpload;
window.previewEditMainImage = previewEditMainImage;
window.previewEditDetailImage = previewEditDetailImage;

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

        // 페이지가 활성화되어 있으면 데이터 로드
        // 주의: loadPageData에서 이미 loadAllProducts를 호출하므로 여기서는 호출하지 않음
        // 중복 호출을 방지하여 카테고리가 덮어쓰이지 않도록 함
    }
})();
