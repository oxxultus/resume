(function () {
    const STORAGE_KEY = 'oxxultus-sidebar-width';
    const MIN_WIDTH = 220;
    const MAX_WIDTH = 380;
    const DEFAULT_WIDTH = 244;
    const root = document.documentElement;
    const sidebar = document.querySelector('[data-resizable-sidebar]');
    const handle = document.querySelector('[data-sidebar-resizer]');
    if (!sidebar || !handle) return;

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
