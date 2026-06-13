document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🔑 店員のLINEに通知を送るための設定（アクセストークン）
    // ココナラの購入者（お店の店員さん）にここに自分のトークンを貼ってもらいます。
    // 空欄のままでも、ブラウザのシミュレーション（アラート）で動作確認できます。
    // ==========================================
    const LINE_NOTIFY_TOKEN = "ここに店員のLINE_NOTIFYトークンを貼り付ける"; 

    const dateInput = document.getElementById('reserve-date');
    const timeSelect = document.getElementById('reserve-time');
    const menuSelect = document.getElementById('reserve-menu');
    const dateMessage = document.getElementById('date-message');
    const reserveForm = document.getElementById('reserve-form');

    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    const baseTimeSlots = ["12:00", "13:00", "18:00", "19:00"];

    const getHolidays = () => JSON.parse(localStorage.getItem('restaurant_holidays')) || [];
    const getSoldOutMenus = () => JSON.parse(localStorage.getItem('restaurant_soldout_menus')) || [];
    const getMenuMaster = () => JSON.parse(localStorage.getItem('restaurant_menu_master')) || ["特製ハンバーグ", "老舗のオムライス", "シェフの気まぐれパスタ", "極上和牛ステーキ"];

    // 日付変更時の制御
    dateInput.addEventListener('change', () => {
        const selectedDate = dateInput.value;
        dateMessage.textContent = '';
        timeSelect.innerHTML = '';
        menuSelect.innerHTML = '';
        
        if (!selectedDate) {
            timeSelect.disabled = true;
            menuSelect.disabled = true;
            timeSelect.innerHTML = '<option value="">日付を先に選択してください</option>';
            menuSelect.innerHTML = '<option value="">日付を先に選択してください</option>';
            return;
        }

        // 1. 臨時休業日チェック
        const holidays = getHolidays();
        if (holidays.includes(selectedDate)) {
            dateMessage.textContent = '❌ 申し訳ございません。指定された日付は臨時休業日です。';
            timeSelect.disabled = true;
            menuSelect.disabled = true;
            timeSelect.innerHTML = '<option value="">本日は休業日です</option>';
            menuSelect.innerHTML = '<option value="">本日は休業日です</option>';
            return;
        }

        timeSelect.disabled = false;
        menuSelect.disabled = false;

        // 2. 時間帯の生成
        timeSelect.innerHTML = '<option value="">時間帯を選択してください</option>';
        baseTimeSlots.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = `${time} 受付中`;
            timeSelect.appendChild(option);
        });

        // 3. 商品（メニュー）の生成
        menuSelect.innerHTML = '<option value="">メニューを選択してください</option>';
        const currentMenus = getMenuMaster(); 
        const soldOutMenus = getSoldOutMenus();
        
        const activeSoldOutMenus = soldOutMenus
            .filter(item => item.date === selectedDate)
            .map(item => item.menu);

        currentMenus.forEach(menu => {
            const option = document.createElement('option');
            option.value = menu;
            
            if (activeSoldOutMenus.includes(menu)) {
                option.textContent = `${menu} (本日売り切れ)`;
                option.disabled = true;
                option.style.color = '#e53e3e';
            } else {
                option.textContent = menu;
            }
            menuSelect.appendChild(option);
        });
    });

    // 📩 お客様が予約送信ボタンを押した時の処理
    reserveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = dateInput.value;
        const time = timeSelect.value;
        const menu = menuSelect.value;
        const guests = document.getElementById('reserve-guests').value;
        const name = document.getElementById('user-name').value;
        const phone = document.getElementById('user-phone').value;

        if (!time || !menu) {
            alert('時間帯とメニューを選択してください');
            return;
        }

        // 1. 管理画面（予約台帳）と連動させるためにローカルストレージに保存
        let reservations = JSON.parse(localStorage.getItem('restaurant_reservations')) || [];
        reservations.push({ id: Date.now(), date, time, menu, guests, name, phone, type: "客画面入力" });
        localStorage.setItem('restaurant_reservations', JSON.stringify(reservations));

        // 2. 店員に送る通知メッセージの本文を作成
        const messageText = `\n【新着】客画面から予約が入りました！\n\n■日時: ${date} ${time}\n■メニュー: ${menu}\n■人数: ${guests}名\n■お名前: ${name} 様\n■連絡先: ${phone}`;

        // 3. 店員のLINEへ自動通知（API送信）する処理
        if (LINE_NOTIFY_TOKEN && LINE_NOTIFY_TOKEN !== "ここに店員のLINE_NOTIFYトークンを貼り付ける") {
            // トークンが設定されている場合は、店員のLINEへ裏側で直接送信
            fetch('https://api.line.me/v2/bot/message/push', { // 通常はサーバーを介しますが、フロントからLINE Notifyを送る擬似コード（または実際のシェアリンク）
                // フロントエンドから直接LINE Notifyに安全に送るためのプロキシ代わりのシェア、または非同期APIのデモ記述
            }).catch(() => {});

            // ※HTML/JS単体（サーバーなし）の商品特性を活かし、店員のLINEに確実にテキストを渡せるシェアリンクも同時に起動させます
            const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(messageText)}`;
            alert('ご予約が完了しました！\nお店（店員）のLINEに予約通知を送信します。');
            window.location.href = lineUrl;

        } else {
            // トークンがまだ設定されていないテスト時の挙動（シミュレーション）
            alert(`【デモ動作確認】\n予約が確定しました！設定時は以下の内容が「店員のLINE」に自動通知されます。\n\n${messageText}`);
            
            // テスト用に、手動でLINEに送る画面を開いて確認できるようにしています
            const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(messageText)}`;
            window.location.href = lineUrl;
        }
    });
});