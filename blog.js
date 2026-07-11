(function () {
    const ANALYTICS_API = 'https://resume-blog-analytics.oxxultus.workers.dev';
    const themeButton = document.querySelector('.blog-theme');
    const menuButton = document.querySelector('.blog-menu');
    const sidebar = document.querySelector('.blog-sidebar');
    const closeButton = document.querySelector('.blog-sidebar-close');
    const historyBackButton = document.querySelector('.post-history-back');
    const shareButton = document.querySelector('[data-share-button]');
    let mermaidApi = null;
    let analyticsViewsByPath = new Map();
    let analyticsLikesByPath = new Map();

    historyBackButton?.addEventListener('click', () => {
        if (history.length > 1) history.back();
        else location.href = historyBackButton.nextElementSibling?.href || '/resume/blog/';
    });

    shareButton?.addEventListener('click', async () => {
        const label = shareButton.querySelector('[data-share-label]');
        const shareData = {
            title: document.querySelector('.article-header h1')?.textContent.trim() || document.title,
            text: document.querySelector('.article-header > p')?.textContent.trim() || '',
            url: location.href
        };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                await navigator.clipboard.writeText(location.href);
                if (label) label.textContent = '링크 복사됨';
                window.setTimeout(() => { if (label) label.textContent = '공유'; }, 1600);
            }
        } catch (error) {
            if (error?.name !== 'AbortError') console.warn('Share unavailable', error);
        }
    });

    const formatNumber = value => new Intl.NumberFormat('ko-KR').format(Number(value) || 0);

    async function loadAnalytics() {
        const isArticle = Boolean(document.querySelector('.article-body'));
        try {
            if (isArticle) {
                const response = await fetch(`${ANALYTICS_API}/api/view`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ path: location.pathname, title: document.querySelector('.article-header h1')?.textContent.trim() })
                });
                if (!response.ok) throw new Error('View request failed');
                const data = await response.json();
                const view = document.querySelector('[data-article-views]');
                if (view) view.textContent = `조회 ${formatNumber(data.views)}`;
                const likeButton = document.querySelector('[data-like-button]');
                const updateLikeButton = (likes, liked) => {
                    if (!likeButton) return;
                    likeButton.setAttribute('aria-pressed', String(liked));
                    likeButton.querySelector('i').className = `${liked ? 'fas' : 'far'} fa-heart`;
                    likeButton.querySelector('[data-like-count]').textContent = formatNumber(likes);
                };
                updateLikeButton(data.likes, data.liked);
                likeButton?.addEventListener('click', async () => {
                    likeButton.disabled = true;
                    try {
                        const likeResponse = await fetch(`${ANALYTICS_API}/api/like`, {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ path: location.pathname })
                        });
                        if (!likeResponse.ok) throw new Error('Like request failed');
                        const likeData = await likeResponse.json();
                        updateLikeButton(likeData.likes, likeData.liked);
                    } catch (error) {
                        console.warn('Like unavailable', error);
                    } finally {
                        likeButton.disabled = false;
                    }
                });
                return;
            }

            await fetch(`${ANALYTICS_API}/api/visit`, { method: 'POST' });
            const response = await fetch(`${ANALYTICS_API}/api/stats`);
            if (!response.ok) throw new Error('Stats request failed');
            const data = await response.json();
            document.querySelector('[data-total-visits]').textContent = formatNumber(data.totalVisits);
            document.querySelector('[data-today-visitors]').textContent = formatNumber(data.todayVisitors);
            document.querySelector('[data-total-views]').textContent = formatNumber(data.totalViews);

            analyticsViewsByPath = new Map(data.posts.map(post => [post.path, post.views]));
            analyticsLikesByPath = new Map(data.posts.map(post => [post.path, post.likes]));
            document.querySelectorAll('[data-post-path]').forEach(card => {
                const view = card.querySelector('[data-card-views]');
                const like = card.querySelector('[data-card-likes]');
                if (view) view.textContent = `조회 ${formatNumber(analyticsViewsByPath.get(card.dataset.postPath) || 0)}`;
                if (like) like.textContent = `좋아요 ${formatNumber(analyticsLikesByPath.get(card.dataset.postPath) || 0)}`;
            });
            document.dispatchEvent(new CustomEvent('analytics:ready'));
        } catch (error) {
            console.warn('Analytics unavailable', error);
        }
    }

    function closeMobileMenu() {
        document.body.classList.remove('menu-open');
        menuButton?.setAttribute('aria-expanded', 'false');
    }

    function setupCodeCopyButtons() {
        document.querySelectorAll('.article-body pre').forEach(pre => {
            if (pre.parentElement?.classList.contains('code-block-shell')) return;
            const code = pre.querySelector('code');
            if (!code) return;
            const shell = document.createElement('div');
            shell.className = 'code-block-shell';
            pre.before(shell);
            shell.appendChild(pre);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'code-copy-button';
            button.setAttribute('aria-label', '코드 복사');
            button.innerHTML = '<i class="far fa-copy"></i><span>복사</span>';
            button.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.textContent);
                    button.classList.add('copied');
                    button.innerHTML = '<i class="fas fa-check"></i><span>복사됨</span>';
                    window.setTimeout(() => {
                        button.classList.remove('copied');
                        button.innerHTML = '<i class="far fa-copy"></i><span>복사</span>';
                    }, 1600);
                } catch (error) {
                    button.querySelector('span').textContent = '실패';
                }
            });
            shell.appendChild(button);
        });
    }

    async function renderMermaid() {
        const codeBlocks = document.querySelectorAll('.article-body pre code.language-mermaid');
        codeBlocks.forEach(code => {
            const diagram = document.createElement('div');
            diagram.className = 'mermaid-diagram';
            diagram.dataset.source = code.textContent.trim();
            code.closest('pre').replaceWith(diagram);
        });

        const diagrams = document.querySelectorAll('.mermaid-diagram[data-source]');
        if (!diagrams.length) return;

        try {
            mermaidApi ||= (await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')).default;
            mermaidApi.initialize({
                startOnLoad: false,
                securityLevel: 'strict',
                theme: document.body.classList.contains('dark-theme') ? 'dark' : 'neutral'
            });
            diagrams.forEach(diagram => {
                diagram.removeAttribute('data-processed');
                diagram.classList.remove('mermaid-error');
                diagram.textContent = diagram.dataset.source;
            });
            await mermaidApi.run({ nodes: Array.from(diagrams), suppressErrors: true });
        } catch (error) {
            diagrams.forEach(diagram => {
                diagram.classList.add('mermaid-error');
                diagram.textContent = `다이어그램을 불러오지 못했습니다.\n\n${diagram.dataset.source}`;
            });
        }
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        localStorage.setItem('theme', theme);
        if (!themeButton) return;
        themeButton.innerHTML = `<i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
        themeButton.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
        if (document.querySelector('.mermaid-diagram')) renderMermaid();
    }

    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    renderMermaid();
    setupCodeCopyButtons();
    loadAnalytics();
    themeButton?.addEventListener('click', () => applyTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));
    menuButton?.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        menuButton.setAttribute('aria-expanded', String(open));
    });
    closeButton?.addEventListener('click', closeMobileMenu);
    document.addEventListener('click', event => {
        if (innerWidth > 800 || !document.body.classList.contains('menu-open')) return;
        if (!sidebar?.contains(event.target) && !menuButton?.contains(event.target)) closeMobileMenu();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMobileMenu();
    });
    document.querySelectorAll('.blog-nav a').forEach(link => link.addEventListener('click', () => {
        closeMobileMenu();
    }));

    const categoryTree = document.querySelector('[data-category-tree]');
    if (categoryTree) {
        const sourceLinks = Array.from(categoryTree.querySelectorAll('.category-source[data-category-path]'));
        const root = { children: new Map(), link: null };

        sourceLinks.forEach(link => {
            const parts = link.dataset.categoryPath.split('/').map(part => part.trim()).filter(Boolean);
            let node = root;
            parts.forEach(part => {
                if (!node.children.has(part)) node.children.set(part, { children: new Map(), link: null });
                node = node.children.get(part);
            });
            node.link = link;
        });

        const preferredOrder = new Map([
            ['Backend', 0], ['Spring', 0], ['Common', 0], ['MVC', 1], ['Data', 2], ['Memo', 90]
        ]);
        const sortEntries = entries => entries.sort(([nameA], [nameB]) => {
            const orderA = preferredOrder.get(nameA) ?? 50;
            const orderB = preferredOrder.get(nameB) ?? 50;
            return orderA - orderB || nameA.localeCompare(nameB, 'ko');
        });

        const categoryKey = path => path
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/\//g, '-')
            .replace(/-+/g, '-');

        let branchIndex = 0;
        const renderChildren = (node, container, depth, parentPath = '') => {
            sortEntries(Array.from(node.children.entries())).forEach(([name, child]) => {
                const currentPath = parentPath ? `${parentPath}/${name}` : name;
                if (child.children.size) {
                    branchIndex += 1;
                    const branchId = `category-branch-${branchIndex}`;
                    const folder = document.createElement('button');
                    folder.type = 'button';
                    folder.className = `category-folder category-filter${depth ? ' category-folder-child' : ''}`;
                    folder.dataset.category = categoryKey(currentPath);
                    folder.dataset.categoryPrefix = currentPath;
                    folder.setAttribute('aria-expanded', 'true');
                    folder.setAttribute('aria-controls', branchId);
                    folder.innerHTML = '<i class="fas fa-folder-open folder-icon" aria-hidden="true"></i><span></span><i class="fas fa-chevron-down folder-chevron" aria-hidden="true"></i>';
                    folder.querySelector('span').textContent = name;

                    const branch = document.createElement('div');
                    branch.id = branchId;
                    branch.className = `category-branch${depth ? ' category-branch-child' : ''}`;
                    container.append(folder, branch);
                    renderChildren(child, branch, depth + 1, currentPath);
                    return;
                }

                if (!child.link) return;
                const link = child.link;
                link.classList.remove('category-source');
                link.classList.add('category-directory');
                if (depth === 0) link.classList.add('category-root-directory');
                link.title = link.dataset.categoryPath;
                link.innerHTML = '<i class="fas fa-folder" aria-hidden="true"></i><span></span>';
                link.querySelector('span').textContent = name;
                container.append(link);
            });
        };

        const fragment = document.createDocumentFragment();
        renderChildren(root, fragment, 0);
        categoryTree.replaceChildren(fragment);
    }

    document.querySelectorAll('.category-folder[aria-controls]').forEach(folder => {
        folder.addEventListener('click', () => {
            const branch = document.getElementById(folder.getAttribute('aria-controls'));
            if (!branch) return;
            const expanded = folder.getAttribute('aria-expanded') === 'true';
            folder.setAttribute('aria-expanded', String(!expanded));
            branch.hidden = expanded;
            const icon = folder.querySelector('.folder-icon');
            icon?.classList.toggle('fa-folder-open', !expanded);
            icon?.classList.toggle('fa-folder', expanded);
        });
    });

    const categoryFilters = document.querySelectorAll('.category-filter');
    const postCards = document.querySelectorAll('.post-card[data-category]');
    const postCount = document.querySelector('.post-count');
    const postList = document.querySelector('.post-list');
    const postListTitle = document.querySelector('[data-post-list-title]');
    const hotPostLink = document.querySelector('.hot-post-link');
    const sortDropdown = document.querySelector('[data-sort-dropdown]');
    const sortTrigger = document.querySelector('[data-sort-trigger]');
    const sortLabel = document.querySelector('[data-sort-label]');
    const sortMenu = document.querySelector('[data-sort-menu]');
    const searchInput = document.querySelector('[data-post-search]');
    const pagination = document.querySelector('[data-pagination]');
    const blogHero = document.querySelector('.blog-hero');
    const blogIntro = document.querySelector('[data-blog-intro]');
    const originalPostCards = Array.from(postCards);
    if (categoryFilters.length && postCards.length) {
        const PAGE_SIZE = 5;
        let currentCategory = 'all';
        let currentVisibleCards = originalPostCards;
        let currentBaseCards = originalPostCards;
        let currentMode = 'category';
        let currentSortKey = 'latest';
        const metricFor = sortKey => sortKey === 'likes' ? analyticsLikesByPath : analyticsViewsByPath;
        const sortCards = (cards, sortKey) => {
            if (sortKey === 'latest') return [...cards];
            const metric = metricFor(sortKey);
            return [...cards].sort((cardA, cardB) => {
                const primary = (metric.get(cardB.dataset.postPath) || 0) - (metric.get(cardA.dataset.postPath) || 0);
                if (primary || sortKey !== 'likes') return primary;
                return (analyticsViewsByPath.get(cardB.dataset.postPath) || 0) - (analyticsViewsByPath.get(cardA.dataset.postPath) || 0);
            });
        };
        const closeSortMenu = () => {
            if (!sortMenu || !sortTrigger) return;
            sortMenu.hidden = true;
            sortTrigger.setAttribute('aria-expanded', 'false');
        };
        const configureSortOptions = (mode, sortKey) => {
            if (!sortMenu || !sortLabel) return;
            const options = mode === 'hot'
                ? [['views', '조회수순'], ['likes', '좋아요순']]
                : [['latest', '업로드 최신순'], ['views', '조회수순'], ['likes', '좋아요순']];
            currentSortKey = options.some(([value]) => value === sortKey) ? sortKey : options[0][0];
            sortLabel.textContent = options.find(([value]) => value === currentSortKey)?.[1] || options[0][1];
            sortMenu.replaceChildren(...options.map(([value, label]) => {
                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'sort-option';
                option.dataset.sortKey = value;
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', String(value === currentSortKey));
                option.innerHTML = `<span>${label}</span>${value === currentSortKey ? '<i class="fas fa-check" aria-hidden="true"></i>' : ''}`;
                option.addEventListener('click', () => {
                    closeSortMenu();
                    if (currentMode === 'hot') applyHotPosts(true, value);
                    else applyCategory(currentCategory, true, value);
                });
                return option;
            }));
        };
        const showPage = (cards, requestedPage, updateUrl, paginate = true) => {
            currentVisibleCards = cards;
            const totalPages = paginate ? Math.max(1, Math.ceil(cards.length / PAGE_SIZE)) : 1;
            const page = Math.min(Math.max(Number(requestedPage) || 1, 1), totalPages);
            const start = (page - 1) * PAGE_SIZE;
            const visibleOnPage = new Set(paginate ? cards.slice(start, start + PAGE_SIZE) : cards);
            originalPostCards.forEach(card => { card.hidden = !visibleOnPage.has(card); });

            if (pagination) {
                pagination.hidden = totalPages <= 1;
                pagination.replaceChildren(...Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.textContent = String(pageNumber);
                    button.setAttribute('aria-label', `${pageNumber}페이지`);
                    if (pageNumber === page) button.setAttribute('aria-current', 'page');
                    button.addEventListener('click', () => {
                        showPage(currentVisibleCards, pageNumber, true, true);
                        document.querySelector('.post-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                    return button;
                }));
            }

            if (updateUrl) {
                const url = new URL(window.location.href);
                if (page === 1) url.searchParams.delete('page');
                else url.searchParams.set('page', String(page));
                history.replaceState(null, '', `${url.pathname}${url.search}`);
            }
        };
        const applySearch = (updateUrl, requestedPage = 1) => {
            const query = searchInput?.value.trim().toLocaleLowerCase('ko') || '';
            const matchedCards = query
                ? currentBaseCards.filter(card => [
                    card.querySelector('.post-title-row h2')?.textContent,
                    card.querySelector(':scope > p')?.textContent,
                    card.querySelector('.post-tags')?.textContent,
                    card.dataset.categoryPath
                ].filter(Boolean).join(' ').toLocaleLowerCase('ko').includes(query))
                : currentBaseCards;
            if (postCount) {
                const label = currentMode === 'hot' ? 'hot post' : 'post';
                postCount.textContent = `${matchedCards.length} ${label}${matchedCards.length === 1 ? '' : 's'}`;
            }
            if (updateUrl) {
                const url = new URL(window.location.href);
                if (query) url.searchParams.set('q', query);
                else url.searchParams.delete('q');
                history.replaceState(null, '', `${url.pathname}${url.search}`);
            }
            showPage(matchedCards, requestedPage, updateUrl, currentMode !== 'hot');
        };
        const applyHotPosts = (updateUrl, sortKey = 'views') => {
            if (blogIntro) blogIntro.hidden = true;
            blogHero?.classList.add('is-filtered');
            const metric = sortKey === 'likes' ? analyticsLikesByPath : analyticsViewsByPath;
            const candidates = sortKey === 'likes'
                ? originalPostCards
                : originalPostCards.filter(card => (metric.get(card.dataset.postPath) || 0) > 0);
            const ranked = sortCards(
                candidates,
                sortKey
            ).slice(0, 7);
            currentMode = 'hot';
            currentBaseCards = ranked;
            const rankedSet = new Set(ranked);
            postList?.append(...ranked, ...originalPostCards.filter(card => !rankedSet.has(card)));
            categoryFilters.forEach(filter => {
                filter.classList.remove('active');
                filter.removeAttribute('aria-current');
            });
            hotPostLink?.classList.add('active');
            hotPostLink?.setAttribute('aria-current', 'page');
            configureSortOptions('hot', sortKey);
            if (postListTitle) postListTitle.textContent = '인기글';
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.searchParams.delete('category');
                url.searchParams.set('view', 'hot');
                url.searchParams.set('sort', sortKey);
                history.replaceState(null, '', `${url.pathname}${url.search}`);
            }
            applySearch(updateUrl, 1);
        };

        const applyCategory = (category, updateUrl, sortKey = 'latest') => {
            hotPostLink?.classList.remove('active');
            hotPostLink?.removeAttribute('aria-current');
            if (postListTitle) postListTitle.textContent = '최근 기록';
            const selectedFilter = Array.from(categoryFilters).find(filter => filter.dataset.category === category);
            const validCategory = selectedFilter ? category : 'all';
            if (blogIntro) blogIntro.hidden = validCategory !== 'all';
            blogHero?.classList.toggle('is-filtered', validCategory !== 'all');
            currentCategory = validCategory;
            currentMode = 'category';
            const selectedPath = selectedFilter?.dataset.categoryPrefix || selectedFilter?.dataset.categoryPath || '';
            const includeDescendants = Boolean(selectedFilter?.dataset.categoryPrefix);
            const visibleCards = originalPostCards.filter(card => {
                const cardPath = card.dataset.categoryPath || '';
                return validCategory === 'all'
                    || (includeDescendants
                        ? cardPath === selectedPath || cardPath.startsWith(`${selectedPath}/`)
                        : card.dataset.category === validCategory);
            });
            const visibleSet = new Set(visibleCards);
            const sortedCards = sortCards(visibleCards, sortKey);
            currentBaseCards = sortedCards;
            postList?.append(...sortedCards, ...originalPostCards.filter(card => !visibleSet.has(card)));
            categoryFilters.forEach(filter => {
                const active = filter.dataset.category === validCategory;
                filter.classList.toggle('active', active);
                if (active) filter.setAttribute('aria-current', 'page');
                else filter.removeAttribute('aria-current');
            });
            configureSortOptions('category', sortKey);

            if (updateUrl) {
                const url = new URL(window.location.href);
                url.searchParams.delete('view');
                if (sortKey === 'latest') url.searchParams.delete('sort');
                else url.searchParams.set('sort', sortKey);
                if (validCategory === 'all') url.searchParams.delete('category');
                else url.searchParams.set('category', validCategory);
                history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
            }
            const requestedPage = updateUrl ? 1 : new URLSearchParams(window.location.search).get('page');
            applySearch(updateUrl, requestedPage);
        };

        categoryFilters.forEach(filter => filter.addEventListener('click', event => {
            event.preventDefault();
            if (searchInput) searchInput.value = '';
            applyCategory(filter.dataset.category, true, currentSortKey);
        }));
        hotPostLink?.addEventListener('click', event => {
            event.preventDefault();
            applyHotPosts(true, 'views');
            closeMobileMenu();
        });
        sortTrigger?.addEventListener('click', () => {
            const open = sortMenu?.hidden ?? true;
            if (sortMenu) sortMenu.hidden = !open;
            sortTrigger.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', event => {
            if (!sortDropdown?.contains(event.target)) closeSortMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeSortMenu();
        });
        searchInput?.addEventListener('input', () => applySearch(true, 1));
        document.addEventListener('analytics:ready', () => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('view') === 'hot') applyHotPosts(false, params.get('sort') === 'likes' ? 'likes' : 'views');
            else applyCategory(params.get('category') || 'all', false, ['views', 'likes'].includes(params.get('sort')) ? params.get('sort') : 'latest');
        });
        const initialParams = new URLSearchParams(window.location.search);
        if (searchInput) searchInput.value = initialParams.get('q') || '';
        if (initialParams.get('view') === 'hot') applyHotPosts(false, initialParams.get('sort') === 'likes' ? 'likes' : 'views');
        else applyCategory(initialParams.get('category') || 'all', false, ['views', 'likes'].includes(initialParams.get('sort')) ? initialParams.get('sort') : 'latest');
    }

    const toc = document.querySelector('.post-toc');
    const articleHeadings = document.querySelectorAll('.article-body h2, .article-body h3');
    if (toc && articleHeadings.length) {
        let parentSectionId = null;
        articleHeadings.forEach((heading, index) => {
            const generatedId = heading.textContent.trim()
                .toLowerCase()
                .replace(/[^a-z0-9가-힣\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            heading.id = heading.id || generatedId || `section-${index + 1}`;

            if (heading.tagName === 'H2') parentSectionId = heading.id;

            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.className = heading.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
            link.dataset.parentSection = heading.tagName === 'H3' ? parentSectionId : heading.id;
            const hasChildren = heading.tagName === 'H2' && articleHeadings[index + 1]?.tagName === 'H3';
            link.innerHTML = heading.tagName === 'H3'
                ? `<span class="toc-child-marker" aria-hidden="true"></span><span>${heading.textContent.trim()}</span>`
                : `<i class="fas fa-bookmark"></i><span>${heading.textContent.trim()}</span>${hasChildren ? '<i class="fas fa-chevron-right toc-toggle" aria-hidden="true"></i>' : ''}`;
            if (hasChildren) link.setAttribute('aria-expanded', 'false');
            toc.appendChild(link);
        });

        const tocLinks = toc.querySelectorAll('a[href^="#"]');
        const sectionLinks = toc.querySelectorAll('.toc-h2');
        const childLinks = toc.querySelectorAll('.toc-h3');
        sectionLinks.forEach(link => {
            const hasChildren = Array.from(childLinks).some(child => child.dataset.parentSection === link.dataset.parentSection);
            link.classList.toggle('has-children', hasChildren);
        });
        const openSection = sectionId => {
            sectionLinks.forEach(link => {
                const expanded = link.dataset.parentSection === sectionId;
                link.classList.toggle('expanded', expanded);
                if (link.classList.contains('has-children')) link.setAttribute('aria-expanded', String(expanded));
            });
            childLinks.forEach(link => {
                const visible = link.dataset.parentSection === sectionId;
                link.classList.toggle('is-visible', visible);
                link.setAttribute('aria-hidden', String(!visible));
                link.tabIndex = visible ? 0 : -1;
            });
        };

        const parentForHeading = heading => {
            if (!heading || heading.tagName === 'H2') return heading?.id || null;
            let previous = heading.previousElementSibling;
            while (previous && previous.tagName !== 'H2') previous = previous.previousElementSibling;
            return previous?.id || null;
        };

        let lockedLink = null;
        let scrollEndTimer = null;
        const releaseScrollLock = () => {
            lockedLink = null;
            scrollEndTimer = null;
            syncToc();
        };

        const moveToHeading = (link, updateHistory = true, behavior = 'smooth') => {
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (!target) return;
            lockedLink = link;
            clearTimeout(scrollEndTimer);
            openSection(link.dataset.parentSection || null);
            tocLinks.forEach(item => item.classList.toggle('active', item === link));
            target.scrollIntoView({ behavior, block: 'start' });
            if (updateHistory) history.pushState(null, '', `#${targetId}`);
            scrollEndTimer = setTimeout(releaseScrollLock, behavior === 'smooth' ? 700 : 80);
        };

        const syncToc = () => {
            if (lockedLink) return;
            const topbarHeight = document.querySelector('.blog-topbar')?.offsetHeight || 66;
            const marker = window.scrollY + topbarHeight + 32;
            let activeId = 'article-top';
            let activeHeading = null;
            articleHeadings.forEach(heading => {
                if (heading.offsetTop <= marker) {
                    activeId = heading.id;
                    activeHeading = heading;
                }
            });
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) {
                activeHeading = articleHeadings[articleHeadings.length - 1];
                activeId = activeHeading.id;
            }
            openSection(parentForHeading(activeHeading));
            tocLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`));
        };

        let tocFrame = null;
        window.addEventListener('scroll', () => {
            if (lockedLink) {
                clearTimeout(scrollEndTimer);
                scrollEndTimer = setTimeout(releaseScrollLock, 140);
                return;
            }
            if (tocFrame) return;
            tocFrame = requestAnimationFrame(() => {
                syncToc();
                tocFrame = null;
            });
        }, { passive: true });
        tocLinks.forEach(link => link.addEventListener('click', event => {
            event.preventDefault();
            moveToHeading(link);
        }));

        const initialHash = decodeURIComponent(window.location.hash.slice(1));
        const initialLink = Array.from(tocLinks).find(link => link.getAttribute('href') === `#${initialHash}`);
        if (initialLink) requestAnimationFrame(() => moveToHeading(initialLink, false, 'auto'));
        else syncToc();
    }
})();
