// 前衛小説報告書 - 共通JavaScript (v17.1 - Final Stable)

document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Management ---
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

        // --- Menu State Machine ---
        function updateMenuState(state) {
            document.body.classList.remove('menu-l1-visible', 'menu-l2-visible', 'no-scroll');
            if (state) {
                document.body.classList.add(state, 'no-scroll');
            }
            // Toggle button state
            const isVisible = !!state;
            const icon = menuToggle.querySelector('i');
            const text = menuToggle.querySelector('.menu-toggle-text');
            menuToggle.classList.toggle('active', isVisible);
            if (icon) {
                icon.classList.toggle('fa-times', isVisible);
                icon.classList.toggle('fa-compass', !isVisible);
            }
            if (text) text.textContent = isVisible ? '閉じる' : 'メニュー';
        }

        // --- Event Listeners ---
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = document.body.classList.contains('menu-l1-visible') || document.body.classList.contains('menu-l2-visible');
                updateMenuState(isVisible ? null : 'menu-l1-visible');
            });
        }

        allNavItems.forEach(item => {
            const navLink = item.querySelector('.nav-link.dropdown-toggle');
            if (navLink) {
                navLink.addEventListener('click', (e) => {
                    if (window.innerWidth > 768) return;
                    e.preventDefault();
                    e.stopPropagation();

                    // クリックされたリンクの隣の要素(.dropdown-menu)を直接取得
                    const submenu = navLink.nextElementSibling;

                    // 対応するドロップダウンがなければ何もしない
                    if (!submenu || !submenu.classList.contains('dropdown-menu')) {
                        window.location.href = navLink.href; // 通常のリンクとして遷移
                        return;
                    }

                    const title = navLink.textContent.trim();
                    const titleLink = navLink.getAttribute('href');
                    const iconHTML = navLink.querySelector('i')?.outerHTML || '';
                    
                    let listItems = '';
                    // submenuが存在し、それが.dropdown-menuであることを確認
                    if (submenu && submenu.classList.contains('dropdown-menu')) {
                        submenu.querySelectorAll('a.dropdown-item').forEach(link => {
                            listItems += `<li><a href="${link.href}" class="drilldown-item">${link.innerHTML}</a></li>`;
                        });
                    }

                    drillDownPanel.innerHTML = `
                        <div class="drilldown-header">
                            <button class="drilldown-back"><i class="fas fa-arrow-left"></i> 戻る</button>
                            <a href="${titleLink}" class="drilldown-title">${iconHTML} ${title}</a>
                        </div>
                        <div class="drilldown-content"><ul>${listItems}</ul></div>
                    `;
                    updateMenuState('menu-l2-visible');
                    
                    drillDownPanel.querySelector('.drilldown-back').addEventListener('click', () => updateMenuState('menu-l1-visible'));
                });
            }
        });

        // Close menu on any main content click
        document.querySelector('main').addEventListener('click', () => {
            if (document.body.classList.contains('menu-l1-visible') || document.body.classList.contains('menu-l2-visible')) {
                updateMenuState(null);
            }
        });

        // Close menu on anchor link click inside drilldown
        drillDownPanel.addEventListener('click', (e) => {
            if (e.target.closest('a[href*="#"]')) {
                updateMenuState(null);
            }
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
        
        setupBookstoreLinks();
        setupFontSizeToggle();
        initializeFontSizeController();
        initializeManualSmoothScroll();
        initializeSearch();
        highlightSearchTerm();
        scrollToAnchorOnLoad();
    };

    const highlightSearchTerm = () => {
        const params = new URLSearchParams(window.location.search);
        const term = params.get('highlight');
        if (!term) return;

        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) return;

        const regex = new RegExp(term, 'gi');
        const walker = document.createTreeWalker(contentWrapper, NodeFilter.SHOW_TEXT, null, false);

        let node;
        const nodesToReplace = [];
        while (node = walker.nextNode()) {
            if (node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE' && regex.test(node.nodeValue)) {
                nodesToReplace.push(node);
            }
        }

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

    const scrollToAnchorOnLoad = () => {
        const hash = window.location.hash;
        if (!hash) return;

        setTimeout(() => {
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                const header = document.querySelector('.navbar');
                const headerHeight = header ? header.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 10;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 650);
    };

    const initializeSearch = () => {
        const pagesToIndex = ['index.html', 'part1.html', 'part2.html', 'part3.html', 'part4.html', 'part5.html', 'part6.html', 'chronology.html', 'glossary.html', 'references.html'];
        let searchIndex = [];
        let isIndexReady = false;

        const createSearchIndex = async () => {
            try {
                const fetchPromises = pagesToIndex.map(async (url) => {
                    const response = await fetch(url);
                    if (!response.ok) return [];
                    const html = await response.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const contentWrapper = doc.querySelector('.content-wrapper');
                    if (!contentWrapper) return [];

                    const pageTitle = (doc.querySelector('title')?.textContent || '').replace(/\| 前衛小説ガイドブック/g, '').replace(/前衛小説ガイドブック \|/g, '').trim();
                    const sections = [];
                    const headings = contentWrapper.querySelectorAll('h2, h3');

                    headings.forEach((heading) => {
                        const id = heading.id;
                        if (!id) return;

                        let content = '';
                        let nextElement = heading.nextElementSibling;
                        while (nextElement && !nextElement.matches('h2, h3')) {
                            content += ' ' + nextElement.textContent.trim();
                            nextElement = nextElement.nextElementSibling;
                        }

                        const titleElement = heading.cloneNode(true);
                        const smallTag = titleElement.querySelector('small');
                        if (smallTag) smallTag.remove();
                        const cleanTitle = titleElement.textContent.trim();

                        sections.push({ url: `${url}#${id}`, title: cleanTitle, content: content.trim(), tag: heading.tagName.toLowerCase() });
                    });
                    
                    sections.push({ url: url, title: pageTitle, content: contentWrapper.textContent.trim(), tag: 'page' });
                    return sections;
                });

                const results = await Promise.all(fetchPromises);
                searchIndex = results.flat();
                isIndexReady = true;
            } catch (error) {
                console.error('Failed to create search index:', error);
            }
        };

        const performSearch = (query) => {
            if (!isIndexReady || !query) return [];

            const lowerCaseQuery = query.toLowerCase();
            const queryRegex = new RegExp(query, 'gi');
            const addedUrls = new Set();

            const executeSearch = (sections) => {
                const results = [];
                sections.forEach(section => {
                    if (addedUrls.has(section.url)) return;

                    if (section.title.toLowerCase().includes(lowerCaseQuery) || section.content.toLowerCase().includes(lowerCaseQuery)) {
                        let snippet = '';
                        const contentIndex = section.content.toLowerCase().indexOf(lowerCaseQuery);
                        const start = Math.max(0, contentIndex - 50);
                        snippet = section.content.substring(start, start + 100);

                        const highlightedSnippet = snippet.replace(queryRegex, (match) => `<em>${match}</em>`);
                        const highlightedTitle = section.title.replace(queryRegex, (match) => `<em>${match}</em>`);

                        let finalUrl = section.url;
                        const highlightParam = `?highlight=${encodeURIComponent(query)}`;
                        finalUrl = finalUrl.includes('#') ? finalUrl.replace('#', `${highlightParam}#`) : finalUrl + highlightParam;

                        results.push({ url: finalUrl, title: highlightedTitle, snippet: `...${highlightedSnippet}...` });
                        addedUrls.add(section.url);
                    }
                });
                return results;
            };

            const priorityGroup = searchIndex.filter(s => s.url.includes('part3.html') && s.tag === 'h2');
            const otherGroup = searchIndex.filter(s => !(s.url.includes('part3.html') && s.tag === 'h2'));

            return [...executeSearch(priorityGroup), ...executeSearch(otherGroup)];
        };

        const renderResults = (results, resultContainer) => {
            const ul = resultContainer.querySelector('ul');
            ul.innerHTML = results.length === 0
                ? '<li class="no-results">検索結果が見つかりませんでした。</li>'
                : results.slice(0, 10).map(result => `
                    <li>
                        <a href="${result.url}">
                            <div class="result-title">${result.title}</div>
                            <div class="result-snippet">${result.snippet}</div>
                        </a>
                    </li>
                `).join('');
        };

        const searchContainer = document.querySelector('.search-container');
        const searchIconBtn = document.getElementById('search-icon-btn');
        const searchInput = document.getElementById('search-input');
        const searchCloseBtn = document.getElementById('search-close-btn');
        const searchResultsDropdown = document.getElementById('search-results-dropdown');
        const mobileSearchIconBtn = document.getElementById('mobile-search-icon-btn');
        const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const mobileSearchCancelBtn = document.getElementById('mobile-search-cancel-btn');
        const mobileSearchResults = document.querySelector('.mobile-search-results');

        if (searchIconBtn) {
            searchIconBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                searchContainer.classList.toggle('active');
                if (searchContainer.classList.contains('active')) searchInput.focus();
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

        const handleSearchInput = (query, container) => renderResults(performSearch(query), container);
        if (searchInput) searchInput.addEventListener('input', () => handleSearchInput(searchInput.value, searchResultsDropdown));
        if (mobileSearchInput) mobileSearchInput.addEventListener('input', () => handleSearchInput(mobileSearchInput.value, mobileSearchResults));
        document.addEventListener('click', (e) => {
            if (searchContainer && !searchContainer.contains(e.target)) searchContainer.classList.remove('active');
        });

        createSearchIndex();
    };

    const initializeManualSmoothScroll = () => {
        document.querySelectorAll('a[href*="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                const currentUrl = new URL(window.location.href);
                const targetUrl = new URL(href, currentUrl.origin + currentUrl.pathname);

                if (targetUrl.pathname === currentUrl.pathname && targetUrl.hash) {
                    e.preventDefault();
                    const targetElement = document.querySelector(targetUrl.hash);
                    if (targetElement) {
                        const header = document.querySelector('.navbar');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 10;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
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
        const rootStyles = getComputedStyle(document.documentElement);
        const defaultColor = rootStyles.getPropertyValue('--white').trim();
        const activeColor = rootStyles.getPropertyValue('--accent-color').trim();
        let isToggleActive = false;
        toggleButton.style.color = defaultColor;
        if (tooltip) tooltip.textContent = '文字を拡大';
        toggleButton.addEventListener('click', () => {
            isToggleActive = !isToggleActive;
            toggleButton.style.color = isToggleActive ? activeColor : defaultColor;
            if (tooltip) tooltip.textContent = isToggleActive ? '元に戻す' : '文字を拡大';
        });
    };

    const initializeFontSizeController = () => {
        const toggleButton = document.getElementById('font-size-toggle');
        if (!toggleButton) return;
        const FONT_SIZE_KEY = 'avantlit-font-size';
        const LARGE_CLASS = 'font-large';
        const updateFontSize = (isLarge) => document.body.classList.toggle(LARGE_CLASS, isLarge);
        try {
            updateFontSize(localStorage.getItem(FONT_SIZE_KEY) === 'large');
        } catch (e) { console.error('Failed to access localStorage:', e); }
        toggleButton.addEventListener('click', () => {
            const newIsLarge = !document.body.classList.contains(LARGE_CLASS);
            updateFontSize(newIsLarge);
            try {
                if (newIsLarge) localStorage.setItem(FONT_SIZE_KEY, 'large');
                else localStorage.removeItem(FONT_SIZE_KEY);
            } catch (e) { console.error('Failed to access localStorage:', e); }
        });
    };
    
    const setupBookstoreLinks = () => {
        const backdrop = document.getElementById('bottom-sheet-backdrop');
        const sheet = document.getElementById('bottom-sheet');
        if (!backdrop || !sheet) return;

        document.querySelectorAll('.book-list .book-item').forEach(item => {
            const title = item.querySelector('.book-title');
            if (!title) return;
            title.addEventListener('click', (e) => {
                if (window.innerWidth > 768) return;
                e.preventDefault();
                e.stopPropagation();
                const links = item.querySelectorAll('.store-link');
                let linksHTML = '';
                links.forEach(link => { linksHTML += link.outerHTML; });
                sheet.innerHTML = `
                    <div class="bottom-sheet-header">
                        <span class="bottom-sheet-title">${title.textContent}</span>
                        <button id="bottom-sheet-close">&times;</button>
                    </div>
                    <div class="bottom-sheet-content">${linksHTML}</div>
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

    const bootstrap = () => {
        initializePage();
        document.body.classList.remove('is-loading');
        setTimeout(() => {
            document.querySelectorAll('.content-wrapper, .hero').forEach(el => el.classList.add('is-visible'));
        }, 50);
        initializeReportIssueButton(); // 新しい関数を呼び出す
    };

    bootstrap();

    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const isExternal = (link.hostname !== window.location.hostname) && href.startsWith('http');
        const isAnchor = href.includes('#');
        const isNewTab = link.getAttribute('target') === '_blank';
        const isDropdownToggle = link.classList.contains('dropdown-toggle');
        
        if (!isExternal && !isNewTab && !isDropdownToggle && !isAnchor) {
            link.addEventListener('click', e => {
                e.preventDefault();
                document.body.classList.add('is-leaving');
                setTimeout(() => { window.location.href = href; }, 400);
            });
        }
    });
});

// ========================================== 
// 問題報告フォームのJavaScript
// ========================================== 

document.addEventListener('DOMContentLoaded', () => {
    const reportIssueBtn = document.getElementById('reportIssueBtn');
    const issueReportModal = document.getElementById('issueReportModal');
    const closeIssueModal = document.getElementById('closeIssueModal');
    const issueReportForm = document.getElementById('issueReportForm');
    const selectedTextarea = document.getElementById('selectedText');
    const pageUrlInput = document.getElementById('pageUrl');
    const formMessage = document.getElementById('formMessage');

    // 問題報告ボタンの初期化と初回訪問時のガイド表示
    const initializeReportIssueButton = () => {
        if (!reportIssueBtn) return;

        // ボタンにテキストラベルを追加
        reportIssueBtn.innerHTML = '<i class="fas fa-exclamation-triangle no-margin"></i> <span>文章の問題を報告</span><span class="tooltip">お気づきの点があれば、ここからお知らせください</span>';

        const HAS_VISITED_KEY = 'avantlit-first-visit';
        if (!localStorage.getItem(HAS_VISITED_KEY)) {
            // 初回訪問時のみガイドを表示
            reportIssueBtn.classList.add('guide-active');
            setTimeout(() => {
                reportIssueBtn.classList.remove('guide-active');
                localStorage.setItem(HAS_VISITED_KEY, 'true');
            }, 8000); // 8秒後にガイドを非表示にする
        }
    };

    // モーダルを開く関数
    const openModal = () => {
        issueReportModal.classList.add('active');
        document.body.classList.add('no-scroll'); // 背景のスクロールを禁止
        pageUrlInput.value = window.location.href; // 現在のURLをセット

        // 選択中のテキストがあればフォームにセット
        const selection = window.getSelection().toString().trim();
        if (selection) {
            selectedTextarea.value = selection;
        } else {
            selectedTextarea.value = '（テキスト選択なし）';
        }
    };

    // モーダルを閉じる関数
    const closeModal = () => {
        issueReportModal.classList.remove('active');
        document.body.classList.remove('no-scroll'); // 背景のスクロールを許可
        issueReportForm.reset(); // フォームをリセット
        formMessage.style.display = 'none'; // メッセージを非表示に
    };

    // ボタンクリックでモーダルを開く
    if (reportIssueBtn) {
        reportIssueBtn.addEventListener('click', openModal);
    }

    // 閉じるボタンでモーダルを閉じる
    if (closeIssueModal) {
        closeIssueModal.addEventListener('click', closeModal);
    }

    // モーダルの外側をクリックで閉じる
    if (issueReportModal) {
        issueReportModal.addEventListener('click', (e) => {
            if (e.target === issueReportModal) {
                closeModal();
            }
        });
    }

    // フォーム送信処理
    if (issueReportForm) {
            issueReportForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = e.target.querySelector('.submit-btn');
                const formMessage = e.target.querySelector('.form-message');

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 送信中...';
                formMessage.style.display = 'none';

                const data = {
                    selectedText: document.getElementById('selectedText').value,
                    correctionDetails: document.getElementById('correctionDetails').value,
                    userName: document.getElementById('userName').value || '匿名',
                    pageUrl: window.location.href,
                };

                try {
                const response = await fetch('https://eocq6rlyhmbt2bq.m.pipedream.net', {
                    method: 'POST',
                    mode: 'cors', // CORSモードを明示的に指定
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                    if (response.ok) { // ステータスコードが200-299の範囲なら成功とみなす
                        formMessage.textContent = '修正提案が正常に送信されました。ご協力ありがとうございます！';
                        formMessage.className = 'form-message success';
                        issueReportForm.reset();
                        document.getElementById('selectedText').value = ''; // 隠しフィールドもリセット
                        setTimeout(() => {
                            issueReportModal.classList.remove('active');
                        }, 3000);
                    } else {
                        // エラーレスポンスがJSON形式の場合、そのメッセージを優先的に表示
                        try {
                            const errorData = await response.json();
                            formMessage.textContent = `エラーが発生しました: ${errorData.message || 'サーバーからの応答が不正です。'}`;
                        } catch (e) {
                            formMessage.textContent = `サーバーエラーが発生しました (ステータス: ${response.status})。`;
                        }
                        formMessage.className = 'form-message error';
                    }
                } catch (error) {
                    console.error('Error submitting form:', error);
                    formMessage.textContent = '送信中にエラーが発生しました。ネットワーク接続をご確認ください。';
                    formMessage.className = 'form-message error';
                } finally {
                    formMessage.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> 送信';
                }
            });
    }
});