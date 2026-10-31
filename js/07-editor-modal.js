// Open/close the editor modal and the persistent draft
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Editor Modal Handling ---
function openEditor(projectToLoad = null) {
    mainPageContent.style.display = 'none';
    mainHeader.style.display = 'none';
    document.body.classList.add('editor-active');

    if (!editorInitialized) {
        editorModal.innerHTML = editorContentHTML;
        currentEditorInstance = initializeCodeEditor(editorModal, getProjects, saveProjects, closeEditor);
        editorInitialized = true;
        // The editor's own theme button (it was never connected before)
        editorModal.querySelector('#themeToggleBtnEditor').addEventListener('click', toggleTheme);
        applyTheme(document.body.classList.contains('dark-theme') ? 'dark' : 'light'); // sync the button's state
    }
    cancelPendingEditorClose();

    const htmlCode = editorModal.querySelector('#htmlCode');
    const cssCode = editorModal.querySelector('#cssCode');
    const jsCode = editorModal.querySelector('#jsCode');
    const saveProjectNameInput = editorModal.querySelector('#saveProjectName');
    const projectNameInput = editorModal.querySelector('#projectName'); 

    if (projectToLoad) {
        htmlCode.value = projectToLoad.html || '';
        cssCode.value = projectToLoad.css || '';
        jsCode.value = projectToLoad.js || '';
        saveProjectNameInput.value = projectToLoad.name;
        projectNameInput.value = projectToLoad.name;
        editorModal.querySelector('header h1').textContent = `Editing: ${projectToLoad.name}`;
    } else {
        htmlCode.value = '';
        cssCode.value = '';
        jsCode.value = '';
        saveProjectNameInput.value = '';
        projectNameInput.value = '';
        editorModal.querySelector('header h1').textContent = 'New Project';
    }

    htmlCode.dispatchEvent(new Event('input')); // refresh the preview
    currentEditorInstance.markSaved(); // loading a project is not an unsaved change

    editorModal.style.display = 'flex'; 
    requestAnimationFrame(() => {
        editorModal.classList.add('visible'); 
    });
}

let editorCloseHandler = null, editorCloseTimer = null;

function cancelPendingEditorClose() {
    if (editorCloseHandler) editorModal.removeEventListener('transitionend', editorCloseHandler);
    clearTimeout(editorCloseTimer);
    editorCloseHandler = editorCloseTimer = null;
}

function closeEditor() {
    cancelPendingEditorClose();
    editorModal.classList.remove('visible');

    // Finish once: after the fade-out ends (only the editor's own transition counts, not buttons inside it),
    // or after a short fallback timer if no transition runs (reduced motion, hidden tab, no CSS transition).
    const finish = () => {
        cancelPendingEditorClose();
        editorModal.style.display = 'none';
        document.body.classList.remove('editor-active');
        mainPageContent.style.display = 'block';
        mainHeader.style.display = 'flex';
        renderProjectCards();
    };
    editorCloseHandler = (e) => { if (e.target === editorModal) finish(); };
    editorModal.addEventListener('transitionend', editorCloseHandler);
    editorCloseTimer = setTimeout(finish, 450);
}

addProjectBtn.addEventListener('click', () => openEditor());

// --- Persistent Draft (Incomplete Project) Handler ---
window.addEventListener('beforeunload', (e) => {
    if (editorModal.classList.contains('visible') && currentEditorInstance && currentEditorInstance.isWorkUnsaved()) {
        // Save work silently before attempting closure
        currentEditorInstance.saveIncompleteProjectSilent();
    }
});
