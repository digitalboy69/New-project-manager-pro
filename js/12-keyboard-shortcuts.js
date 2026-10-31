// Global keyboard shortcuts
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// Global Keyboard Shortcut Listener
document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    const editorVisible = editorModal.classList.contains('visible');
    
    // Escape key always closes modals/fullscreen editor first
    if (e.key === "Escape") {
        const visibleModal = document.querySelector('.modal.visible');
        if (visibleModal) {
            e.preventDefault();
            hideModal(visibleModal);
            return;
        }
    }
    
    if (editorVisible && currentEditorInstance) {
        const fullscreenVisible = editorModal.querySelector('#fullscreenEditor').classList.contains('visible');

        // Escape leaves the fullscreen editor (no modal is open at this point)
        if (e.key === 'Escape' && fullscreenVisible) {
            e.preventDefault();
            editorModal.querySelector('#exitFullscreenBtn').click();
            return;
        }

        if (isCmdOrCtrl) {
            switch (e.key.toLowerCase()) {
                case 's': // Save
                    e.preventDefault();
                    currentEditorInstance.showSaveModal();
                    break;
                case 'o': // Load
                    e.preventDefault();
                    currentEditorInstance.showLoadModal();
                    break;
                case 'q': // Back to Projects
                    e.preventDefault();
                    editorModal.querySelector('#backToProjectsBtn').click();
                    break;
                case 'enter': // Open Preview in New Tab (Cmd/Ctrl + Enter)
                    e.preventDefault();
                    editorModal.querySelector('#openInNewBtn').click();
                    break;
                case 'f': // Find (in fullscreen)
                    if (fullscreenVisible) {
                        e.preventDefault();
                        currentEditorInstance.showFindReplaceBar();
                    }
                    break;
                case 'g': // Go to Line (in fullscreen)
                    if (fullscreenVisible) {
                        e.preventDefault();
                        currentEditorInstance.showJumpToLineBar();
                    }
                    break;
            }
        }
        
        // Undo/Redo are handled by browser defaults, but Redo (Ctrl+Y/Shift+Z) needs explicit handling for Shift+Z
        if (e.key === 'Z' && isCmdOrCtrl && e.shiftKey && fullscreenVisible) {
             e.preventDefault();
             editorModal.querySelector('#menuRedoBtn').click(); // Trigger redo explicitly
        }
    }
});
