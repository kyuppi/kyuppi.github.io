const ADMIN_PASSWORD = "admin123"; 

const loginSection = document.getElementById('login-section');
const managementSection = document.getElementById('management-section');
const passwordInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('btn-login');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('btn-logout');

loginBtn.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showManagementPage();
    } else {
        loginError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    location.reload();
});

if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    showManagementPage();
}

function showManagementPage() {
    loginSection.style.display = 'none';
    managementSection.style.display = 'block';
    
    renderMenuMaster();    // メニューマスタの描画 ★追加
    renderReservations();   // 予約台帳の描画
    renderHolidays();       // 休業日の描画
    renderSoldOuts();       // 売り切れ設定の描画
}


// --- 🍔 メニュー（商品）自体の編集ロジック（マスタ管理） ★新規 ---
const newMenuInput = document.getElementById('new-menu-name');
const addMenuBtn = document.getElementById('btn-add-menu');
const menuListUI = document.getElementById('admin-menu-list');
const adminResMenuSelect = document.getElementById('admin-res-menu');
const soldoutMenuSelect = document.getElementById('soldout-item-name');

// 初めて使う時のための初期メニュー（サンプルデータ）
const defaultMenus = ["特製ハンバーグ", "老舗のオムライス", "シェフの気まぐれパスタ", "極上和牛ステーキ"];
let menuMaster = JSON.parse(localStorage.getItem('restaurant_menu_master')) || defaultMenus;

addMenuBtn.addEventListener('click', () => {
    const menuName = newMenuInput.value.trim();
    if (!menuName) return alert('メニュー名を入力してください');
    
    if (!menuMaster.includes(menuName)) {
        menuMaster.push(menuName);
        localStorage.setItem('restaurant_menu_master', JSON.stringify(menuMaster));
        renderMenuMaster();
        newMenuInput.value = '';
    } else {
        alert('そのメニューは既に登録されています');
    }
});

// 管理画面内のメニュー一覧と、各セレクトボックスの選択肢を更新
function renderMenuMaster() {
    menuListUI.innerHTML = '';
    adminResMenuSelect.innerHTML = '';
    soldoutMenuSelect.innerHTML = '';

    if (menuMaster.length === 0) {
        menuListUI.innerHTML = '<li style="color:#a0aec0; justify-content:center;">登録メニューがありません。追加してください。</li>';
        return;
    }

    menuMaster.forEach(menu => {
        // 1. 管理画面の一覧に追加
        const li = document.createElement('li');
        li.innerHTML = `<span>${menu}</span> <button class="btn-delete" onclick="deleteMenuMaster('${menu}')">削除</button>`;
        menuListUI.appendChild(li);

        // 2. 「店員の代理予約フォーム」の選択肢に追加
        const opt1 = document.createElement('option');
        opt1.value = menu; opt1.textContent = menu;
        adminResMenuSelect.appendChild(opt1);

        // 3. 「売り切れ設定フォーム」の選択肢に追加
        const opt2 = document.createElement('option');
        opt2.value = menu; opt2.textContent = menu;
        soldoutMenuSelect.appendChild(opt2);
    });
}

// メニューそのものを削除する関数
window.deleteMenuMaster = function(menuName) {
    if(!confirm(`メニュー「${menuName}」自体を削除しますか？\n（予約フォームからも消えます）`)) return;
    menuMaster = menuMaster.filter(m => m !== menuName);
    localStorage.setItem('restaurant_menu_master', JSON.stringify(menuMaster));
    renderMenuMaster();
};


// --- 📞 店員用・直接予約登録ロジック ---
const adminReserveForm = document.getElementById('admin-reserve-form');
adminReserveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('admin-res-date').value;
    const time = document.getElementById('admin-res-time').value;
    const menu = adminResMenuSelect.value;
    const guests = document.getElementById('admin-res-guests').value;
    const name = document.getElementById('admin-res-name').value;
    const phone = document.getElementById('admin-res-phone').value;

    if (!menu) return alert('メニューが登録されていません');

    let reservations = JSON.parse(localStorage.getItem('restaurant_reservations')) || [];
    reservations.push({ id: Date.now(), date, time, menu, guests, name, phone, type: "店員入力" });
    localStorage.setItem('restaurant_reservations', JSON.stringify(reservations));

    alert('予約を登録しました！');
    adminReserveForm.reset();
    renderReservations();
});


