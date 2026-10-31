// GitHub sync (push/pull projects) and its event listeners
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Keyboard Shortcuts Guide ---
shortcutsBtn.addEventListener('click', () => showModal(shortcutsModal));
okShortcuts.addEventListener('click', () => hideModal(shortcutsModal));

// --- GitHub Sync Logic ---

const GITHUB_API_BASE = 'https://api.github.com';
const PROJECTS_DIR = 'projects'; // Directory within the repo to store projects

function getGitHubConfig() {
    const config = readStoredJson('githubConfig', null) || {};
    return { token: String(config.token || ''), username: String(config.username || ''), repo: String(config.repo || '') };
}

function saveGitHubConfig(token, username, repo) {
    writeStoredJson('githubConfig', { token, username, repo });
}

async function githubApiRequest(endpoint, options = {}) {
    const config = getGitHubConfig();
    if (!config.token) {
        throw new Error("GitHub Personal Access Token is not configured.");
    }

    const headers = {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers,
    };

    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch (e) { /* the error reply was not JSON (e.g. a gateway error page) */ }
        const message = errorData.message || `API request failed with status ${response.status}`;
        console.error("GitHub API Error:", errorData);
        throw new Error(message);
    }
    
    // For '204 No Content' or similar successful but empty responses
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return null;
    }

    return response.json();
}

