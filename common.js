// 前衛小説報告書 - 共通JavaScript (v17改 - Native Scroll Delegation)

document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Management ---

    // スクロール復元はブラウザに任せる
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
    }

    /**
     * ページ全体のインタラクティブ機能を初期化するメイン関数
     */
    const initializePage = () => {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        const allNavItems = document.querySelectorAll('.nav-menu > .nav-item');
        const drillDownPanel = document.createElement('div');
        drillDownPanel.id = 'drillDownPanel';
        drillDownPanel.className = 'drilldown-panel';
        document.body.appendChild(drillDownPanel);

        // ドリルダウンパネル内のアンカーリンククリックでメニューを閉じる
        drillDownPanel.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href')?.includes('#')) {
                updateMenuState(null);
                // preventDefaultはしないので、ページ内スクロールは実行される
            }
        });

        function updateMenuState(state) {
            document.body.classList.remove('menu-l1-visible', 'menu-l2-visible', 'no-scroll');
            if (state) {
                document.body.classList.add(state);
                document.body.classList.add('no-scroll');
            }
        }

        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = document.body.classList.contains('menu-l1-visible') || document.body.classList.contains('menu-l2-visible');
                const icon = menuToggle.querySelector('i');
                if (isVisible) {
                    updateMenuState(null);
                    menuToggle.classList.remove('active');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-compass');
                } else {
                    updateMenuState('menu-l1-visible');
                    menuToggle.classList.add('active');
                    icon.classList.remove('fa-compass');
                    icon.classList.add('fa-times');
                }
            });
        }

        allNavItems.forEach(item => {
            const navLink = item.querySelector('.nav-link.dropdown-toggle'); // ドロップダウンのトグルリンクを直接取得
            if (navLink) { // ドロップダウンのトグルリンクが存在する場合のみ処理
                navLink.addEventListener('click', (e) => { // <a>タグに直接イベントリスナーを付与
                    if (window.innerWidth > 768) return; // PC表示では何もしない

                    // モバイルのドロップダウンリンクがクリックされた場合、デフォルトのページ遷移を完全に阻止
                    e.preventDefault();
                    e.stopPropagation(); // イベントの伝播も停止

                    const submenu = item.querySelector('.dropdown-menu');
                    const title = navLink.textContent.trim();
                    const titleLink = navLink.getAttribute('href');
                    const iconHTML = navLink.querySelector('i')?.outerHTML || '';
                    let listItems = '';
                    submenu.querySelectorAll('a').forEach(link => { listItems += `<li>${link.outerHTML}</li>`; });
                    drillDownPanel.innerHTML = `
                        <div class="drilldown-header">
                            <button class="drilldown-back"><i class="fas fa-arrow-left"></i> 戻る</button>
                            <a href="${titleLink}" class="drilldown-title">${iconHTML} ${title}</a>
                        </div>
                        <div class="drilldown-content"><ul>${listItems}</ul></div>
                    `;
                    updateMenuState('menu-l2-visible');
                    drillDownPanel.querySelector('.drilldown-back').addEventListener('click', () => updateMenuState('menu-l1-visible'));
                    // モバイルメニューの表示/非表示をJavaScriptで制御
                    if (submenu.style.display === 'flex') {
                        submenu.style.display = 'none';
                    } else {
                        submenu.style.display = 'flex';
                    }
                });
            }
            // ドロップダウンではないナビゲーション項目については、
            // ページ遷移アニメーションを管理する共通のイベントリスナーが処理します。
            // ここで別途処理を追加する必要はありません。
        });

        // モバイルメニューのドロップダウンを初期状態で非表示にする
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.nav-menu .dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }

        // ウィンドウのリサイズ時にモバイルメニューの表示状態をリセット
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.querySelectorAll('.nav-menu .dropdown-menu').forEach(menu => {
                    menu.style.display = ''; // デスクトップではCSSに任せる
                });
            } else {
                document.querySelectorAll('.nav-menu .dropdown-menu').forEach(menu => {
                    menu.style.display = 'none'; // モバイルでは非表示に
                });
            }
        });

        // 【重要】アンカーリンクのイベントリスナーを簡略化
        document.querySelectorAll('a[href*="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                // e.preventDefault() を削除し、ブラウザのネイティブなハッシュ移動を許可する
                // メニューを閉じる動作のみ行う
                if (document.body.classList.contains('menu-l1-visible') || document.body.classList.contains('menu-l2-visible')) {
                    updateMenuState(null);
                }
            });
        });

        const scrollTop = document.getElementById('scrollTop');
        const progressBar = document.getElementById('progressBar');
        if (scrollTop && progressBar) {
            window.addEventListener('scroll', () => {
                scrollTop.classList.toggle('show', window.pageYOffset > 300);
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight > 0) {
                    const progress = (window.pageYOffset / docHeight) * 100;
                    progressBar.style.width = progress + '%';
                }
            });
            scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }

        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
            if (link.getAttribute('href').split('/').pop() === currentPage) {
                link.classList.add('active');
                link.closest('.dropdown')?.querySelector('.dropdown-toggle')?.classList.add('active');
            }
        });
        
        // setupBookstoreLinks は変更なし
        // ... (省略)
        setupBookstoreLinks();
        setupFontSizeToggle(); // 文字サイズ変更機能を呼び出し
    };

    const setupFontSizeToggle = () => {
        const toggleButton = document.getElementById('font-size-toggle');
        if (!toggleButton) return;
        const tooltip = toggleButton.querySelector('.tooltip');
        const FONT_SIZE_KEY = 'avantlit-font-size';
        const LARGE_CLASS = 'font-large';

        // UIと状態を更新する関数
        const updateState = (isLarge) => {
            document.body.classList.toggle(LARGE_CLASS, isLarge);
            toggleButton.classList.toggle('font-toggle-active', isLarge); // CSSクラスでスタイルを制御
            if (tooltip) {
                tooltip.textContent = isLarge ? '元に戻す' : '文字を拡大';
            }
        };

        // ページ読み込み時にlocalStorageから設定を復元
        try {
            const currentSetting = localStorage.getItem(FONT_SIZE_KEY);
            const isInitiallyLarge = currentSetting === 'large';
            updateState(isInitiallyLarge);
        } catch (e) {
            console.error('Failed to access localStorage:', e);
        }


        // ボタンクリック時の処理
        toggleButton.addEventListener('click', () => {
            const isCurrentlyLarge = document.body.classList.contains(LARGE_CLASS);
            const newIsLarge = !isCurrentlyLarge;

            updateState(newIsLarge);

            // localStorageに設定を保存
            try {
                if (newIsLarge) {
                    localStorage.setItem(FONT_SIZE_KEY, 'large');
                } else {
                    localStorage.removeItem(FONT_SIZE_KEY);
                }
            } catch (e) {
                console.error('Failed to access localStorage:', e);
            }
            toggleButton.blur(); // クリック後にフォーカスを解除
        });
    };
    
    /**
     * 購入リンクのインタラクションをセットアップする関数
     */
    const setupBookstoreLinks = () => {
        const bookListItems = document.querySelectorAll('.book-list > li');

        bookListItems.forEach(item => {
            const title = item.querySelector('.book-title');
            const menu = item.querySelector('.bookstore-menu');

            if (!title || !menu) return;

            // PC: アイコンにマウスを乗せたらメニュー表示
            if (window.innerWidth > 768) {
                const wrapper = document.createElement('div');
                wrapper.className = 'bookstore-wrapper';

                const cartIcon = document.createElement('button');
                cartIcon.className = 'bookstore-trigger';
                cartIcon.innerHTML = '<i class="fas fa-shopping-cart"></i>';

                wrapper.appendChild(cartIcon);
                wrapper.appendChild(menu);
                item.appendChild(wrapper);

                let closeTimer;

                wrapper.addEventListener('mouseenter', () => {
                    clearTimeout(closeTimer);
                    menu.classList.add('open');
                    wrapper.classList.add('wrapper-active');
                });

                wrapper.addEventListener('mouseleave', () => {
                    closeTimer = setTimeout(() => {
                        menu.classList.remove('open');
                        wrapper.classList.remove('wrapper-active');
                    }, 100); // 100msの遅延
                });
            } 
            // Mobile: 書籍名をタップしたらメニュー表示
            else {
                title.addEventListener('click', (e) => {
                    e.preventDefault();
                    item.classList.toggle('open');
                    menu.classList.toggle('open');
                });
            }
        });

        // ページ全体でクリックイベントを監視し、メニュー外をクリックしたら閉じる
        document.addEventListener('click', (e) => {
            const openItem = document.querySelector('.book-list > li.open');
            if (openItem && !openItem.contains(e.target)) {
                openItem.classList.remove('open');
                openItem.querySelector('.bookstore-menu').classList.remove('open');
            }
        });
    };


    /**
     * ページの初期化処理を実行するエントリーポイント
     */
    const bootstrap = () => {
        initializePage();

        // ページのちらつき防止クラスを削除
        document.body.classList.remove('is-loading');

        // 少し遅延させてから表示アニメーションを開始
        setTimeout(() => {
            document.querySelectorAll('.content-wrapper, .hero').forEach(el => {
                el.classList.add('is-visible');
            });
        }, 50); // 50msの遅延で描画の安定性を確保
    };

    bootstrap();

    // Page Transition: Handle internal link clicks
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        // Skip if it's not a valid, navigable link
        if (!href) {
            return;
        }
        const isExternal = (link.hostname !== window.location.hostname) && href.startsWith('http');
        const isAnchor = href.startsWith('#');
        const isNewTab = link.getAttribute('target') === '_blank';

            const isDropdownToggle = link.classList.contains('dropdown-toggle');
        
            if (!isExternal && !isAnchor && !isNewTab && !isDropdownToggle) {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    // Start fade-out animation for current page
                    document.body.classList.add('is-leaving');
                    // Wait for animation to finish, then navigate
                    setTimeout(() => {
                        window.location.href = href;
                    }, 400); // Must match body's CSS transition duration
                });
            }    });
});