// --- 📋 予約一覧（台帳）の表示・削除ロジック ---
const reservationListUI = document.getElementById('admin-reservation-list');
function renderReservations() {
    reservationListUI.innerHTML = '';
    let reservations = JSON.parse(localStorage.getItem('restaurant_reservations')) || [];
    if (reservations.length === 0) {
        reservationListUI.innerHTML = '<li style="color:#a0aec0; justify-content:center;">入っている予約はありません</li>';
        return;
    }
    reservations.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    reservations.forEach(res => {
        const li = document.createElement('li');
        li.style.flexDirection = 'column'; li.style.alignItems = 'flex-start'; li.style.position = 'relative';
        li.innerHTML = `
            <div style="font-weight: bold; color: #2b6cb0; font-size: 11px;">[${res.type || '客画面入力'}]</div>
            <div><strong>日時:</strong> ${res.date} ${res.time} (${res.guests}名)</div>
            <div><strong>商品:</strong> ${res.menu}</div>
            <div><strong>顧客:</strong> ${res.name} 様 (${res.phone})</div>
            <button class="btn-delete" onclick="deleteReservation(${res.id})" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%);">削除</button>
        `;
        reservationListUI.appendChild(li);
    });
}
window.deleteReservation = function(id) {
    if (!confirm('この予約を削除しますか？')) return;
    let reservations = JSON.parse(localStorage.getItem('restaurant_reservations')) || [];
    reservations = reservations.filter(res => res.id !== id);
    localStorage.setItem('restaurant_reservations', JSON.stringify(reservations));
    renderReservations();
};


// --- 📅 臨時休業日管理 ---
const holidayDateInput = document.getElementById('holiday-date');
const addHolidayBtn = document.getElementById('btn-add-holiday');
const holidayListUI = document.getElementById('holiday-list');
let holidays = JSON.parse(localStorage.getItem('restaurant_holidays')) || [];

addHolidayBtn.addEventListener('click', () => {
    const date = holidayDateInput.value;
    if (!date) return alert('日付を選択してください');
    if (!holidays.includes(date)) {
        holidays.push(date);
        localStorage.setItem('restaurant_holidays', JSON.stringify(holidays));
        renderHolidays();
        holidayDateInput.value = '';
    }
});
function renderHolidays() {
    holidayListUI.innerHTML = '';
    if (holidays.length === 0) {
        holidayListUI.innerHTML = '<li style="color:#a0aec0; justify-content:center;">登録された休業日はありません</li>';
        return;
    }
    holidays.sort().forEach(date => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${date}</span> <button class="btn-delete" onclick="deleteHoliday('${date}')">削除</button>`;
        holidayListUI.appendChild(li);
    });
}
window.deleteHoliday = function(date) {
    holidays = holidays.filter(h => h !== date);
    localStorage.setItem('restaurant_holidays', JSON.stringify(holidays));
    renderHolidays();
};


// --- ❌ 商品の売り切れ設定 ---
const soldoutDateInput = document.getElementById('soldout-date');
const addSoldoutBtn = document.getElementById('btn-add-soldout');
const soldoutListUI = document.getElementById('soldout-list');
let soldOutMenus = JSON.parse(localStorage.getItem('restaurant_soldout_menus')) || [];

addSoldoutBtn.addEventListener('click', () => {
    const date = soldoutDateInput.value;
    const menu = soldoutMenuSelect.value;
    if (!date || !menu) return alert('日付と商品を選択してください');

    const isExist = soldOutMenus.some(item => item.date === date && item.menu === menu);
    if (!isExist) {
        soldOutMenus.push({ date, menu });
        localStorage.setItem('restaurant_soldout_menus', JSON.stringify(soldOutMenus));
        renderSoldOuts();
        soldoutDateInput.value = '';
    } else {
        alert('その商品は既に売り切れ登録されています');
    }
});
function renderSoldOuts() {
    soldoutListUI.innerHTML = '';
    if (soldOutMenus.length === 0) {
        soldoutListUI.innerHTML = '<li style="color:#a0aec0; justify-content:center;">売り切れ登録された商品はありません</li>';
        return;
    }
    soldOutMenus.sort((a,b) => a.date.localeCompare(b.date) || a.menu.localeCompare(b.menu));
    soldOutMenus.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.date} 【${item.menu}】</span> <button class="btn-delete" onclick="deleteSoldOut(${index})">削除</button>`;
        soldoutListUI.appendChild(li);
    });
}
window.deleteSoldOut = function(index) {
    soldOutMenus.splice(index, 1);
    localStorage.setItem('restaurant_soldout_menus', JSON.stringify(soldOutMenus));
    renderSoldOuts();
};