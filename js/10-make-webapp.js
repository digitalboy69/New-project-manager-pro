// Make Webapp (ZIP packaging with JSZip)
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Make Webapp Feature Logic ---
makeWebappBtn.addEventListener('click', openMakeWebappModal);

function updateWebappProjectList() {
     const projects = getProjects();
     webappProjectSelect.innerHTML = '<option value="">-- Select a project --</option>';
     projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        webappProjectSelect.appendChild(opt);
     });
}

function openMakeWebappModal() {
    updateWebappProjectList();
    webappAppName.value = '';
    webappPackageName.value = '/';
    currentIconFile = null;
    webappIconStatus.textContent = 'No icon selected. Will use default.';
    showModal(makeWebappModal);
}

webappIconUploadBtn.addEventListener('click', () => {
    iconFileUploader.value = null;
    iconFileUploader.click();
});

iconFileUploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentIconFile = file;
        webappIconStatus.textContent = `Icon selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    } else {
        currentIconFile = null;
        webappIconStatus.textContent = 'No icon selected. Will use default.';
    }
});

cancelWebapp.addEventListener('click', () => hideModal(makeWebappModal));
confirmWebapp.addEventListener('click', confirmMakeWebapp);

async function confirmMakeWebapp() {
    const projectName = webappProjectSelect.value;
    const appName = webappAppName.value.trim();
    const startUrl = webappPackageName.value.trim();
    
    if (!projectName) { alert('Please select a project.'); return; }
    if (!appName) { alert('Please enter an Application Name.'); return; }
    if (!startUrl) { alert('Please enter a Start URL (e.g., / or /index.html).'); return; }

    const project = getProjects().find(p => p.name === projectName);
    if (!project) { alert('Project not found.'); return; }
    
    if (typeof JSZip === 'undefined') {
        alert('The ZIP library could not be loaded (you may be offline). Connect to the internet and reload the page, then try again.');
        return;
    }

    hideModal(makeWebappModal);
    
    alert('Building Webapp ZIP. Please wait...');

    try {
        const zip = new JSZip();

        // --- 1. Core Files (Index, CSS, JS) ---
        const htmlContent = project.html || '';
        const cssContent = project.css || '/* Add your CSS here */';
        const jsContent = project.js || '/* Add your JavaScript here */';

        // Save raw code files
        zip.file('style.css', cssContent);
        zip.file('script.js', jsContent);
        
        // --- 2. Manifest and Index.html linking files ---
        const iconFileName = currentIconFile ? currentIconFile.name : 'default_icon.png';
        const iconPath = `icon/${iconFileName}`;
        
        // Basic HTML escaping function
        function escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        const pwaIndexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(appName)}</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" href="${escapeHtml(iconPath)}">
    <meta name="theme-color" content="#007AFF">
    <!-- PWA enhancements -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <script src="script.js" defer><\/script>
</head>
<body>
    ${htmlContent}
</body>
</html>`;


        zip.file('index.html', pwaIndexHtml);

        const manifest = {
            name: appName,
            short_name: appName,
            start_url: startUrl,
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#007AFF',
            icons: [
                // Ensure 512x512 is available for maximum compatibility
                {
                    src: iconPath,
                    sizes: '512x512', 
                    type: currentIconFile ? (currentIconFile.type || 'image/png') : 'image/png' 
                }
            ]
        };
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));


        // --- 3. Icon Handling ---
        if (currentIconFile) {
            const iconData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]); // Base64 data
                reader.onerror = reject;
                reader.readAsDataURL(currentIconFile);
            });
            // Add icon file to 'icon' subdirectory
            zip.file(iconPath, iconData, { base64: true });

        } else {
            // Create a simple, minimal default icon file (a dummy white square) if none provided
             const defaultIconData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
             zip.file('icon/default_icon.png', defaultIconData, { base64: true });
        }
        
        // --- 4. Generate & Download ZIP ---
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const fileName = `${appName.toLowerCase().replace(/\s/g, '-')}-webapp.zip`;
        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        alert('Webapp ZIP downloaded successfully!');

    } catch (error) {
        console.error('Webapp creation error:', error);
        alert('Failed to create webapp: ' + error.message);
    }
}
