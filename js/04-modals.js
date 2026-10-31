// Modal helpers and global close handlers
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Modal Helpers (Main Scope) ---
function showModal(modal) {
    modal.classList.add('visible');
    //modal.style.display = 'flex'; 
    const firstInput = modal.querySelector('input[type="text"], input[type="password"], select, input[type="number"], input[type="url"]');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function hideModal(modal) {
    modal.classList.remove('visible');
    /*
    modal.addEventListener('transitionend', function handler() {
        modal.removeEventListener('transitionend', handler);
        modal.style.display = 'none';
    }, { once: true });
    */
}

// Global modal close handlers
document.querySelectorAll('.modal .close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.closest('.modal').id;
        hideModal(document.getElementById(modalId));
    });
});
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal);
    });
});
