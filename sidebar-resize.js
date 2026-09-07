(function () {
    const STORAGE_KEY = 'oxxultus-sidebar-width';
    const COLLAPSED_KEY = 'oxxultus-sidebar-collapsed';
    const MIN_WIDTH = 220;
    const MAX_WIDTH = 380;
    const DEFAULT_WIDTH = 244;
    const root = document.documentElement;
    const sidebar = document.querySelector('[data-resizable-sidebar]');
    const handle = document.querySelector('[data-sidebar-resizer]');
    if (!sidebar || !handle) return;

    const collapseButton = document.createElement('button');
    collapseButton.className = 'sidebar-collapse-control';
    collapseButton.type = 'button';
    collapseButton.innerHTML = '<i class="fas fa-table-columns" aria-hidden="true"></i>';
    const reopenButton = document.createElement('button');
    reopenButton.className = 'sidebar-reopen-control';
    reopenButton.type = 'button';
    reopenButton.innerHTML = '<i class="fas fa-table-columns" aria-hidden="true"></i>';
    sidebar.append(collapseButton);
    document.body.append(reopenButton);

    const setCollapsed = (collapsed, persist = true) => {
        document.body.classList.toggle('sidebar-collapsed', collapsed);
        collapseButton.hidden = collapsed;
        reopenButton.hidden = !collapsed;
        collapseButton.setAttribute('aria-label', '사이드바 닫기');
        collapseButton.setAttribute('aria-expanded', String(!collapsed));
        reopenButton.setAttribute('aria-label', '사이드바 열기');
        reopenButton.setAttribute('aria-expanded', String(!collapsed));
        if (persist) localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    };
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true', false);
    collapseButton.addEventListener('click', () => setCollapsed(true));
    reopenButton.addEventListener('click', () => setCollapsed(false));

    const clamp = value => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
    const applyWidth = (value, persist = false) => {
        const width = clamp(Math.round(value));
        root.style.setProperty('--app-sidebar-width', `${width}px`);
        handle.setAttribute('aria-valuenow', String(width));
        handle.setAttribute('aria-valuetext', `${width}px`);
        if (persist) localStorage.setItem(STORAGE_KEY, String(width));
    };
    const savedWidth = Number(localStorage.getItem(STORAGE_KEY));
    applyWidth(Number.isFinite(savedWidth) && savedWidth ? savedWidth : DEFAULT_WIDTH);

    const stopDragging = event => {
        if (!document.body.classList.contains('sidebar-resizing')) return;
        document.body.classList.remove('sidebar-resizing');
        if (event?.pointerId !== undefined && handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        applyWidth(parseFloat(getComputedStyle(root).getPropertyValue('--app-sidebar-width')), true);
    };
    handle.addEventListener('pointerdown', event => {
        if (matchMedia('(max-width: 800px)').matches) return;
        event.preventDefault();
        handle.setPointerCapture?.(event.pointerId);
        document.body.classList.add('sidebar-resizing');
    });
    handle.addEventListener('pointermove', event => {
        if (document.body.classList.contains('sidebar-resizing')) applyWidth(event.clientX);
    });
    handle.addEventListener('pointerup', stopDragging);
    handle.addEventListener('pointercancel', stopDragging);
    handle.addEventListener('dblclick', () => applyWidth(DEFAULT_WIDTH, true));
    handle.addEventListener('keydown', event => {
        const current = sidebar.getBoundingClientRect().width;
        const step = event.shiftKey ? 24 : 8;
        if (event.key === 'ArrowLeft') applyWidth(current - step, true);
        else if (event.key === 'ArrowRight') applyWidth(current + step, true);
        else if (event.key === 'Home') applyWidth(DEFAULT_WIDTH, true);
        else return;
        event.preventDefault();
    });
}());
