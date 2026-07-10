(function () {
    const themeButton = document.querySelector('.blog-theme');
    const menuButton = document.querySelector('.blog-menu');
    let mermaidApi = null;

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
    themeButton?.addEventListener('click', () => applyTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));
    menuButton?.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        menuButton.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.blog-nav a').forEach(link => link.addEventListener('click', () => {
        document.body.classList.remove('menu-open');
        menuButton?.setAttribute('aria-expanded', 'false');
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
            ['Backend', 0], ['Spring', 0], ['Common', 0], ['MVC', 1], ['Data', 2], ['Learning', 90]
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
    if (categoryFilters.length && postCards.length) {
        const applyCategory = (category, updateUrl) => {
            const selectedFilter = Array.from(categoryFilters).find(filter => filter.dataset.category === category);
            const validCategory = selectedFilter ? category : 'all';
            const selectedPath = selectedFilter?.dataset.categoryPrefix || selectedFilter?.dataset.categoryPath || '';
            const includeDescendants = Boolean(selectedFilter?.dataset.categoryPrefix);
            let visibleCount = 0;

            postCards.forEach(card => {
                const cardPath = card.dataset.categoryPath || '';
                const visible = validCategory === 'all'
                    || (includeDescendants
                        ? cardPath === selectedPath || cardPath.startsWith(`${selectedPath}/`)
                        : card.dataset.category === validCategory);
                card.hidden = !visible;
                if (visible) visibleCount += 1;
            });
            categoryFilters.forEach(filter => {
                const active = filter.dataset.category === validCategory;
                filter.classList.toggle('active', active);
                if (active) filter.setAttribute('aria-current', 'page');
                else filter.removeAttribute('aria-current');
            });
            if (postCount) postCount.textContent = `${visibleCount} post${visibleCount === 1 ? '' : 's'}`;

            if (updateUrl) {
                const url = new URL(window.location.href);
                if (validCategory === 'all') url.searchParams.delete('category');
                else url.searchParams.set('category', validCategory);
                history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
            }
        };

        categoryFilters.forEach(filter => filter.addEventListener('click', event => {
            event.preventDefault();
            applyCategory(filter.dataset.category, true);
        }));
        applyCategory(new URLSearchParams(window.location.search).get('category') || 'all', false);
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