// File name used for a project inside the repo: characters that break paths or URLs are replaced.
function githubFileKey(projectName) {
    return String(projectName).trim().replace(/[\\/:*?"<>|#%]/g, '_') || 'untitled';
}

// API path of a project's file (each part is URL-encoded, so spaces, # or ? in names are safe)
function githubProjectPath(projectName) {
    return `${PROJECTS_DIR}/${encodeURIComponent(githubFileKey(projectName))}.json`;
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

async function pushProjectToGithub(projectName, button) {
    const config = getGitHubConfig();
    const project = getProjects().find(p => p.name === projectName);
    if (!project) {
        alert("Local project not found!");
        return;
    }
    
    const originalButtonText = button.innerHTML;
    button.innerHTML = 'Pushing...';
    button.disabled = true;

    try {
        const filePath = githubProjectPath(projectName);
        const content = JSON.stringify(project, null, 2);
        
        let fileSha = null;
        try {
            const existingFile = await githubApiRequest(`/repos/${config.username}/${config.repo}/contents/${filePath}`);
            fileSha = existingFile.sha;
        } catch (e) {
            // File doesn't exist, which is fine for a new push
            if (e.message.toLowerCase().includes('not found')) {
                console.log(`File ${filePath} not found on GitHub. Creating new file.`);
            } else {
                throw e; // Re-throw other errors
            }
        }

        const payload = {
            message: `Update project: ${projectName}`,
            content: b64EncodeUnicode(content),
            sha: fileSha // Include SHA if updating an existing file
        };

        await githubApiRequest(`/repos/${config.username}/${config.repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        alert(`Project "${projectName}" successfully pushed to GitHub!`);
        await populateSyncModal(); // Refresh the list
    } catch (error) {
        alert(`Error pushing project: ${error.message}`);
    } finally {
        button.innerHTML = originalButtonText;
        button.disabled = false;
    }
}

async function pullProjectFromGithub(projectName, sha, button) {
    const config = getGitHubConfig();
    const originalButtonText = button.innerHTML;
    button.innerHTML = 'Pulling...';
    button.disabled = true;

    try {
        const fileData = await githubApiRequest(`/repos/${config.username}/${config.repo}/git/blobs/${sha}`);
        if (!fileData.content) throw new Error("File content not found in response.");

        const projectData = JSON.parse(b64DecodeUnicode(fileData.content));
        if (!projectData || typeof projectData !== 'object' || typeof projectData.name !== 'string' || !projectData.name.trim()) {
            throw new Error('The file on GitHub is not a valid project (it has no name).');
        }
        ['html', 'css', 'js'].forEach(k => { if (typeof projectData[k] !== 'string') projectData[k] = ''; });
        if (isNaN(new Date(projectData.timestamp).getTime())) projectData.timestamp = new Date().toISOString();
        let projects = getProjects();
        const existingIndex = projects.findIndex(p => p.name === projectData.name);

        if (existingIndex > -1) {
            projects[existingIndex] = projectData; // Overwrite
        } else {
            projects.push(projectData); // Add new
        }

        saveProjects(projects);
        alert(`Project "${projectName}" successfully pulled and saved locally!`);
        await populateSyncModal(); // Refresh list

    } catch (error) {
        alert(`Error pulling project: ${error.message}`);
    } finally {
        button.innerHTML = originalButtonText;
        button.disabled = false;
    }
}


async function populateSyncModal() {
    githubSyncStatus.textContent = 'Fetching data from GitHub...';
    githubSyncContent.innerHTML = '';
    
    try {
        const config = getGitHubConfig();
        if (!config.token || !config.username || !config.repo) {
            githubSyncStatus.innerHTML = 'GitHub is not configured. <button id="setupGithubFromSync" class="secondary">Setup Now</button>';
            document.getElementById('setupGithubFromSync').addEventListener('click', () => {
                hideModal(githubSyncModal);
                showModal(githubSetupModal);
            });
            return;
        }

        let remoteFiles = [];
        try {
            const contents = await githubApiRequest(`/repos/${config.username}/${config.repo}/contents/${PROJECTS_DIR}`);
            if (Array.isArray(contents)) {
                remoteFiles = contents.filter(file => file.name.endsWith('.json')).map(file => ({
                    name: file.name.replace(/\.json$/, ''),
                    sha: file.sha
                }));
            }
        } catch (e) {
             if (e.message.toLowerCase().includes('not found')) {
                console.log(`Directory ${PROJECTS_DIR} not found. Assuming empty repo.`);
             } else {
                throw e;
             }
        }

        const localProjects = getProjects();
        // Match local and remote projects by their file name in the repo, so names with special characters still pair up
        const localByKey = new Map(localProjects.map(p => [githubFileKey(p.name), p]));
        const remoteByKey = new Map(remoteFiles.map(f => [f.name, f]));
        const allKeys = [...new Set([...localByKey.keys(), ...remoteByKey.keys()])];
        let html = '';

        const toPush = [], toPull = [], inSync = [], conflicted = [];

        for (const key of allKeys) {
            const local = localByKey.get(key);
            const remote = remoteByKey.get(key);
            const name = local ? local.name : key;

            if (local && !remote) {
                toPush.push({ name, type: 'local-only' });
            } else if (!local && remote) {
                toPull.push({ name, sha: remote.sha, type: 'remote-only' });
            } else {
                const localTime = projectTime(local);
                const item = {name, localTime, sha: remote.sha };

                // To check remote time, we need another API call.
                // For simplicity, we compare local time against existence.
                // A more robust check would involve fetching remote file commit date.
                // Let's assume for now local is always newer if both exist for this simplified example.
                // A better check: if timestamps differ, show status.
                
                // Let's fetch the remote project content to get its timestamp
                try {
                    const fileData = await githubApiRequest(`/repos/${config.username}/${config.repo}/git/blobs/${remote.sha}`);
                    const remoteProject = JSON.parse(b64DecodeUnicode(fileData.content));
                    const remoteTime = projectTime(remoteProject);
                    item.remoteTime = remoteTime;
                    
                    if (localTime > remoteTime) {
                        conflicted.push({ ...item, status: 'local-newer' });
                    } else if (remoteTime > localTime) {
                        conflicted.push({ ...item, status: 'remote-newer' });
                    } else {
                        inSync.push(item);
                    }

                } catch (e) {
                    console.error(`Could not fetch details for ${name}: ${e.message}`);
                }
            }
        }

        const renderItem = (project, action) => {
            let statusHtml = '';
            let buttonHtml = '';
            if (action === 'push') {
                buttonHtml = `<button class="secondary push-to-github-btn" data-project-name="${escapeHtml(project.name)}">Push</button>`;
                if (project.type !== 'local-only') {
                    statusHtml = `<span class="sync-project-status newer">Local is newer</span>`;
                }
            } else if (action === 'pull') {
                 buttonHtml = `<button class="pull-from-github-btn" data-project-name="${escapeHtml(project.name)}" data-sha="${escapeHtml(project.sha)}">Pull</button>`;
                 if (project.type !== 'remote-only') {
                    statusHtml = `<span class="sync-project-status older">Remote is newer</span>`;
                }
            }

            return `
            <li class="sync-list-item">
                <div>
                    <div class="sync-project-name">${escapeHtml(project.name)}</div>
                    ${statusHtml}
                </div>
                ${buttonHtml}
            </li>`;
        };
        
        let hasActions = false;

        if (toPush.length > 0 || conflicted.some(p => p.status === 'local-newer')) {
            hasActions = true;
            html += '<h4 class="sync-section-header">Ready to Push to GitHub</h4><ul class="sync-list">';
            toPush.forEach(p => html += renderItem(p, 'push'));
            conflicted.filter(p => p.status === 'local-newer').forEach(p => html += renderItem(p, 'push'));
            html += '</ul>';
        }

        if (toPull.length > 0 || conflicted.some(p => p.status === 'remote-newer')) {
             hasActions = true;
             html += '<h4 class="sync-section-header">Available to Pull from GitHub</h4><ul class="sync-list">';
             toPull.forEach(p => html += renderItem(p, 'pull'));
             conflicted.filter(p => p.status === 'remote-newer').forEach(p => html += renderItem(p, 'pull'));
             html += '</ul>';
        }
        
        if (inSync.length > 0) {
            html += `<h4 class="sync-section-header">Projects in Sync (${inSync.length})</h4>`;
        }

        if (!hasActions && inSync.length > 0) {
             githubSyncStatus.textContent = 'All projects are in sync!';
        } else if (!hasActions && inSync.length === 0) {
             githubSyncStatus.textContent = 'No local or remote projects found.';
        }
        else {
             githubSyncStatus.textContent = '';
        }

        githubSyncContent.innerHTML = `<div class="sync-container">${html}</div>`;

    } catch (error) {
        githubSyncStatus.textContent = `Error: ${error.message}`;
    }
}

// GitHub Event Listeners
githubSyncBtn.addEventListener('click', () => {
     githubSyncContent.innerHTML = '';
     githubSyncStatus.textContent = 'Click Refresh to compare local and remote projects.';
     showModal(githubSyncModal);
});

saveGithubSetup.addEventListener('click', () => {
    const token = githubTokenInput.value.trim();
    const username = githubUsernameInput.value.trim();
    const repo = githubRepoInput.value.trim();

    if (!token || !username || !repo) {
        alert('All fields are required.');
        return;
    }
    saveGitHubConfig(token, username, repo);
    hideModal(githubSetupModal);
    alert('GitHub configuration saved!');
    showModal(githubSyncModal); // Re-open sync modal
    populateSyncModal();
});

cancelGithubSetup.addEventListener('click', () => hideModal(githubSetupModal));
cancelSync.addEventListener('click', () => { hideModal(githubSyncModal); renderProjectCards(); });
refreshSyncBtn.addEventListener('click', populateSyncModal);

openGithubSetupBtn.addEventListener('click', () => {
    const config = getGitHubConfig();
    githubTokenInput.value = config.token;
    githubUsernameInput.value = config.username;
    githubRepoInput.value = config.repo;
    hideModal(githubSyncModal);
    showModal(githubSetupModal);
});

githubSyncContent.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;

    if (button.classList.contains('push-to-github-btn')) {
        const projectName = button.dataset.projectName;
        if (confirm(`Are you sure you want to push "${projectName}" to GitHub? This will overwrite the remote version if it exists.`)) {
             pushProjectToGithub(projectName, button);
        }
    } else if (button.classList.contains('pull-from-github-btn')) {
        const projectName = button.dataset.projectName;
        const sha = button.dataset.sha;
        if (confirm(`Are you sure you want to pull "${projectName}" from GitHub? This will overwrite your local version if it exists.`)) {
            pullProjectFromGithub(projectName, sha, button);
        }
    }
});
