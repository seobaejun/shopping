// 카테고리 관리 JavaScript
console.log('✅ category-manage.js 로드됨');

// 카테고리 데이터 (Firestore에서 가져올 예정)
let categoriesData = [];

// Firebase Admin 대기 함수
async function waitForFirebaseAdmin() {
    let attempts = 0;
    while (!window.firebaseAdmin && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    if (!window.firebaseAdmin) {
        throw new Error('Firebase Admin이 초기화되지 않았습니다.');
    }
    return window.firebaseAdmin;
}

// 카테고리 목록 로드
async function loadCategories() {
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const db = firebase.firestore();
        
        const snapshot = await db.collection('categories')
            .orderBy('sortOrder', 'asc')
            .get();
        
        categoriesData = [];
        snapshot.forEach(doc => {
            categoriesData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ 카테고리 로드 완료:', categoriesData);
        renderCategoryTree();
    } catch (error) {
        console.error('❌ 카테고리 로드 오류:', error);
        renderCategoryTree();
    }
}

// 카테고리 트리 렌더링
function renderCategoryTree() {
    const treeContainer = document.getElementById('categoryTree');
    if (!treeContainer) return;
    
    // 1차 카테고리만 필터링
    const level1Categories = categoriesData.filter(cat => cat.level === 1 && !cat.parentId);
    
    // 데이터가 없으면 빈 상태
    if (level1Categories.length === 0) {
        treeContainer.innerHTML = '';
        return;
    }
    
    let html = '';
    level1Categories.forEach(category => {
        html += renderCategoryItem(category);
    });
    
    treeContainer.innerHTML = html;
}

// 카테고리 아이템 렌더링 (재귀적으로 하위 카테고리 포함)
function renderCategoryItem(category) {
    const level = category.level || 1;
    const children = categoriesData.filter(cat => cat.parentId === category.id);
    const isHidden = category.isHidden || false;
    
    let html = `
        <div class="category-item level-${level} ${isHidden ? 'hidden-category' : ''}" data-id="${category.id}">
            <div class="category-info">
                <span class="category-name">${category.name}</span>
                ${isHidden ? '<span class="hidden-badge">숨김</span>' : ''}
            </div>
            <div class="category-actions">
                <button class="btn-move" onclick="showCategoryMoveOptions('${category.id}', ${level})" title="카테고리 이동">
                    <i class="fas fa-arrows-alt"></i> 이동
                </button>
                <label class="category-hidden-checkbox" title="숨김">
                    <input type="checkbox" ${isHidden ? 'checked' : ''} onchange="toggleCategoryHidden('${category.id}', this.checked)">
                    <span>숨김</span>
                </label>
                <button class="btn-icon btn-edit" onclick="editCategory('${category.id}')" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteCategory('${category.id}')" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
    `;
    
    // 3차 카테고리가 아니면 추가 버튼 표시
    if (level < 3) {
        html += `
                <button class="btn-icon btn-add" onclick="toggleAddCategoryForm('${category.id}', ${level + 1})" title="하위 카테고리 추가">
                    <i class="fas fa-plus"></i>
                </button>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // 하위 카테고리 렌더링
    children.forEach(child => {
        html += renderCategoryItem(child);
    });
    
    return html;
}

// 카테고리 추가 폼 토글
function toggleAddCategoryForm(parentId, level) {
    const form = document.getElementById('categoryAddForm');
    const input = document.getElementById('newCategoryName');
    const parentIdInput = document.getElementById('newCategoryParentId');
    const levelInput = document.getElementById('newCategoryLevel');
    
    if (form.style.display === 'none') {
        // 폼 열기
        form.style.display = 'block';
        parentIdInput.value = parentId || '';
        levelInput.value = level;
        input.value = '';
        input.focus();
        
        // 플레이스홀더 변경
        if (level === 1) {
            input.placeholder = '1차 카테고리명을 입력하세요';
        } else if (level === 2) {
            input.placeholder = '2차 카테고리명을 입력하세요';
        } else {
            input.placeholder = '3차 카테고리명을 입력하세요';
        }
    } else {
        // 폼 닫기
        form.style.display = 'none';
        input.value = '';
    }
}

// 카테고리 추가 폼 닫기
function closeAddCategoryForm() {
    const form = document.getElementById('categoryAddForm');
    const input = document.getElementById('newCategoryName');
    form.style.display = 'none';
    input.value = '';
}

// 카테고리 저장 (폼에서)
async function saveCategoryFromForm() {
    const input = document.getElementById('newCategoryName');
    const parentIdInput = document.getElementById('newCategoryParentId');
    const levelInput = document.getElementById('newCategoryLevel');
    
    const categoryName = input.value.trim();
    const parentId = parentIdInput.value || null;
    const level = parseInt(levelInput.value);
    
    if (!categoryName) {
        alert('카테고리명을 입력하세요.');
        input.focus();
        return;
    }
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const db = firebase.firestore();
        
        const newCategory = {
            name: categoryName,
            level: level,
            parentId: parentId,
            sortOrder: categoriesData.filter(cat => cat.parentId === parentId).length + 1,
            createdAt: new Date()
        };
        
        const docRef = await db.collection('categories').add(newCategory);
        
        console.log('✅ 카테고리 추가 완료:', docRef.id);
        
        // 로컬 데이터에 추가 (renderCategoryTree가 데이터를 찾을 수 있도록)
        const newCategoryData = {
            id: docRef.id,
            ...newCategory
        };
        categoriesData.push(newCategoryData);
        
        console.log('✅ categoriesData 업데이트:', categoriesData);
        
        // 폼 닫기
        closeAddCategoryForm();
        
        // 전체 트리 다시 렌더링
        renderCategoryTree();
        
        alert('카테고리가 추가되었습니다!');
    } catch (error) {
        console.error('❌ 카테고리 추가 오류:', error);
        alert('카테고리 추가 중 오류가 발생했습니다: ' + error.message);
    }
}

// DOM에 카테고리 추가
function addCategoryToDOM(id, name, level, parentId) {
    const treeContainer = document.getElementById('categoryTree');
    
    // 새 카테고리 HTML 생성
    const categoryHTML = `
        <div class="category-item level-${level}" data-id="${id}">
            <div class="category-info">
                <span class="category-level-label">${level}차 카테고리</span>
                <span class="category-name">${name}</span>
                <span class="category-count">(0)</span>
            </div>
            <div class="category-actions">
                <button class="btn-icon btn-change" onclick="changeCategoryLevel('${id}')" title="카테고리 변경"><i class="fas fa-exchange-alt"></i></button>
                <button class="btn-icon btn-edit" onclick="editCategory('${id}')" title="수정"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" onclick="deleteCategory('${id}')" title="삭제"><i class="fas fa-trash"></i></button>
                ${level < 3 ? `<button class="btn-icon btn-add" onclick="toggleAddCategoryForm('${id}', ${level + 1})" title="하위 추가"><i class="fas fa-plus"></i></button>` : ''}
            </div>
        </div>
    `;
    
    if (parentId) {
        // 하위 카테고리인 경우, 부모 카테고리 바로 아래에 추가
        const parentElement = treeContainer.querySelector(`[data-id="${parentId}"]`);
        if (parentElement) {
            // 부모의 다음 형제 요소 찾기 (같은 레벨이거나 상위 레벨까지)
            let nextSibling = parentElement.nextElementSibling;
            let insertPosition = null;
            
            while (nextSibling) {
                const siblingLevel = parseInt(nextSibling.className.match(/level-(\d)/)?.[1] || 1);
                if (siblingLevel <= level - 1) {
                    // 같은 레벨이거나 상위 레벨을 만나면 그 앞에 삽입
                    insertPosition = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
            
            if (insertPosition) {
                insertPosition.insertAdjacentHTML('beforebegin', categoryHTML);
            } else {
                // 마지막에 추가
                parentElement.insertAdjacentHTML('afterend', categoryHTML);
            }
        }
    } else {
        // 1차 카테고리인 경우, 맨 아래에 추가
        treeContainer.insertAdjacentHTML('beforeend', categoryHTML);
    }
}

// 카테고리 레벨 변경 폼 토글
function changeCategoryLevel(categoryId) {
    const categoryElement = document.querySelector(`[data-id="${categoryId}"]`);
    if (!categoryElement) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    const currentLevel = parseInt(categoryElement.className.match(/level-(\d)/)?.[1] || 1);
    
    // 하위 카테고리가 있는지 확인
    const hasChildren = categoriesData.some(cat => cat.parentId === categoryId);
    if (hasChildren) {
        alert('하위 카테고리가 있는 카테고리는 레벨을 변경할 수 없습니다.\n먼저 하위 카테고리를 삭제해주세요.');
        return;
    }
    
    // 기존 변경 폼이 있으면 제거
    const existingForm = document.getElementById('categoryLevelChangeForm');
    if (existingForm) {
        existingForm.remove();
    }
    
    // 변경 폼 HTML 생성
    const formHTML = `
        <div class="category-add-form" id="categoryLevelChangeForm">
            <div class="form-content">
                <select id="newCategoryLevel" class="form-control">
                    <option value="1" ${currentLevel === 1 ? 'selected' : ''}>1차 카테고리</option>
                    <option value="2" ${currentLevel === 2 ? 'selected' : ''}>2차 카테고리</option>
                    <option value="3" ${currentLevel === 3 ? 'selected' : ''}>3차 카테고리</option>
                </select>
                <input type="hidden" id="changeCategoryId" value="${categoryId}" />
                <div class="form-buttons">
                    <button class="btn btn-primary btn-sm" onclick="saveCategoryLevelChange()">
                        <i class="fas fa-check"></i> 변경
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="closeCategoryLevelChangeForm()">
                        <i class="fas fa-times"></i> 취소
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 카테고리 아이템 아래에 폼 추가
    categoryElement.insertAdjacentHTML('afterend', formHTML);
}

// 카테고리 레벨 변경 폼 닫기
function closeCategoryLevelChangeForm() {
    const form = document.getElementById('categoryLevelChangeForm');
    if (form) {
        form.remove();
    }
}

// 카테고리 레벨 변경 저장
async function saveCategoryLevelChange() {
    const categoryId = document.getElementById('changeCategoryId').value;
    const newLevel = parseInt(document.getElementById('newCategoryLevel').value);
    
    const categoryElement = document.querySelector(`[data-id="${categoryId}"]`);
    if (!categoryElement) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    const currentLevel = parseInt(categoryElement.className.match(/level-(\d)/)?.[1] || 1);
    const nameSpan = categoryElement.querySelector('.category-name');
    const categoryName = nameSpan ? nameSpan.textContent : '';
    
    console.log('🔵 카테고리 레벨 변경:', { categoryId, currentLevel, newLevel, categoryName });
    
    if (newLevel === currentLevel) {
        alert('동일한 레벨입니다.');
        closeCategoryLevelChangeForm();
        return;
    }
    
    try {
        // Firebase 초기화 확인
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error('❌ Firebase가 초기화되지 않았습니다.');
            alert('Firebase 연결 오류입니다. 페이지를 새로고침 해주세요.');
            return;
        }
        
        const db = firebase.firestore();
        
        await db.collection('categories').doc(categoryId).update({
            level: newLevel,
            parentId: null, // 레벨 변경 시 부모 초기화
            updatedAt: new Date()
        });
        
        console.log('✅ 카테고리 레벨 변경 완료:', categoryId);
        
        // 로컬 데이터 업데이트
        const category = categoriesData.find(cat => cat.id === categoryId);
        if (category) {
            category.level = newLevel;
            category.parentId = null;
        }
        
        console.log('✅ categoriesData 업데이트:', categoriesData);
        
        // 폼 닫기
        closeCategoryLevelChangeForm();
        
        // 전체 트리 다시 렌더링
        renderCategoryTree();
        
        alert('카테고리 레벨이 변경되었습니다!');
    } catch (error) {
        console.error('❌ 카테고리 레벨 변경 오류:', error);
        alert('카테고리 레벨 변경 중 오류가 발생했습니다: ' + error.message);
    }
}

// 카테고리 수정 폼 토글
function editCategory(categoryId) {
    const categoryElement = document.querySelector(`[data-id="${categoryId}"]`);
    if (!categoryElement) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    const nameSpan = categoryElement.querySelector('.category-name');
    const currentName = nameSpan.textContent;
    
    // 기존 수정 폼이 있으면 제거
    const existingForm = document.getElementById('categoryEditForm');
    if (existingForm) {
        existingForm.remove();
    }
    
    // 수정 폼 HTML 생성
    const formHTML = `
        <div class="category-add-form" id="categoryEditForm">
            <div class="form-content">
                <input type="text" id="editCategoryName" class="form-control" value="${currentName}" />
                <input type="hidden" id="editCategoryId" value="${categoryId}" />
                <div class="form-buttons">
                    <button class="btn btn-primary btn-sm" onclick="saveCategoryEdit()">
                        <i class="fas fa-check"></i> 저장
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="closeCategoryEditForm()">
                        <i class="fas fa-times"></i> 취소
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 카테고리 아이템 아래에 폼 추가
    categoryElement.insertAdjacentHTML('afterend', formHTML);
    
    // 입력 필드에 포커스
    document.getElementById('editCategoryName').focus();
    document.getElementById('editCategoryName').select();
}

// 카테고리 수정 폼 닫기
function closeCategoryEditForm() {
    const form = document.getElementById('categoryEditForm');
    if (form) {
        form.remove();
    }
}

// 카테고리 수정 저장
async function saveCategoryEdit() {
    const categoryId = document.getElementById('editCategoryId').value;
    const newName = document.getElementById('editCategoryName').value.trim();
    
    console.log('🔵 saveCategoryEdit 호출됨:', { categoryId, newName });
    
    if (!newName) {
        alert('카테고리명을 입력하세요.');
        document.getElementById('editCategoryName').focus();
        return;
    }
    
    try {
        // Firebase 초기화 확인
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error('❌ Firebase가 초기화되지 않았습니다.');
            alert('Firebase 연결 오류입니다. 페이지를 새로고침 해주세요.');
            return;
        }
        
        const db = firebase.firestore();
        
        await db.collection('categories').doc(categoryId).update({
            name: newName,
            updatedAt: new Date()
        });
        
        console.log('✅ 카테고리 수정 완료:', categoryId);
        
        // 로컬 데이터도 업데이트
        const category = categoriesData.find(cat => cat.id === categoryId);
        if (category) {
            category.name = newName;
        }
        
        console.log('✅ categoriesData 업데이트:', categoriesData);
        
        // 폼 닫기
        closeCategoryEditForm();
        
        // 전체 트리 다시 렌더링
        renderCategoryTree();
        
        alert('카테고리가 수정되었습니다!');
    } catch (error) {
        console.error('❌ 카테고리 수정 오류:', error);
        alert('카테고리 수정 중 오류가 발생했습니다: ' + error.message);
    }
}

// 카테고리 삭제
async function deleteCategory(categoryId) {
    console.log('🔵 deleteCategory 호출됨, categoryId:', categoryId);
    console.log('🔵 categoriesData:', categoriesData);
    
    const categoryElement = document.querySelector(`[data-id="${categoryId}"]`);
    if (!categoryElement) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    const nameSpan = categoryElement.querySelector('.category-name');
    const categoryName = nameSpan ? nameSpan.textContent : '';
    
    console.log('🔵 삭제할 카테고리:', { categoryId, categoryName });
    
    // 하위 카테고리가 있는지 확인
    const hasChildren = categoriesData.some(cat => cat.parentId === categoryId);
    console.log('🔵 하위 카테고리 존재 여부:', hasChildren);
    
    if (hasChildren) {
        alert('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다.\n먼저 하위 카테고리를 삭제해주세요.');
        return;
    }
    
    if (!confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
        return;
    }
    
    try {
        // Firebase 초기화 확인
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error('❌ Firebase가 초기화되지 않았습니다.');
            alert('Firebase 연결 오류입니다. 페이지를 새로고침 해주세요.');
            return;
        }
        
        const db = firebase.firestore();
        
        await db.collection('categories').doc(categoryId).delete();
        
        console.log('✅ 카테고리 삭제 완료:', categoryId);
        
        // 로컬 데이터에서 제거
        const index = categoriesData.findIndex(cat => cat.id === categoryId);
        if (index > -1) {
            categoriesData.splice(index, 1);
        }
        
        console.log('✅ categoriesData 업데이트:', categoriesData);
        
        // 전체 트리 다시 렌더링
        renderCategoryTree();
        
        alert('카테고리가 삭제되었습니다!');
    } catch (error) {
        console.error('❌ 카테고리 삭제 오류:', error);
        alert('카테고리 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// 카테고리 이동 옵션 표시
function showCategoryMoveOptions(categoryId, currentLevel) {
    console.log('🔵 카테고리 이동 옵션 표시:', categoryId, '현재 레벨:', currentLevel);
    
    // 기존에 열린 이동 폼이 있으면 닫기
    const existingForm = document.querySelector('.category-move-options');
    if (existingForm) {
        existingForm.remove();
    }
    
    const categoryItem = document.querySelector(`[data-id="${categoryId}"]`);
    if (!categoryItem) return;
    
    // 이동 가능한 레벨 목록 생성
    const levels = [];
    if (currentLevel !== 1) levels.push({ level: 1, label: '1차 카테고리로 이동' });
    if (currentLevel !== 2) levels.push({ level: 2, label: '2차 카테고리로 이동' });
    if (currentLevel !== 3) levels.push({ level: 3, label: '3차 카테고리로 이동' });
    
    if (levels.length === 0) {
        alert('이동할 수 있는 레벨이 없습니다.');
        return;
    }
    
    // 이동 옵션 폼 생성
    let optionsHtml = '<div class="category-move-options">';
    optionsHtml += '<div class="move-options-header">카테고리 이동</div>';
    optionsHtml += '<div class="move-options-body">';
    
    levels.forEach(({ level, label }) => {
        optionsHtml += `
            <button class="move-option-btn" onclick="selectMoveLevel('${categoryId}', ${currentLevel}, ${level})">
                ${label}
            </button>
        `;
    });
    
    optionsHtml += `
        <button class="move-option-btn cancel" onclick="closeCategoryMoveOptions('${categoryId}')">
            취소
        </button>
    `;
    optionsHtml += '</div></div>';
    
    categoryItem.insertAdjacentHTML('afterend', optionsHtml);
}

// 카테고리 이동 옵션 닫기
function closeCategoryMoveOptions(categoryId) {
    const form = document.querySelector('.category-move-options');
    if (form) {
        form.remove();
    }
}

// 이동할 레벨 선택
async function selectMoveLevel(categoryId, currentLevel, targetLevel) {
    console.log('🔵 카테고리 레벨 이동:', categoryId, currentLevel, '->', targetLevel);
    
    const category = categoriesData.find(cat => cat.id === categoryId);
    if (!category) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    // 2차 또는 3차로 이동하는 경우 부모 카테고리 선택
    if (targetLevel > 1) {
        showParentCategorySelection(categoryId, currentLevel, targetLevel);
    } else {
        // 1차로 이동하는 경우 바로 이동
        await moveCategoryToLevel(categoryId, targetLevel, null);
    }
}

// 부모 카테고리 선택 표시
function showParentCategorySelection(categoryId, currentLevel, targetLevel) {
    console.log('🔵 부모 카테고리 선택:', categoryId, '목표 레벨:', targetLevel);
    
    // 기존 폼 닫기
    closeCategoryMoveOptions(categoryId);
    
    const categoryItem = document.querySelector(`[data-id="${categoryId}"]`);
    if (!categoryItem) return;
    
    // 선택 가능한 부모 카테고리 목록 (목표 레벨 - 1)
    const parentLevel = targetLevel - 1;
    const availableParents = categoriesData.filter(cat => cat.level === parentLevel && cat.id !== categoryId);
    
    if (availableParents.length === 0) {
        alert(`${parentLevel}차 카테고리가 없습니다. 먼저 ${parentLevel}차 카테고리를 생성해주세요.`);
        return;
    }
    
    let html = '<div class="category-move-options parent-selection">';
    html += `<div class="move-options-header">${targetLevel}차 카테고리로 이동 - 부모 선택</div>`;
    html += '<div class="move-options-body">';
    
    availableParents.forEach(parent => {
        html += `
            <button class="move-option-btn" onclick="moveCategoryToLevel('${categoryId}', ${targetLevel}, '${parent.id}')">
                ${parent.name}
            </button>
        `;
    });
    
    html += `
        <button class="move-option-btn cancel" onclick="closeCategoryMoveOptions('${categoryId}')">
            취소
        </button>
    `;
    html += '</div></div>';
    
    categoryItem.insertAdjacentHTML('afterend', html);
}

// 카테고리를 특정 레벨로 이동
async function moveCategoryToLevel(categoryId, targetLevel, parentId) {
    console.log('🔵 카테고리 이동 실행:', categoryId, '레벨:', targetLevel, '부모:', parentId);
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const db = firebase.firestore();
        
        const updateData = {
            level: targetLevel,
            parentId: parentId || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Firestore 업데이트
        await db.collection('categories').doc(categoryId).update(updateData);
        
        console.log('✅ 카테고리 레벨 이동 완료');
        
        // 로컬 데이터 업데이트
        const category = categoriesData.find(cat => cat.id === categoryId);
        if (category) {
            category.level = targetLevel;
            category.parentId = parentId || null;
        }
        
        // 이동 폼 닫기
        closeCategoryMoveOptions(categoryId);
        
        // UI 재렌더링
        renderCategoryTree();
        
        // 상품 페이지의 카테고리 목록도 업데이트
        if (typeof window.loadCategoriesForProduct === 'function') {
            await window.loadCategoriesForProduct();
        }
        
        alert(`카테고리가 ${targetLevel}차 카테고리로 이동되었습니다.`);
    } catch (error) {
        console.error('❌ 카테고리 이동 오류:', error);
        alert('카테고리 이동에 실패했습니다.');
    }
}

// 카테고리 숨김/표시 토글
async function toggleCategoryHidden(categoryId, isHidden) {
    console.log('🔵 카테고리 숨김 토글:', categoryId, isHidden);
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const db = firebase.firestore();
        
        // Firestore 업데이트
        await db.collection('categories').doc(categoryId).update({
            isHidden: isHidden,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 카테고리 숨김 상태 업데이트 완료');
        
        // 로컬 데이터 업데이트
        const category = categoriesData.find(cat => cat.id === categoryId);
        if (category) {
            category.isHidden = isHidden;
        }
        
        // UI 재렌더링
        renderCategoryTree();
        
        // 상품 페이지의 카테고리 목록도 업데이트
        if (typeof window.loadCategoriesForProduct === 'function') {
            await window.loadCategoriesForProduct();
        }
        
        alert(isHidden ? '카테고리가 숨김 처리되었습니다.' : '카테고리가 표시 처리되었습니다.');
    } catch (error) {
        console.error('❌ 카테고리 숨김 상태 업데이트 오류:', error);
        alert('카테고리 숨김 상태 업데이트에 실패했습니다.');
        
        // 체크박스 원래 상태로 복원
        const checkbox = document.querySelector(`[data-id="${categoryId}"] input[type="checkbox"]`);
        if (checkbox) {
            checkbox.checked = !isHidden;
        }
    }
}

// 전역으로 export
window.loadCategories = loadCategories;
window.toggleAddCategoryForm = toggleAddCategoryForm;
window.closeAddCategoryForm = closeAddCategoryForm;
window.saveCategoryFromForm = saveCategoryFromForm;
window.changeCategoryLevel = changeCategoryLevel;
window.closeCategoryLevelChangeForm = closeCategoryLevelChangeForm;
window.saveCategoryLevelChange = saveCategoryLevelChange;
window.editCategory = editCategory;
window.closeCategoryEditForm = closeCategoryEditForm;
window.saveCategoryEdit = saveCategoryEdit;
window.deleteCategory = deleteCategory;
window.toggleCategoryHidden = toggleCategoryHidden;
window.showCategoryMoveOptions = showCategoryMoveOptions;
window.closeCategoryMoveOptions = closeCategoryMoveOptions;
window.selectMoveLevel = selectMoveLevel;
window.showParentCategorySelection = showParentCategorySelection;
window.moveCategoryToLevel = moveCategoryToLevel;

// 페이지 로드 시 카테고리 로드
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 카테고리 관리 페이지가 활성화될 때 로드
        const observer = new MutationObserver((mutations) => {
            const categoryPage = document.getElementById('category-manage');
            if (categoryPage && categoryPage.classList.contains('active')) {
                loadCategories();
                observer.disconnect();
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
    });
}

