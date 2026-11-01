// Code editor: initializeCodeEditor(...) with find/replace, fullscreen, preview, save/load
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Editor initialization logic (passed down from main app) ---
function initializeCodeEditor(editorRoot, getProjectsFromMain, saveProjectsToMain, closeEditorCallback) {
    // --- DOM Elements (scoped to editorRoot) ---
    const htmlCode = editorRoot.querySelector('#htmlCode');
    const cssCode = editorRoot.querySelector('#cssCode');
    const jsCode = editorRoot.querySelector('#jsCode');
    const preview = editorRoot.querySelector('#preview');

    // Buttons
    const downloadBtn = editorRoot.querySelector('#downloadBtn');
    const openInNewBtn = editorRoot.querySelector('#openInNewBtn');
    const saveBtn = editorRoot.querySelector('#saveBtn');
    const loadBtn = editorRoot.querySelector('#loadBtn');
    const backToProjectsBtn = editorRoot.querySelector('#backToProjectsBtn'); 
    
    // Telegram Single Export
    const exportSingleTelegramBtn = editorRoot.querySelector('#exportSingleTelegramBtn');
    const exportSingleTelegramModal = document.getElementById('exportSingleTelegramModal'); // Global access
    const codePartSelect = document.getElementById('codePartSelect');
    const confirmSingleExport = document.getElementById('confirmSingleExport');
    const cancelSingleExport = document.getElementById('cancelSingleExport');


    // Fullscreen Editor
    const fullscreenEditor = editorRoot.querySelector('#fullscreenEditor');
    const fullscreenTextarea = editorRoot.querySelector('#fullscreenTextarea');
    const fullscreenTitle = editorRoot.querySelector('#fullscreenTitle');
    const exitFullscreenBtn = editorRoot.querySelector('#exitFullscreenBtn');
    
    // Fullscreen Menu and Feature Bars
    const moreActionsBtn = editorRoot.querySelector('#moreActionsBtn');
    const fullscreenMenuDropdown = editorRoot.querySelector('#fullscreenMenuDropdown');
    const findReplaceBar = editorRoot.querySelector('#findReplaceBar');
    const jumpToLineBar = editorRoot.querySelector('#jumpToLineBar');
    const menuFindBtn = editorRoot.querySelector('#menuFindBtn');
    const menuGoToLineBtn = editorRoot.querySelector('#menuGoToLineBtn');
    const menuUndoBtn = editorRoot.querySelector('#menuUndoBtn');
    const menuRedoBtn = editorRoot.querySelector('#menuRedoBtn');


    // Find & Replace in Fullscreen
    const findInput = editorRoot.querySelector('#findInput');
    const replaceInput = editorRoot.querySelector('#replaceInput');
    const findNextBtn = editorRoot.querySelector('#findNextBtn');
    const findPrevBtn = editorRoot.querySelector('#findPrevBtn');
    const replaceBtn = editorRoot.querySelector('#replaceBtn');
    const replaceAllBtn = editorRoot.querySelector('#replaceAllBtn');
    const caseSensitiveCheck = editorRoot.querySelector('#caseSensitiveCheck');
    const regexCheck = editorRoot.querySelector('#regexCheck');
    const findMatchesCount = editorRoot.querySelector('#findMatchesCount');

    // Line numbers and Jump to Line
    const fullscreenLineNumbers = editorRoot.querySelector('#fullscreenLineNumbers');
    const jumpToLineInput = editorRoot.querySelector('#jumpToLineInput');
    const jumpToLineBtn = editorRoot.querySelector('#jumpToLineBtn');


    // Modals
    const downloadModal = editorRoot.querySelector('#downloadModal');
    const saveModal = editorRoot.querySelector('#saveModal');
    const loadModal = editorRoot.querySelector('#loadModal');
    const projectNameInput = editorRoot.querySelector('#projectName');
    const saveProjectNameInput = editorRoot.querySelector('#saveProjectName');
    const savedProjectsSelect = editorRoot.querySelector('#savedProjects');

    const confirmDownload = editorRoot.querySelector('#confirmDownload');
    const cancelDownload = editorRoot.querySelector('#cancelDownload');
    const confirmSave = editorRoot.querySelector('#confirmSave');
    const cancelSave = editorRoot.querySelector('#cancelSave');
    const confirmLoad = editorRoot.querySelector('#confirmLoad');
    const cancelLoad = editorRoot.querySelector('#cancelLoad');
    const clearIncompleteBtn = editorRoot.querySelector('#clearIncompleteBtn');

    // --- State Variables ---
    let currentFullscreenEditor = null;
    let debounceTimeout;
    const MAX_INCOMPLETE_PROJECTS = 5;
    const INCOMPLETE_PROJECT_PREFIX = "Unsaved Session - ";

    // Find & Replace State
    let currentFindQuery = '';
    let findResultsIndices = [];
    let currentFindIndex = -1;

    // --- Incomplete Projects ---
    const state = { isWorkUnsaved: false };
    const markWorkAsUnsaved = () => { state.isWorkUnsaved = true; };
    const markWorkAsSaved = () => { state.isWorkUnsaved = false; };
    
    function getTimestamp() {
        return new Date().toLocaleString('sv-SE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(',', '');
    }

    function saveIncompleteProject(silent = false) {
        if (!htmlCode.value && !cssCode.value && !jsCode.value) return;

        const incompleteProjectName = `${INCOMPLETE_PROJECT_PREFIX}${getTimestamp()}`;
        const projectData = {
            name: incompleteProjectName, html: htmlCode.value, css: cssCode.value, js: jsCode.value,
            timestamp: new Date().toISOString(), type: 'incomplete'
        };

        let incompleteProjects = readStoredJson('codePlaygroundIncompleteProjects', []);
        if (!Array.isArray(incompleteProjects)) incompleteProjects = [];
        const existingContentHash = JSON.stringify({ h: htmlCode.value, c: cssCode.value, j: jsCode.value });
        
        // Remove any existing drafts that are identical to the current unsaved state (preventing duplicates)
        incompleteProjects = incompleteProjects.filter(p => JSON.stringify({ h: p.html, c: p.css, j: p.js }) !== existingContentHash);
        
        incompleteProjects.unshift(projectData);
        if (incompleteProjects.length > MAX_INCOMPLETE_PROJECTS) {
            incompleteProjects = incompleteProjects.slice(0, MAX_INCOMPLETE_PROJECTS);
        }
        if (!writeStoredJson('codePlaygroundIncompleteProjects', incompleteProjects)) return;
        markWorkAsSaved();
        
        if (!silent) {
             alert('Work saved as draft!');
        }
    }

    function clearIncompleteProjects() {
        if (confirm("Are you sure you want to clear all incomplete sessions? This cannot be undone.")) {
            localStorage.removeItem('codePlaygroundIncompleteProjects');
            updateProjectsList();
            alert("Incomplete sessions cleared.");
        }
    }

    // Expose core functions needed by main scope
    const exposedFunctions = {
        showSaveModal: () => showModal(saveModal),
        showLoadModal: () => { updateProjectsList(); showModal(loadModal); },
        saveIncompleteProjectSilent: () => saveIncompleteProject(true),
        markSaved: () => markWorkAsSaved(),
        isWorkUnsaved: () => state.isWorkUnsaved,
        showFindReplaceBar: () => { 
             hideAllFeatureBars();
             findReplaceBar.style.display = 'block';
             fullscreenMenuDropdown.classList.remove('visible');
             findInput.focus();
             findInput.select();
        },
        showJumpToLineBar: () => {
             hideAllFeatureBars();
             jumpToLineBar.style.display = 'flex';
             fullscreenMenuDropdown.classList.remove('visible');
             jumpToLineInput.focus();
             jumpToLineInput.select();
        },
        updateLineNumbers: null 
    };
    
    // --- Clipboard Fix (Paste Functionality) ---
    // 1) try the Clipboard API (with a timeout, because a blocked permission prompt can hang),
    // 2) if that fails for any reason, open an in-app "Paste here" box that works with the
    //    normal long-press / Ctrl+V paste and needs no permission at all.
    function applyPastedText(targetId, text, append) {
        const targetTextarea = editorRoot.querySelector(`#${targetId}`);
        targetTextarea.value = append ? targetTextarea.value + text : text;
        markWorkAsUnsaved();
        targetTextarea.dispatchEvent(new Event('input'));
        if (currentFullscreenEditor === targetId) {
            fullscreenTextarea.value = targetTextarea.value;
            if (exposedFunctions.updateLineNumbers) exposedFunctions.updateLineNumbers();
        }
    }

    function openManualPasteDialog(targetId, reason) {
        let dlg = document.getElementById('manualPasteModal');
        if (!dlg) {
            dlg = document.createElement('div');
            dlg.id = 'manualPasteModal';
            dlg.className = 'modal';
            dlg.setAttribute('role', 'dialog');
            dlg.setAttribute('aria-modal', 'true');
            dlg.innerHTML = `
              <div class="modal-content">
                <div class="modal-header">
                  <h3 class="modal-title">Paste your code</h3>
                  <button type="button" class="close-modal" id="manualPasteClose" aria-label="Close">&times;</button>
                </div>
                <p id="manualPasteHint" style="margin:0 0 .75rem;font-size:14px;color:var(--text-secondary)"></p>
                <textarea id="manualPasteArea" placeholder="Long-press here and choose Paste (or press Ctrl/Cmd+V)" spellcheck="false" style="width:100%;min-height:160px;flex:none"></textarea>
                <div class="modal-actions">
                  <button type="button" class="secondary" id="manualPasteAppend">Add to end</button>
                  <button type="button" id="manualPasteReplace">Replace</button>
                </div>
              </div>`;
            document.body.appendChild(dlg);
            dlg.addEventListener('click', e => { if (e.target === dlg) dlg.classList.remove('visible'); });
            dlg.querySelector('#manualPasteClose').addEventListener('click', () => dlg.classList.remove('visible'));
        }
        dlg.style.zIndex = 3000;
        const area = dlg.querySelector('#manualPasteArea');
        const hint = dlg.querySelector('#manualPasteHint');
        hint.textContent = reason + ' Long-press the box below and tap Paste: it is inserted automatically.';
        area.value = '';
        const done = (append) => {
            const text = area.value;
            if (!text) { area.focus(); return; }
            applyPastedText(targetId, text, append);
            dlg.classList.remove('visible');
        };
        // replace old handlers by cloning the buttons
        ['manualPasteReplace', 'manualPasteAppend'].forEach(id => {
            const old = dlg.querySelector('#' + id); const fresh = old.cloneNode(true);
            old.parentNode.replaceChild(fresh, old);
            fresh.addEventListener('click', () => done(id === 'manualPasteAppend'));
        });
        // pasting straight into the box with Replace behaviour is the common case: auto-apply
        area.onpaste = (e) => {
            const t = (e.clipboardData || window.clipboardData)?.getData('text');
            if (t) { e.preventDefault(); applyPastedText(targetId, t, false); dlg.classList.remove('visible'); }
        };
        dlg.classList.add('visible');
        setTimeout(() => area.focus(), 50);
    }

    async function pasteToEditor(targetId) {
        const targetTextarea = editorRoot.querySelector(`#${targetId}`);
        if (!navigator.clipboard || !navigator.clipboard.readText || !window.isSecureContext) {
            return openManualPasteDialog(targetId, 'Automatic paste is not available here.');
        }
        try {
            const text = await Promise.race([
                navigator.clipboard.readText(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
            ]);
            if (text) { applyPastedText(targetId, text, false); }
            else { openManualPasteDialog(targetId, 'The clipboard looks empty or unreadable.'); }
        } catch (e) {
            console.error('Paste error:', e);
            openManualPasteDialog(targetId, 'The browser blocked clipboard access.');
        }
    }
    
    // --- Core Editor Logic ---
    function getCombinedCode(titleOverride = null) {
        const projectTitle = titleOverride || projectNameInput.value || 'Code Playground Project';
        return generateCombinedHTML({
            name: projectTitle,
            html: htmlCode.value,
            css: cssCode.value,
            js: jsCode.value
        }, titleOverride);
    }

    let previewUrl = null;
    function updatePreview() {
        const blob = new Blob([getCombinedCode("Live Preview")], {type: 'text/html'});
        const oldUrl = previewUrl;
        previewUrl = URL.createObjectURL(blob);
        preview.src = previewUrl;
        if (oldUrl) URL.revokeObjectURL(oldUrl); // free the previous preview file
    }

    // Debounced input handling
    [htmlCode, cssCode, jsCode].forEach(el => {
        el.addEventListener('input', () => {
            markWorkAsUnsaved();
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(updatePreview, 300);
        });
    });

    // --- Fullscreen Editor Menu & Feature Toggle ---
    
    function hideAllFeatureBars() {
        findReplaceBar.style.display = 'none';
        jumpToLineBar.style.display = 'none';
    }

    moreActionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fullscreenMenuDropdown.classList.toggle('visible');
    });

    document.addEventListener('click', (e) => {
        if (!moreActionsBtn.contains(e.target) && !fullscreenMenuDropdown.contains(e.target)) {
            fullscreenMenuDropdown.classList.remove('visible');
        }
    });
    
    menuFindBtn.addEventListener('click', () => {
        exposedFunctions.showFindReplaceBar();
    });

    menuGoToLineBtn.addEventListener('click', () => {
        exposedFunctions.showJumpToLineBar();
    });
    
    menuUndoBtn.addEventListener('click', () => {
        fullscreenTextarea.focus();
        document.execCommand('undo', false, null);
        exposedFunctions.updateLineNumbers();
        fullscreenMenuDropdown.classList.remove('visible');
    });
    
    menuRedoBtn.addEventListener('click', () => {
        fullscreenTextarea.focus();
        document.execCommand('redo', false, null);
        exposedFunctions.updateLineNumbers();
        fullscreenMenuDropdown.classList.remove('visible');
    });


    // --- Fullscreen Editor Logic ---
    function openFullscreenEditor(textareaId) {
        const textarea = editorRoot.querySelector(`#${textareaId}`);
        currentFullscreenEditor = textareaId;
        fullscreenTextarea.value = textarea.value;
        fullscreenTextarea.setAttribute('data-current-editor-id', textareaId); 
        fullscreenTitle.textContent = textareaId.replace('Code', '').toUpperCase() + ' Editor';
        
        hideAllFeatureBars(); 
        fullscreenEditor.classList.add('visible');
        fullscreenTextarea.focus();
        resetFindState();
        exposedFunctions.updateLineNumbers();
        editorRoot.querySelector('header').style.visibility = 'hidden';
        editorRoot.querySelector('main').style.visibility = 'hidden';
    }

    function closeFullscreenEditor() {
        fullscreenEditor.classList.remove('visible');
        currentFullscreenEditor = null;
        fullscreenTextarea.removeAttribute('data-current-editor-id'); 
        resetFindState();
        editorRoot.querySelector('header').style.visibility = 'visible';
        editorRoot.querySelector('main').style.visibility = 'visible';
    }

    fullscreenTextarea.addEventListener('input', function() {
        if (currentFullscreenEditor) {
            markWorkAsUnsaved();
            editorRoot.querySelector(`#${currentFullscreenEditor}`).value = fullscreenTextarea.value;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(updatePreview, 300);
            resetFindStateOnContentChange(); 
            exposedFunctions.updateLineNumbers(); 
        }
    });

    fullscreenTextarea.addEventListener('scroll', () => {
        fullscreenLineNumbers.scrollTop = fullscreenTextarea.scrollTop;
    });

    function updateLineNumbers() {
        const lines = fullscreenTextarea.value.split('\n');
        let lineNumbersHTML = '';
        for (let i = 1; i <= lines.length; i++) {
            lineNumbersHTML += `<div>${i}</div>`;
        }
        fullscreenLineNumbers.innerHTML = lineNumbersHTML;
    }
    exposedFunctions.updateLineNumbers = updateLineNumbers; // Export for external use

    jumpToLineBtn.addEventListener('click', () => {
        const lineNumber = parseInt(jumpToLineInput.value, 10);
        if (isNaN(lineNumber) || lineNumber < 1) {
            alert('Please enter a valid line number.');
            return;
        }

        const lines = fullscreenTextarea.value.split('\n');
        if (lineNumber > lines.length) {
            alert(`Line ${lineNumber} is beyond the end of the file (last line is ${lines.length}).`);
            return;
        }

        let charIndex = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            charIndex += lines[i].length + 1;
        }

        fullscreenTextarea.focus();
        fullscreenTextarea.setSelectionRange(charIndex, charIndex);

        const style = window.getComputedStyle(fullscreenTextarea);
        const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.2);

        // Calculate scroll position to center the line (or near the top third)
        const targetScrollTop = (lineNumber - 1) * lineHeight - (fullscreenTextarea.clientHeight / 3);
        fullscreenTextarea.scrollTop = Math.max(0, targetScrollTop);


        const lineDiv = fullscreenLineNumbers.children[lineNumber - 1];
        if (lineDiv) {
            lineDiv.style.backgroundColor = 'var(--accent-color)';
            lineDiv.style.color = 'white';
            setTimeout(() => {
                lineDiv.style.backgroundColor = '';
                lineDiv.style.color = '';
            }, 500);
        }
    });

    exitFullscreenBtn.addEventListener('click', closeFullscreenEditor);

    // --- Find and Replace Logic ---

    function resetFindState() {
        currentFindQuery = '';
        findResultsIndices = [];
        currentFindIndex = -1;
        findMatchesCount.textContent = '';
    }

    function resetFindStateOnContentChange() {
        if (findResultsIndices.length > 0) {
            findResultsIndices = [];
            currentFindIndex = -1;
            findMatchesCount.textContent = ''; 
        }
    }

    function performFind(direction = 1, startAt = null) { 
        const query = findInput.value;
        if (!query) {
            findMatchesCount.textContent = '';
            findResultsIndices = [];
            currentFindIndex = -1;
            return;
        }

        const content = fullscreenTextarea.value;
        const isCaseSensitive = caseSensitiveCheck.checked;
        const isRegex = regexCheck.checked;

        // Recalculate if query or options changed, or if results array is empty
        if (query !== currentFindQuery || findResultsIndices.length === 0 || findMatchesCount.textContent === 'Invalid Regex') { 
            currentFindQuery = query;
            findResultsIndices = [];
            try {
                const flags = isCaseSensitive ? 'g' : 'gi';
                const searchRegex = isRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
                let match;
                while ((match = searchRegex.exec(content)) !== null) {
                    if (match[0].length === 0) { searchRegex.lastIndex++; continue; } // empty match: step forward (avoids an endless loop)
                    findResultsIndices.push({ index: match.index, length: match[0].length });
                }
            } catch (e) {
                findMatchesCount.textContent = 'Invalid Regex';
                return;
            }
            
            if (direction > 0) {
                 currentFindIndex = -1; 
            } else {
                 currentFindIndex = findResultsIndices.length; 
            }
        }

        if (findResultsIndices.length === 0) {
            findMatchesCount.textContent = '0 matches';
            return;
        }

        if (startAt !== null) { // continue from a given position (used after Replace)
            const firstAfter = findResultsIndices.findIndex(r => r.index >= startAt);
            currentFindIndex = (firstAfter === -1 ? findResultsIndices.length : firstAfter) - 1;
        }

        currentFindIndex += direction;

        if (currentFindIndex >= findResultsIndices.length) {
            currentFindIndex = 0; 
        } else if (currentFindIndex < 0) {
            currentFindIndex = findResultsIndices.length - 1; 
        }

        const result = findResultsIndices[currentFindIndex];
        fullscreenTextarea.focus();
        fullscreenTextarea.setSelectionRange(result.index, result.index + result.length);
        scrollToSelection(fullscreenTextarea, result.index);

        findMatchesCount.textContent = `${currentFindIndex + 1}/${findResultsIndices.length}`;
    }

    function scrollToSelection(textarea, selectionStart) {
        const text = textarea.value;
        const textBeforeSelection = text.substring(0, selectionStart);
        const linesBeforeSelection = textBeforeSelection.split('\n').length -1;

        const style = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.2);

        const scrollTop = linesBeforeSelection * lineHeight;

        // Scroll only if the selection is outside the visible area
        if (scrollTop < textarea.scrollTop || scrollTop > textarea.scrollTop + textarea.clientHeight - lineHeight * 2) {
             textarea.scrollTop = scrollTop - (textarea.clientHeight / 2) + lineHeight;
        }
    }

    // Find/Replace button handlers (Trigger search explicitly)
    findNextBtn.addEventListener('click', () => performFind(1));
    findPrevBtn.addEventListener('click', () => performFind(-1));
    
    findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performFind(e.shiftKey ? -1 : 1);
        }
    });

    findInput.addEventListener('input', () => {
        resetFindStateOnContentChange();
        findMatchesCount.textContent = ''; 
    });
    [caseSensitiveCheck, regexCheck].forEach(el => el.addEventListener('change', () => {
        resetFindStateOnContentChange();
        findMatchesCount.textContent = '';
    }));
    

    replaceBtn.addEventListener('click', () => {
        if (currentFindIndex === -1 || findResultsIndices.length === 0 || !findInput.value) {
             alert("Please perform a Find search first to select text for replacement.");
             return;
        }

        const result = findResultsIndices[currentFindIndex];
        const replacement = replaceInput.value;
        const originalLength = result.length;

        fullscreenTextarea.focus(); // the command below only works on the focused text box
        fullscreenTextarea.setSelectionRange(result.index, result.index + originalLength);
        if (!document.execCommand('insertText', false, replacement)) {
            fullscreenTextarea.setRangeText(replacement, result.index, result.index + originalLength, 'end'); // fallback
        }

        // Update main content areas
        markWorkAsUnsaved();
        editorRoot.querySelector(`#${currentFullscreenEditor}`).value = fullscreenTextarea.value;
        updatePreview();
        exposedFunctions.updateLineNumbers();

        // Find the next match after the text we just inserted
        resetFindStateOnContentChange();
        performFind(1, result.index + replacement.length);
    });

    replaceAllBtn.addEventListener('click', () => {
        const query = findInput.value;
        if (!query) {
            alert("Please enter text to find.");
            return;
        }

        const content = fullscreenTextarea.value;
        const replacement = replaceInput.value;
        const isCaseSensitive = caseSensitiveCheck.checked;
        const isRegex = regexCheck.checked;

        try {
            const flags = isCaseSensitive ? 'g' : 'gi';
            const searchRegex = isRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

            if (isRegex && new RegExp(query, flags).test('')) {
                alert('This pattern can match empty text, so "Replace All" would insert text everywhere. Please make the pattern more specific.');
                return;
            }

            const matches = (content.match(searchRegex) || []);
            if (matches.length === 0) {
                findMatchesCount.textContent = '0 matches to replace';
                return;
            }
            
            if (!confirm(`Are you sure you want to replace all ${matches.length} occurrences of "${query}"?`)) {
                return;
            }

            // Plain-text mode: insert the replacement exactly as typed ($& or $1 are not special there)
            const newContent = isRegex ? content.replace(searchRegex, replacement) : content.replace(searchRegex, () => replacement);
            const replacedCount = matches.length;

            fullscreenTextarea.value = newContent;
            editorRoot.querySelector(`#${currentFullscreenEditor}`).value = newContent;
            markWorkAsUnsaved();
            updatePreview();
            exposedFunctions.updateLineNumbers();

            resetFindState();
            findMatchesCount.textContent = `${replacedCount} replaced`;

        } catch (e) {
            findMatchesCount.textContent = 'Invalid Regex';
            console.error("Regex error:", e);
        }
    });


    // --- Event Listeners (Modals, Buttons, etc.) ---
    downloadBtn.addEventListener('click', () => {
        if (!projectNameInput.value && saveProjectNameInput.value) {
             projectNameInput.value = saveProjectNameInput.value;
        }
        showModal(downloadModal);
    });
    
    openInNewBtn.addEventListener('click', () => openProjectInNewTab({
        name: projectNameInput.value || 'Untitled Project',
        html: htmlCode.value,
        css: cssCode.value,
        js: jsCode.value
    }));
    saveBtn.addEventListener('click', () => {
        if (!saveProjectNameInput.value && projectNameInput.value) {
             saveProjectNameInput.value = projectNameInput.value;
        }
        showModal(saveModal);
    });
    loadBtn.addEventListener('click', () => { exposedFunctions.showLoadModal(); });

    confirmDownload.addEventListener('click', downloadCombined);
    cancelDownload.addEventListener('click', () => hideModal(downloadModal));
    confirmSave.addEventListener('click', saveProject);
    cancelSave.addEventListener('click', () => hideModal(saveModal));
    confirmLoad.addEventListener('click', loadProject);
    cancelLoad.addEventListener('click', () => hideModal(loadModal));
    clearIncompleteBtn.addEventListener('click', clearIncompleteProjects);

    backToProjectsBtn.addEventListener('click', () => {
        if (state.isWorkUnsaved && confirm("You have unsaved changes. Do you want to save them as an incomplete session before returning?")) {
            saveIncompleteProject(true); // Save silently
        }
        closeEditorCallback();
    });


    editorRoot.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', function() { openFullscreenEditor(this.getAttribute('data-target')); });
    });

    editorRoot.querySelectorAll('.paste-btn').forEach(btn => {
        btn.addEventListener('click', function() { pasteToEditor(this.getAttribute('data-target')); });
    });

    // Set up upload buttons (delegates to global fileUploader)
    editorRoot.querySelectorAll('.upload-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const acceptTypes = this.getAttribute('data-accept');
            fileUploader.setAttribute('data-upload-target', targetId);
            fileUploader.accept = acceptTypes;
            fileUploader.value = null;
            fileUploader.click();
        });
    });

    // --- Telegram Single Project Export Logic ---

    exportSingleTelegramBtn.addEventListener('click', () => {
        // Update project name in editor scope
        if (saveProjectNameInput.value) {
            exportSingleTelegramModal.querySelector('.modal-title').textContent = `Export: ${saveProjectNameInput.value}`;
        }
        showModal(exportSingleTelegramModal);
    });

    confirmSingleExport.addEventListener('click', async () => {
        const selectedPart = codePartSelect.value;
        const currentProjectName = saveProjectNameInput.value || 'Untitled Project';
        let content = '';
        let partName = '';

        switch (selectedPart) {
            case 'html': content = htmlCode.value; partName = 'HTML'; break;
            case 'css': content = cssCode.value; partName = 'CSS'; break;
            case 'js': content = jsCode.value; partName = 'JavaScript'; break;
            case 'combined': 
                content = getCombinedCode(currentProjectName); 
                partName = 'Combined HTML File'; 
                break;
        }

        if (!content.trim()) {
            alert(`The selected code section (${partName}) is empty.`);
            return;
        }

        let success = false;

        if (selectedPart === 'combined') {
            const fileName = `${currentProjectName.replace(/[^a-z0-9_.-]/gi, '_')}.html`;
            const blob = new Blob([content], { type: 'text/html' });
            success = await sendToTelegram(blob, true, currentProjectName, fileName, 'text/html');

        } else {
            // Short code goes as a formatted message; long code (Telegram's limit is about 4000 characters) goes as a file
            const payload = `*Project:* ${escapeMarkdownV2(currentProjectName)}\n*Part:* ${escapeMarkdownV2(partName)}\n\n\`\`\`\n${escapeMarkdownV2Code(content)}\n\`\`\``;
            if (payload.length <= 4000) {
                success = await sendToTelegram(payload, false, currentProjectName);
            } else {
                const ext = { html: 'html', css: 'css', js: 'js' }[selectedPart] || 'txt';
                const fileName = `${currentProjectName.replace(/[^a-z0-9_.-]/gi, '_')}.${ext}`;
                success = await sendToTelegram(new Blob([content], { type: 'text/plain' }), true, `${currentProjectName} (${partName})`, fileName, 'text/plain');
            }
        }


        if (success) {
            alert(`Successfully exported ${partName} for "${currentProjectName}" to Telegram!`);
            hideModal(exportSingleTelegramModal);
        }
    });

    cancelSingleExport.addEventListener('click', () => hideModal(exportSingleTelegramModal));

    // --- Helper Functions ---
    
    function downloadCombined() {
        const fileNameBase = projectNameInput.value.trim() || 'code-playground';
        const fileName = `${fileNameBase.replace(/[^a-z0-9_.-]/gi, '_')}.html`;
        const blob = new Blob([getCombinedCode(projectNameInput.value.trim() || 'My Project')], {type: 'text/html'});

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        hideModal(downloadModal); 
    }

    function saveProject() {
        const projectName = saveProjectNameInput.value.trim();
        if (!projectName) { alert('Project name required.'); saveProjectNameInput.focus(); return; }

        const projectData = {
            name: projectName, html: htmlCode.value, css: cssCode.value, js: jsCode.value,
            timestamp: new Date().toISOString()
        };

        let projects = getProjectsFromMain(); 
        const existingIndex = projects.findIndex(p => p.name === projectName);

        if (existingIndex >= 0) {
            if (!confirm(`Project "${projectName}" exists. Overwrite?`)) return;
            projects[existingIndex] = projectData;
        } else {
            projects.push(projectData);
        }

        saveProjectsToMain(projects); 
        hideModal(saveModal); 
        alert('Project saved!'); markWorkAsSaved();
        projectNameInput.value = projectName;
        editorModal.querySelector('header h1').textContent = `Editing: ${projectName}`;
    }

    function loadProject() {
        const selectedProjectName = savedProjectsSelect.value;
        if (!selectedProjectName) return;

        const isInc = selectedProjectName.startsWith(INCOMPLETE_PROJECT_PREFIX);
        const storageKey = isInc ? 'codePlaygroundIncompleteProjects' : 'codePlaygroundProjects';
        let projects = readStoredJson(storageKey, []);
        if (!Array.isArray(projects)) projects = [];
        const project = projects.find(p => p && p.name === selectedProjectName);

        if (project) {
            // Load content
            htmlCode.value = project.html || ''; cssCode.value = project.css || ''; jsCode.value = project.js || '';
            updatePreview(); hideModal(loadModal);
            // A recovered draft is removed from the drafts list below, so it still counts as unsaved until the user saves it
            if (isInc) markWorkAsUnsaved(); else markWorkAsSaved();
            
            // Update UI fields
            const effectiveName = isInc ? '' : project.name; // a draft's name is just a timestamp, so leave the name empty for the user to choose
            saveProjectNameInput.value = effectiveName; 
            projectNameInput.value = effectiveName; 
            editorModal.querySelector('header h1').textContent = `Editing: ${effectiveName || 'New Project'}`;

            // If loaded from incomplete, delete the draft
            if (isInc) {
                projects = projects.filter(p => p.name !== selectedProjectName);
                writeStoredJson(storageKey, projects);
            }
            updateProjectsList(); 
        } else {
            alert("Error: Project not found.");
        }
    }

    function updateProjectsList() {
        const savedRegularProjects = getProjectsFromMain();
        const incompleteProjectsRaw = readStoredJson('codePlaygroundIncompleteProjects', []);
        const incompleteProjects = Array.isArray(incompleteProjectsRaw) ? incompleteProjectsRaw.filter(p => p && typeof p.name === 'string') : [];
        savedProjectsSelect.innerHTML = '<option value="">-- Select a project --</option>';

        if (incompleteProjects.length > 0) {
            const optGroup = document.createElement('optgroup'); optGroup.label = `Incomplete Sessions (${incompleteProjects.length})`;
            incompleteProjects.forEach(p => {
                const date = new Date(p.timestamp).toLocaleString();
                const opt = document.createElement('option'); opt.value = p.name; opt.textContent = `[Draft] ${date}`;
                optGroup.appendChild(opt);
            });
            savedProjectsSelect.appendChild(optGroup);
            clearIncompleteBtn.style.display = 'inline-block';
        } else {
            clearIncompleteBtn.style.display = 'none';
        }

        if (savedRegularProjects.length > 0) {
            const optGroup = document.createElement('optgroup'); optGroup.label = `Saved Projects (${savedRegularProjects.length})`;
            savedRegularProjects.sort((a, b) => projectTime(b) - projectTime(a)); // Sort by date descending
            savedRegularProjects.forEach(p => {
                const opt = document.createElement('option'); opt.value = p.name; opt.textContent = p.name;
                optGroup.appendChild(opt);
            });
            savedProjectsSelect.appendChild(optGroup);
        }
    }

    // Initial setup
    updateProjectsList();
    markWorkAsSaved(); 
    return exposedFunctions;
}
