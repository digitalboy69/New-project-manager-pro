// Theme (dark/light) management
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Theme Management (Main Page & Global) ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    try { localStorage.setItem('codePlaygroundTheme', theme); } catch (e) { /* storage blocked: theme still applies for this visit */ }

    const editorThemeToggleBtn = editorModal.querySelector('#themeToggleBtnEditor');
    if (editorThemeToggleBtn) {
        if (document.body.classList.contains('dark-theme')) {
            editorThemeToggleBtn.classList.add('dark-theme-active');
        } else {
            editorThemeToggleBtn.classList.remove('dark-theme-active');
        }
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

themeToggleBtn.addEventListener('click', toggleTheme);

const savedTheme = (function () { try { return localStorage.getItem('codePlaygroundTheme'); } catch (e) { return null; } })() || 
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);
