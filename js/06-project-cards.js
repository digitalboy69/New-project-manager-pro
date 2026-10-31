// Project storage and project card rendering
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Project Card Management ---
function getProjects() {
    const projects = readStoredJson('codePlaygroundProjects', []);
    return Array.isArray(projects) ? projects.filter(p => p && typeof p.name === 'string') : [];
}

function saveProjects(projects) {
    if (writeStoredJson('codePlaygroundProjects', projects)) renderProjectCards();
}

function projectTime(project) {
    const t = new Date(project && project.timestamp).getTime();
    return isNaN(t) ? 0 : t;
}

function openProjectInNewTab(project) {
    const combinedCode = generateCombinedHTML(project);

    const blob = new Blob([combinedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
        newWindow.focus();
        setTimeout(() => URL.revokeObjectURL(url), 60000); // free the temporary file once the tab has loaded it
    } else {
        URL.revokeObjectURL(url);
        alert('Pop-up blocked! Please allow pop-ups for this site to open the preview.');
    }
}


function renderProjectCards() {
    const projects = getProjects();
    // Sort by timestamp descending
    projects.sort((a, b) => projectTime(b) - projectTime(a));
    
    projectCardsGrid.innerHTML = ''; 

    if (projects.length === 0) {
        noProjectsMessage.style.display = 'block';
    } else {
        noProjectsMessage.style.display = 'none';
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.projectName = project.name;
            card.innerHTML = `
                <h3>${escapeHtml(project.name)}</h3>
                <p>Last modified: ${projectTime(project) ? new Date(project.timestamp).toLocaleString() : 'unknown'}</p>
                <div class="project-card-actions">
                    <button class="secondary edit-project-btn" data-project-name="${escapeHtml(project.name)}">
                        <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 0 0-4 0L10 6l-7 7v4h4l7-7 3-3a2.85 2.85 0 0 0 0-4z"/><line x1="10" y1="14" x2="14" y2="10"/></svg>
                        Edit
                    </button>
                    <button class="danger delete-project-btn" data-project-name="${escapeHtml(project.name)}">
                        <svg class="icon icon-small" viewBox="0 0 24 24"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M4 7h16"/><path d="M18 7l-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                        Delete
                    </button>
                </div>
            `;
            projectCardsGrid.appendChild(card);
        });

        projectCardsGrid.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.project-card-actions')) {
                    const projectName = card.dataset.projectName;
                    const projectToLoad = getProjects().find(p => p.name === projectName);
                    if (projectToLoad) {
                        openProjectInNewTab(projectToLoad);
                    }
                }
            });
        });

        projectCardsGrid.querySelectorAll('.edit-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const projectName = e.target.closest('button').dataset.projectName;
                const projectToLoad = getProjects().find(p => p.name === projectName);
                if (projectToLoad) {
                    openEditor(projectToLoad);
                }
            });
        });

        projectCardsGrid.querySelectorAll('.delete-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectName = e.target.closest('button').dataset.projectName;
                if (confirm(`Are you sure you want to delete project "${projectName}"?`)) {
                    const updatedProjects = getProjects().filter(p => p.name !== projectName);
                    saveProjects(updatedProjects);
                }
            });
        });
    }
}
