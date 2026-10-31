// File uploader handler and first render of project cards
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Global Event Listener for File Uploader ---
fileUploader.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const targetId = this.getAttribute('data-upload-target');
    if (editorModal.classList.contains('visible') && editorInitialized) {
        const targetTextarea = editorModal.querySelector(`#${targetId}`);
        if (targetTextarea) {
            const reader = new FileReader();
            reader.onload = function(e) {
                targetTextarea.value = e.target.result;
                targetTextarea.dispatchEvent(new Event('input'));
                
                const fullscreenTextarea = editorModal.querySelector('#fullscreenTextarea');
                if (fullscreenTextarea && fullscreenTextarea.getAttribute('data-current-editor-id') === targetId) {
                    fullscreenTextarea.value = e.target.result;
                    if (currentEditorInstance && typeof currentEditorInstance.updateLineNumbers === 'function') {
                        currentEditorInstance.updateLineNumbers();
                    }
                }
            };
            reader.onerror = function() {
                alert('Error reading file.');
                console.error("File reading error:", reader.error);
            };
            reader.readAsText(file);
        }
    }
});

// --- Initial Render of Project Cards ---
renderProjectCards();
