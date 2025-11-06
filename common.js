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
                const text = menuToggle.querySelector('.menu-toggle-text');

                if (isVisible) {
                    updateMenuState(null);
                    menuToggle.classList.remove('active');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-compass');
                    if (text) text.textContent = 'メニュー';
                } else {
                    updateMenuState('menu-l1-visible');
                    menuToggle.classList.add('active');
                    icon.classList.remove('fa-compass');
                    icon.classList.add('fa-times');
                    if (text) text.textContent = '閉じる';
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
        setupFontSizeToggle(); // アイコンの色変更機能を呼び出し
        initializeFontSizeController(); // 文字サイズ変更機能を呼び出し
        initializeManualSmoothScroll(); // 手動スムーズスクロール機能を初期化
        initializeSearch(); // 検索機能を初期化
        highlightSearchTerm(); // 検索キーワードのハイライト処理を呼び出し
        scrollToAnchorOnLoad(); // ★ 新しく追加：アンカーへのスクロール処理を呼び出し
    };

    /**
     * URLパラメータから検索キーワードを取得し、ページ内の該当箇所をハイライトする
     */
    const highlightSearchTerm = () => {
        const params = new URLSearchParams(window.location.search);
        const term = params.get('highlight');
        if (!term) return;

        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) return;

        const regex = new RegExp(term, 'gi');
        
        // TreeWalkerを使って安全にテキストノードを探索
        const walker = document.createTreeWalker(
            contentWrapper,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        const nodesToReplace = [];
        while (node = walker.nextNode()) {
            // スクリプトやスタイルタグの中は無視
            if (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE') {
                continue;
            }
            if (regex.test(node.nodeValue)) {
                nodesToReplace.push(node);
            }
        }

        // マッチしたノードを<mark>タグを含むDOMフラグメントに置換
        nodesToReplace.forEach(node => {
            const parent = node.parentNode;
            if (!parent) return;

            const fragment = document.createDocumentFragment();
            const parts = node.nodeValue.split(regex);
            const matches = node.nodeValue.match(regex);

            parts.forEach((part, index) => {
                if (part) {
                    fragment.appendChild(document.createTextNode(part));
                }
                if (matches && index < matches.length) {
                    const mark = document.createElement('mark');
                    mark.textContent = matches[index];
                    fragment.appendChild(mark);
                }
            });
            parent.replaceChild(fragment, node);
        });
    };

    /**
     * ページ読み込み時にURLのアンカー（ハッシュ）へスクロールする
     */
    const scrollToAnchorOnLoad = () => {
        const hash = window.location.hash;
        if (!hash) return;

        // highlight処理によるDOM変更を待つために少し遅延させる
        setTimeout(() => {
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                const header = document.querySelector('.navbar');
                const headerHeight = header ? header.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 10; // 10pxの追加マージン

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100); // 100msの遅延でDOMの安定を待つ
    };

    /**
     * 検索機能を初期化する
     */
    const initializeSearch = () => {
        // 検索対象のページリスト
        const pagesToIndex = [
            'index.html',
            'part1.html',
            'part2.html',
            'part3.html',
            'part4.html',
            'part5.html',
            'part6.html',
            'chronology.html',
            'glossary.html',
            'references.html'
        ];

        let searchIndex = [];
        let isIndexReady = false;

        // 検索インデックスを非同期で作成
        const createSearchIndex = async () => {
            try {
                const fetchPromises = pagesToIndex.map(async (url) => {
                    const response = await fetch(url);
                    if (!response.ok) return [];
                    const html = await response.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const contentWrapper = doc.querySelector('.content-wrapper');
                    if (!contentWrapper) return [];

                    const pageTitle = (doc.querySelector('title')?.textContent || '')
                        .replace(/\| 前衛小説ガイドブック/g, '').replace(/前衛小説ガイドブック \|/g, '').trim();
                    
                    const sections = [];
                    const headings = contentWrapper.querySelectorAll('h2, h3');

                    headings.forEach((heading, index) => {
                        const id = heading.id;
                        if (!id) return; // idがない見出しはスキップ

                        let content = ''; // 空の文字列から始める
                        let nextElement = heading.nextElementSibling;

                        while (nextElement && !nextElement.matches('h2, h3')) {
                            content += ' ' + nextElement.textContent.trim();
                            nextElement = nextElement.nextElementSibling;
                        }

                        // サブタイトル（<small>タグ）を除外したタイトルを取得
                        const titleElement = heading.cloneNode(true);
                        const smallTag = titleElement.querySelector('small');
                        if (smallTag) {
                            smallTag.remove();
                        }
                        const cleanTitle = titleElement.textContent.trim();

                        sections.push({
                            url: `${url}#${id}`,
                            title: cleanTitle, // サブタイトルを除外したタイトルを使用
                            content: content.trim(),
                            tag: heading.tagName.toLowerCase()
                        });
                    });
                    
                    // ページ全体のコンテンツもインデックスに追加（見出しがないページや、見出し前のコンテンツ用）
                    // ただし、タイトルはページタイトルのみとする
                    sections.push({
                        url: url,
                        title: pageTitle,
                        content: contentWrapper.textContent.trim(),
                        tag: 'page' // ページ全体を示すタグ
                    });

                    return sections;
                });

                const results = await Promise.all(fetchPromises);
                searchIndex = results.flat();
                isIndexReady = true;
            } catch (error) {
                console.error('Failed to create search index:', error);
            }
        };

        // 検索を実行して結果を返す
        const performSearch = (query) => {
            if (!isIndexReady || !query) {
                return [];
            }

            const lowerCaseQuery = query.toLowerCase();
            const queryRegex = new RegExp(query, 'gi');
            const addedUrls = new Set();

            const executeSearch = (sections) => {
                const results = [];
                sections.forEach(section => {
                    if (addedUrls.has(section.url)) return;

                    const titleIndex = section.title.toLowerCase().indexOf(lowerCaseQuery);
                    const contentIndex = section.content.toLowerCase().indexOf(lowerCaseQuery);

                    if (titleIndex > -1 || contentIndex > -1) {
                        let snippet = '';
                        const snippetLength = 100;
                        let bestIndex = contentIndex > -1 ? contentIndex : section.content.toLowerCase().indexOf(section.title.toLowerCase());
                        if (contentIndex > -1) { bestIndex = contentIndex; }
                        
                        const start = Math.max(0, bestIndex - snippetLength / 2);
                        snippet = section.content.substring(start, start + snippetLength);

                        const highlightedSnippet = snippet.replace(queryRegex, (match) => `<em>${match}</em>`);
                        const highlightedTitle = section.title.replace(queryRegex, (match) => `<em>${match}</em>`);

                        // URLにハイライト用の検索クエリを追加
                        let finalUrl = section.url;
                        const highlightParam = `?highlight=${encodeURIComponent(query)}`;
                        if (finalUrl.includes('#')) {
                            finalUrl = finalUrl.replace('#', `${highlightParam}#`);
                        } else {
                            finalUrl += highlightParam;
                        }

                        results.push({
                            url: finalUrl,
                            title: highlightedTitle,
                            snippet: `...${highlightedSnippet}...`
                        });
                        addedUrls.add(section.url);
                    }
                });
                return results;
            };

            const priorityGroup = searchIndex.filter(s => s.url.includes('part3.html') && s.tag === 'h2');
            const otherGroup = searchIndex.filter(s => !(s.url.includes('part3.html') && s.tag === 'h2'));

            const priorityResults = executeSearch(priorityGroup);
            const otherResults = executeSearch(otherGroup);

            return [...priorityResults, ...otherResults];
        };

        // 検索結果をUIにレンダリング
        const renderResults = (results, resultContainer) => {
            const ul = resultContainer.querySelector('ul');
            ul.innerHTML = '';

            if (results.length === 0) {
                ul.innerHTML = '<li class="no-results">検索結果が見つかりませんでした。</li>';
                return;
            }

            results.slice(0, 10).forEach(result => { // 最大10件まで表示
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="${result.url}">
                        <div class="result-title">${result.title}</div>
                        <div class="result-snippet">${result.snippet}</div>
                    </a>
                `;
                ul.appendChild(li);
            });
        };

        // --- UI Element Hooks ---
        const searchContainer = document.querySelector('.search-container');
        const searchIconBtn = document.getElementById('search-icon-btn');
        const searchInput = document.getElementById('search-input');
        const searchCloseBtn = document.getElementById('search-close-btn');
        const searchResultsDropdown = document.getElementById('search-results-dropdown');
        
        const mobileSearchIconBtn = document.getElementById('mobile-search-icon-btn'); // モバイル専用検索アイコン
        const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const mobileSearchCancelBtn = document.getElementById('mobile-search-cancel-btn');
        const mobileSearchResults = document.querySelector('.mobile-search-results');

        // --- Event Listeners ---
        if (searchIconBtn) {
            searchIconBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                searchContainer.classList.toggle('active');
                if (searchContainer.classList.contains('active')) {
                    searchInput.focus();
                }
            });
        }
        
        if(mobileSearchIconBtn) {
            mobileSearchIconBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.body.classList.add('mobile-search-active');
                mobileSearchInput.focus();
            });
        }

        if (searchCloseBtn) {
            searchCloseBtn.addEventListener('click', () => {
                searchContainer.classList.remove('active');
                searchInput.value = '';
                renderResults([], searchResultsDropdown);
            });
        }

        if (mobileSearchCancelBtn) {
            mobileSearchCancelBtn.addEventListener('click', () => {
                document.body.classList.remove('mobile-search-active');
                mobileSearchInput.value = '';
                renderResults([], mobileSearchResults);
            });
        }

        const handleSearchInput = (query, container) => {
            const results = performSearch(query);
            renderResults(results, container);
        };

        if (searchInput) {
            searchInput.addEventListener('input', () => handleSearchInput(searchInput.value, searchResultsDropdown));
        }

        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', () => handleSearchInput(mobileSearchInput.value, mobileSearchResults));
        }

        document.addEventListener('click', (e) => {
            if (searchContainer && !searchContainer.contains(e.target)) {
                searchContainer.classList.remove('active');
            }
        });

        createSearchIndex();
    };


    /**
     * 手動でのスムーズスクロール機能を初期化する
     */
    const initializeManualSmoothScroll = () => {
        document.querySelectorAll('a[href*="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                const currentUrl = new URL(window.location.href);
                const targetUrl = new URL(href, currentUrl.origin + currentUrl.pathname);

                // リンクが現在のページ内のアンカーを指している場合のみ処理
                if (targetUrl.pathname === currentUrl.pathname && targetUrl.hash) {
                    e.preventDefault(); // ブラウザのデフォルトのジャンプ動作をキャンセル

                    const targetElement = document.querySelector(targetUrl.hash);
                    if (targetElement) {
                        const header = document.querySelector('.navbar');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 10; // 10pxの追加マージン

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });

                        // URLのハッシュを手動で更新
                        history.pushState(null, '', targetUrl.hash);
                    }
                }
            });
        });
    };

    const setupFontSizeToggle = () => {
        const toggleButton = document.getElementById('font-size-toggle');
        if (!toggleButton) return;
        const tooltip = toggleButton.querySelector('.tooltip');

        // CSS変数から直接色を取得
        const rootStyles = getComputedStyle(document.documentElement);
        const defaultColor = rootStyles.getPropertyValue('--white').trim();
        const activeColor = rootStyles.getPropertyValue('--accent-color').trim();

        // 状態をJS内で管理
        let isToggleActive = false;

        // 初期状態を設定
        toggleButton.style.color = defaultColor;
        if (tooltip) tooltip.textContent = '文字を拡大';

        // ボタンがクリックされたときの処理（スタイルを直接変更）
        toggleButton.addEventListener('click', () => {
            isToggleActive = !isToggleActive; // 状態を反転

            if (isToggleActive) {
                toggleButton.style.color = activeColor;
                if (tooltip) tooltip.textContent = '元に戻す';
            } else {
                toggleButton.style.color = defaultColor;
                if (tooltip) tooltip.textContent = '文字を拡大';
            }
        });
    };

    /**
     * 文字サイズ変更機能を初期化する（アイコンの見た目とは完全に分離）
     */
    const initializeFontSizeController = () => {
        const toggleButton = document.getElementById('font-size-toggle');
        if (!toggleButton) return;

        const FONT_SIZE_KEY = 'avantlit-font-size';
        const LARGE_CLASS = 'font-large';

        // UI（本文のクラス）を更新する関数
        const updateFontSize = (isLarge) => {
            document.body.classList.toggle(LARGE_CLASS, isLarge);
        };

        // ページ読み込み時にlocalStorageから設定を復元
        try {
            const currentSetting = localStorage.getItem(FONT_SIZE_KEY);
            updateFontSize(currentSetting === 'large');
        } catch (e) {
            console.error('Failed to access localStorage:', e);
        }

        // ボタンクリック時の処理
        toggleButton.addEventListener('click', () => {
            const isCurrentlyLarge = document.body.classList.contains(LARGE_CLASS);
            const newIsLarge = !isCurrentlyLarge;

            updateFontSize(newIsLarge);

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
        });
    };
    
    /**
     * 購入リンクのインタラクションをセットアップする関数
     */
    const setupBookstoreLinks = () => {
        const backdrop = document.getElementById('bottom-sheet-backdrop');
        const sheet = document.getElementById('bottom-sheet');

        if (!backdrop || !sheet) return;

        document.querySelectorAll('.book-list .book-item').forEach(item => {
            const title = item.querySelector('.book-title');
            if (!title) return;

            title.addEventListener('click', (e) => {
                if (window.innerWidth > 768) return; // PCでは何もしない

                e.preventDefault();
                e.stopPropagation();

                const links = item.querySelectorAll('.store-link');
                const bookTitle = title.textContent;

                let linksHTML = '';
                links.forEach(link => {
                    linksHTML += link.outerHTML;
                });

                sheet.innerHTML = `
                    <div class="bottom-sheet-header">
                        <span class="bottom-sheet-title">${bookTitle}</span>
                        <button id="bottom-sheet-close">&times;</button>
                    </div>
                    <div class="bottom-sheet-content">
                        ${linksHTML}
                    </div>
                `;

                backdrop.classList.add('open');
                sheet.classList.add('open');

                document.getElementById('bottom-sheet-close').addEventListener('click', closeSheet);
            });
        });

        const closeSheet = () => {
            backdrop.classList.remove('open');
            sheet.classList.remove('open');
        };

        backdrop.addEventListener('click', closeSheet);
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
        const isAnchor = href.includes('#');
        const isNewTab = link.getAttribute('target') === '_blank';

            const isDropdownToggle = link.classList.contains('dropdown-toggle');
        
            if (!isExternal && !isNewTab && !isDropdownToggle && !isAnchor) { // isAnchorがtrueの場合はこのイベントリスナーをスキップ
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
