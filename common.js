// 前衛小説報告書 - 共通JavaScript (v17改 - Native Scroll Delegation)

document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Management ---

    // スクロール復元はブラウザに任せる
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
    }

    /**
     * 共通コンポーネント（HTML）を非同期で読み込み、指定されたIDの要素に挿入する関数
     */
    const loadComponent = async (url, placeholderId) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            const data = await response.text();
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.outerHTML = data;
            }
        } catch (error) {
            console.error(`Error loading component from ${url}:`, error);
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.innerHTML = `<p style="color: red;">Error: ${url} could not be loaded.</p>`;
            }
        }
    };

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
            item.addEventListener('click', (e) => {
                if (window.innerWidth > 768) return;
                if (item.classList.contains('dropdown')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const submenu = item.querySelector('.dropdown-menu');
                    const navLink = item.querySelector('.nav-link');
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
                    drillDownPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setTimeout(() => updateMenuState(null), 300)));
                } else {
                    setTimeout(() => updateMenuState(null), 300);
                }
            });
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
    const bootstrap = async () => {
        await Promise.all([
            loadComponent('_header.html', 'header-placeholder'),
            loadComponent('_footer.html', 'footer-placeholder')
        ]);
        
        initializePage();

        // 【重要】'load'イベントではなく、確実に実行されるsetTimeoutでローディングを解除
        setTimeout(() => {
            document.body.classList.remove('is-loading');
        }, 100); // 100ms後に実行
    };

    bootstrap();
});