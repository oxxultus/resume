(() => {
    const body = document.body;
    const themeButton = document.querySelector('.neural-theme');
    const menuButton = document.querySelector('.neural-menu');
    const closeButton = document.querySelector('.neural-sidebar-close');
    const canvas = document.querySelector('[data-neural-canvas]');
    const status = document.querySelector('[data-neural-status]');
    const count = document.querySelector('[data-neural-count]');
    const reset = document.querySelector('[data-neural-reset]');
    const backButton = document.querySelector('[data-neural-back]');

    const setTheme = dark => {
        body.classList.toggle('dark-theme', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        themeButton.innerHTML = `<i class="fas fa-${dark ? 'sun' : 'moon'}"></i>`;
        themeButton.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
    };
    setTheme(localStorage.getItem('theme') === 'dark');
    themeButton.addEventListener('click', () => setTheme(!body.classList.contains('dark-theme')));

    const closeMenu = () => { body.classList.remove('menu-open'); menuButton.setAttribute('aria-expanded', 'false'); };
    menuButton.addEventListener('click', () => {
        const open = body.classList.toggle('menu-open');
        menuButton.setAttribute('aria-expanded', String(open));
    });
    closeButton.addEventListener('click', closeMenu);
    backButton.addEventListener('click', () => {
        if (document.referrer && new URL(document.referrer).origin === location.origin) history.back();
        else location.href = '../';
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

    const parts = category => String(category || 'Uncategorized').split('/').map(value => value.trim()).filter(Boolean);
    const commonDepth = (left, right) => {
        const a = parts(left.category);
        const b = parts(right.category);
        let depth = 0;
        while (depth < Math.min(a.length, b.length) && a[depth].toLowerCase() === b[depth].toLowerCase()) depth += 1;
        return depth;
    };
    const clusterKey = post => parts(post.category)[0] || 'Uncategorized';
    const colorIndex = key => [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8;

    const render = posts => {
        if (!window.d3) throw new Error('그래프 라이브러리를 불러오지 못했습니다.');
        const nodes = posts.map((post, index) => ({ ...post, id: post.path, cluster: clusterKey(post), color: colorIndex(clusterKey(post)), index }));
        const links = [];
        for (let i = 0; i < nodes.length; i += 1) {
            for (let j = i + 1; j < nodes.length; j += 1) {
                const depth = commonDepth(nodes[i], nodes[j]);
                if (depth > 0) links.push({ source: nodes[i].id, target: nodes[j].id, depth, exact: nodes[i].category === nodes[j].category });
            }
        }
        count.textContent = `${nodes.length} posts · ${links.length} connections`;
        status.hidden = true;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const ring = Math.min(width, height) * .3;
        nodes.forEach((nodeItem, index) => {
            const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
            nodeItem.x = width / 2 + Math.cos(angle) * ring;
            nodeItem.y = height / 2 + Math.sin(angle) * ring;
        });
        const svg = d3.select(canvas).append('svg').attr('viewBox', [0, 0, width, height]).attr('role', 'img').attr('aria-label', '카테고리 기반 게시글 연결 그래프');
        const stage = svg.append('g');
        const zoom = d3.zoom().scaleExtent([.55, 4]).wheelDelta(event => -event.deltaY * (event.deltaMode ? .035 : .0015)).on('zoom', event => {
            stage.attr('transform', event.transform);
            svg.classed('show-labels', event.transform.k >= 1.45);
        });
        svg.call(zoom);

        const link = stage.append('g').attr('class', 'neural-links').selectAll('line').data(links).join('line').attr('data-depth', d => Math.min(d.depth, 3));
        const node = stage.append('g').selectAll('g').data(nodes).join('g').attr('class', d => `neural-node neural-color-${d.color}`).attr('tabindex', 0).attr('role', 'link').attr('aria-label', d => `${d.title}, ${d.category}`);
        node.append('circle').attr('r', d => 8 + Math.min(links.filter(linkItem => linkItem.source === d.id || linkItem.target === d.id).length, 5));
        node.append('text').attr('x', 14).attr('y', 4).text(d => d.title.length > 22 ? `${d.title.slice(0, 22)}…` : d.title);
        node.append('title').text(d => `${d.title}\n${d.category}`);
        const navigate = (_, d) => { window.location.href = d.path; };
        node.on('click', navigate).on('keydown', (event, d) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(event, d); } });

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.exact ? 78 : Math.max(105, 165 - d.depth * 22)).strength(d => Math.min(.92, .25 + d.depth * .2)))
            .force('charge', d3.forceManyBody().strength(-330))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('radial', d3.forceRadial(ring, width / 2, height / 2).strength(.045))
            .force('collision', d3.forceCollide(38))
            .alphaDecay(.018)
            .velocityDecay(.48);

        node.call(d3.drag().on('start', (event, d) => { if (!event.active) simulation.alphaTarget(.25).restart(); d.fx = d.x; d.fy = d.y; }).on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; }).on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));
        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        const resetView = () => {
            const transform = d3.zoomIdentity;
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) svg.call(zoom.transform, transform);
            else svg.transition().duration(480).ease(d3.easeCubicOut).call(zoom.transform, transform);
            nodes.forEach(d => { d.fx = null; d.fy = null; });
            simulation.alpha(.55).restart();
        };
        reset.addEventListener('click', resetView);
        new ResizeObserver(() => {
            const nextWidth = canvas.clientWidth;
            const nextHeight = canvas.clientHeight;
            svg.attr('viewBox', [0, 0, nextWidth, nextHeight]);
            simulation.force('center', d3.forceCenter(nextWidth / 2, nextHeight / 2)).alpha(.25).restart();
        }).observe(canvas);
    };

    fetch('../posts.json').then(response => {
        if (!response.ok) throw new Error('게시글 정보를 불러오지 못했습니다.');
        return response.json();
    }).then(data => render(data.posts || [])).catch(error => {
        status.textContent = error.message;
        count.textContent = '연결 정보 없음';
    });
})();
