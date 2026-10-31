// Import and export projects as JSON
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Import/Export JSON Functions ---
exportProjectsBtn.addEventListener('click', () => {
    const projects = getProjects();
    const dataStr = JSON.stringify(projects, null, 2); 
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code_playground_projects.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

importProjectsBtn.addEventListener('click', () => {
    jsonFileUploader.value = null; 
    jsonFileUploader.click();
});

jsonFileUploader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedProjects = JSON.parse(e.target.result);
            if (!Array.isArray(importedProjects)) {
                alert('Invalid JSON file format. Expected an array of projects.');
                return;
            }

            let currentProjects = getProjects();
            let importedCount = 0;
            let skippedCount = 0;

            importedProjects.forEach(newProject => {
                if (newProject && typeof newProject === 'object' && typeof newProject.name === 'string' && newProject.name.trim()) {

                    // Ensure it's a valid project format (text fields are strings, and there is always a timestamp)
                    ['html', 'css', 'js'].forEach(k => { if (typeof newProject[k] !== 'string') newProject[k] = ''; });
                    if (isNaN(new Date(newProject.timestamp).getTime())) newProject.timestamp = new Date().toISOString();

                    const existingIndex = currentProjects.findIndex(p => p.name === newProject.name);

                    if (existingIndex === -1) {
                        currentProjects.push(newProject);
                        importedCount++;
                    } else {
                        // Overwrite if imported is newer
                        const localTimestamp = new Date(currentProjects[existingIndex].timestamp || 0);
                        const importTimestamp = new Date(newProject.timestamp || 0);
                        if (importTimestamp > localTimestamp) {
                            currentProjects[existingIndex] = newProject;
                            importedCount++;
                        } else {
                            skippedCount++;
                        }
                    }
                } else {
                    console.warn('Skipping malformed project entry:', newProject);
                }
            });

            saveProjects(currentProjects); 
            alert(`Import complete!\n${importedCount} projects imported or updated.\n${skippedCount} projects skipped (local version was newer or identical).`);

        } catch (error) {
            alert('Error parsing JSON file. Please ensure it is a valid JSON format.');
            console.error('Import error:', error);
        }
    };
    reader.onerror = function() {
        alert('Error reading file.');
        console.error("File reading error:", reader.error);
    };
    reader.readAsText(file);
});
