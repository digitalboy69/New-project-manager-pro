// Header buttons: mouse wheel and drag scroll sideways, edge fade shows when more buttons are hidden.
(function () {
    const bar = document.querySelector('#mainHeader .header-controls');
    if (!bar) return;
    const update = () => {
        const max = bar.scrollWidth - bar.clientWidth;
        bar.classList.toggle('more-left', bar.scrollLeft > 4);
    };
    bar.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    bar.addEventListener('wheel', e => {
        if (bar.scrollWidth <= bar.clientWidth) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { bar.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
    let down = false, startX = 0, startLeft = 0, moved = false;
    bar.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; startX = e.clientX; startLeft = bar.scrollLeft; });
    window.addEventListener('pointermove', e => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) { moved = true; bar.classList.add('dragging'); }
        if (moved) bar.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => { down = false; setTimeout(() => bar.classList.remove('dragging'), 0); });
    bar.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    update();
})();
