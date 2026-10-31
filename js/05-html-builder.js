// Builds the combined HTML document from a project
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Reusable HTML Generation Helper ---
function generateCombinedHTML(project, titleOverride = null) {
    const projectTitle = escapeHtml(titleOverride || project.name || 'Code Playground Project');
    // A closing </script> or </style> typed inside the code would end the block early, so neutralise it.
    const safeCss = String(project.css || '').replace(/<\/style/gi, '<\\/style');
    const safeJs = String(project.js || '').replace(/<\/script/gi, '<\\/script');
    // Note: CSS and JS are INLINED here for simple combined file download/preview
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectTitle}</title>
    <style>${safeCss}</style>
</head>
<body>
    ${project.html || ''}
    <script>${safeJs}<\/script>
</body>
</html>`;
}
