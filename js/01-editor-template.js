// HTML for the code-editor modal, kept as a string and injected when the editor opens.
// Store editor's HTML body content as a string for dynamic injection
const editorContentHTML = `
  <header>
    <h1>New Project</h1>
    <div class="header-controls">
        <button id="backToProjectsBtn" class="secondary">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
            Projects <kbd>Q</kbd>
        </button>
        <button id="themeToggleBtnEditor" aria-label="Toggle theme">
            <svg class="icon icon-small theme-icon-light" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            <svg class="icon icon-small theme-icon-dark" viewBox="0 0 24 24"><path d="M12 3a6.36 6.36 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
        <div class="header-buttons">
          <button id="saveBtn" title="Save this project (S)">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
            Save <kbd>S</kbd>
          </button>
          <button id="openInNewBtn" title="Open the result in a new tab (Enter)">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open Preview <kbd>Enter</kbd>
          </button>
          <button id="loadBtn" class="secondary" title="Load a saved project (O)">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Load <kbd>O</kbd>
          </button>
          <button id="exportSingleTelegramBtn" class="secondary" title="Export current code block to Telegram">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to Telegram
          </button>
        </div>
    </div>
  </header>

  <main>
    <div class="editor-pane">
      <div class="editor-group" id="htmlGroup">
        <div class="editor-header">
          <label for="htmlCode">HTML</label>
          <div class="editor-actions">
            <button class="secondary upload-btn" data-target="htmlCode" data-accept=".html,text/html">Upload</button>
            <button class="secondary paste-btn" data-target="htmlCode">Paste</button>
            <button class="secondary expand-btn" data-target="htmlCode">
                <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </div>
        <textarea id="htmlCode" placeholder="Enter HTML code here..." spellcheck="false"></textarea>
      </div>
      <div class="editor-group" id="cssGroup">
        <div class="editor-header">
          <label for="cssCode">CSS</label>
          <div class="editor-actions">
            <button class="secondary upload-btn" data-target="cssCode" data-accept=".css,text/css">Upload</button>
            <button class="secondary paste-btn" data-target="cssCode">Paste</button>
            <button class="secondary expand-btn" data-target="cssCode">
                <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </div>
        <textarea id="cssCode" placeholder="Enter CSS code here..." spellcheck="false"></textarea>
      </div>
      <div class="editor-group" id="jsGroup">
        <div class="editor-header">
          <label for="jsCode">JavaScript</label>
          <div class="editor-actions">
            <button class="secondary upload-btn" data-target="jsCode" data-accept=".js,text/javascript,application/javascript">Upload</button>
            <button class="secondary paste-btn" data-target="jsCode">Paste</button>
            <button class="secondary expand-btn" data-target="jsCode">
                <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </div>
        <textarea id="jsCode" placeholder="Enter JavaScript code here..." spellcheck="false"></textarea>
      </div>
    </div>

    <div class="preview-pane">
      <div class="preview-header">
        <span>Live Preview</span>
        <button id="downloadBtn">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
        </button>
      </div>
      <iframe id="preview" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  </main>

  <!-- Fullscreen Editor (nested within editor modal) -->
  <div id="fullscreenEditor" class="fullscreen-editor">
    <div class="fullscreen-header">
      <h2 id="fullscreenTitle">Editor</h2>
      <div class="header-buttons">
        <!-- More Actions Button -->
        <button id="moreActionsBtn" class="secondary" title="More Actions">
            <svg class="icon icon-small" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
        
        <!-- Menu Dropdown -->
        <div id="fullscreenMenuDropdown" class="menu-dropdown">
            <button id="menuFindBtn" data-action="find">
                <svg class="icon icon-small" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Find / Replace (F)
            </button>
            <button id="menuGoToLineBtn" data-action="line">
                <svg class="icon icon-small" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
                Go to Line (G)
            </button>
            <button id="menuUndoBtn" data-action="undo">
                <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M21 17H7a4 4 0 0 1 0-8h11.2c.7 0 1.3.4 1.8 1 1 1 1.5 2 1 3v1"/></svg>
                Undo (Z)
            </button>
            <button id="menuRedoBtn" data-action="redo">
                <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M3 17h14a4 4 0 0 0 0-8H5.8C5.4 11 5 12 5 13v1"/></svg>
                Redo (Y/Shift+Z)
            </button>
        </div>

        <button id="exitFullscreenBtn" class="secondary">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            Back to Editor (Esc)
        </button>
      </div>
    </div>
    
    <!-- Feature Bars Container (Dynamically managed) -->
    <div id="activeFeatureContainer">
        <!-- Find/Replace Bar -->
        <div class="find-replace-container feature-bar" id="findReplaceBar" style="display: none;">
            <div class="find-replace-bar">
                <input type="text" id="findInput" placeholder="Find text" class="find-replace-input">
                <button id="findPrevBtn" class="secondary find-replace-btn" title="Find Previous">
                    <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button id="findNextBtn" class="secondary find-replace-btn" title="Find Next">
                    <svg class="icon icon-small" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <span id="findMatchesCount" class="find-matches-count"></span>
            </div>
            <div class="find-replace-bar">
                <input type="text" id="replaceInput" placeholder="Replace with" class="find-replace-input">
                <button id="replaceBtn" class="secondary find-replace-btn">Replace</button>
                <button id="replaceAllBtn" class="secondary find-replace-btn">Replace All</button>
            </div>
             <div class="find-options">
                <label><input type="checkbox" id="caseSensitiveCheck"> Case Sensitive</label>
                <label><input type="checkbox" id="regexCheck"> Use Regex</label>
            </div>
        </div>
        <!-- Jump to Line Bar -->
        <div class="jump-to-line-container feature-bar" id="jumpToLineBar" style="display: none;">
            <label for="jumpToLineInput">Go to Line:</label>
            <input type="number" id="jumpToLineInput" placeholder="Line #" class="jump-to-line-input" min="1">
            <button id="jumpToLineBtn" class="secondary jump-to-line-btn">Go</button>
        </div>
    </div>

    <!-- Main Editor Area -->
    <div class="fullscreen-content">
        <div class="code-editor-container">
            <div class="line-numbers" id="fullscreenLineNumbers"></div>
            <textarea id="fullscreenTextarea" class="fullscreen-textarea" spellcheck="false"></textarea>
        </div>
    </div>
  </div>

  <!-- Modals (within editor context) -->
  <div class="modal" id="downloadModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Download Project</h3>
        <button class="close-modal" data-modal-id="downloadModal" aria-label="Close modal">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="form-group">
        <label for="projectName">File Name (e.g., my-page)</label>
        <input type="text" id="projectName" placeholder="my-page">
      </div>
      <div class="modal-actions">
        <button class="secondary" id="cancelDownload">Cancel</button>
        <button id="confirmDownload">Download</button>
      </div>
    </div>
  </div>

  <div class="modal" id="saveModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Save Project</h3>
        <button class="close-modal" data-modal-id="saveModal" aria-label="Close modal">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="form-group">
        <label for="saveProjectName">Project Name</label>
        <input type="text" id="saveProjectName" placeholder="Enter project name">
      </div>
      <div class="modal-actions">
        <button class="secondary" id="cancelSave">Cancel</button>
        <button id="confirmSave">Save</button>
      </div>
    </div>
  </div>

  <div class="modal" id="loadModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Load Project</h3>
        <button class="close-modal" data-modal-id="loadModal" aria-label="Close modal">
            <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="form-group">
        <label for="savedProjects">Select Project</label>
        <select id="savedProjects" class="form-control">
          <option value="">-- Select a project --</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="secondary" id="cancelLoad">Cancel</button>
        <button id="confirmLoad">Load</button>
        <button class="danger" id="clearIncompleteBtn" style="margin-right: auto; display: none;">Clear Incomplete</button>
      </div>
    </div>
  </div>
`;
