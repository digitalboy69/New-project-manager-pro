// Telegram setup and export
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

// --- Telegram Setup & Export Logic (Shared Functions) ---

function getTelegramConfig() {
    const config = readStoredJson('telegramConfig', null);
    return { token: String((config && config.token) || ''), chatId: String((config && config.chatId) || '') };
}

function saveTelegramConfig(token, chatId) {
    writeStoredJson('telegramConfig', { token, chatId });
}

// Setup Modal Handlers
setupTelegramBtn.addEventListener('click', () => {
    const config = getTelegramConfig();
    botTokenInput.value = config.token;
    chatIdInput.value = config.chatId;
    showModal(telegramSetupModal);
});

saveTelegramSetup.addEventListener('click', () => {
    const token = botTokenInput.value.trim();
    const chatId = chatIdInput.value.trim();
    if (!token || !chatId) {
        alert('Both Bot Token and Chat ID are required.');
        return;
    }
    saveTelegramConfig(token, chatId);
    hideModal(telegramSetupModal);
    alert('Telegram configuration saved successfully!');
});

cancelTelegramSetup.addEventListener('click', () => hideModal(telegramSetupModal));

async function sendToTelegram(payload, isDocument = false, projectName = 'Project Manager', filename = null, mimeType = null) {
    const config = getTelegramConfig();
    const token = config.token.trim();
    const chatId = config.chatId.trim();

    if (!token || !chatId) {
        alert('Telegram Bot not configured. Please set up the Bot Token and Chat ID first.');
        showModal(telegramSetupModal);
        return false;
    }

    let apiUrl;
    let fetchOptions = {};
    const markdownCaption = `*Project:* ${escapeMarkdownV2(projectName)}`;

    if (isDocument && payload instanceof Blob && filename && mimeType) {
        apiUrl = `https://api.telegram.org/bot${token}/sendDocument`;
        
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', markdownCaption);
        formData.append('parse_mode', 'MarkdownV2');
        formData.append('document', payload, filename);

        fetchOptions.method = 'POST';
        fetchOptions.body = formData;

    } else if (typeof payload === 'string') {
        apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        
        fetchOptions.method = 'POST';
        fetchOptions.headers = { 'Content-Type': 'application/json' };
        fetchOptions.body = JSON.stringify({ 
            chat_id: chatId, 
            text: payload,
            parse_mode: 'MarkdownV2' 
        });
    } else {
        console.error("Invalid payload type for Telegram export.");
        return false;
    }
    
    try {
        const response = await fetch(apiUrl, fetchOptions);
        const data = await response.json();

        if (data.ok) {
            return true;
        } else {
            let errorMessage = `Failed to send to Telegram (Status: ${response.status}).`;
            if (data.description) {
                errorMessage += ` Error: ${data.description}`;
            } else if (data.error_code === 401) {
                errorMessage += ' Error: Invalid Bot Token.';
            } else if (data.error_code === 400 && data.description.includes("chat not found")) {
                errorMessage += ' Error: Invalid Chat ID or bot is not a member of the chat.';
            }
            alert(errorMessage);
            console.error("Telegram error data:", data);
            return false;
        }
    } catch (error) {
        alert('Network error while connecting to Telegram API.');
        console.error('Telegram API error:', error);
        return false;
    }
}

// Export All Projects Handler (Sends individual HTML files)
exportAllTelegramBtn.addEventListener('click', async () => {
    const projects = getProjects();
    if (projects.length === 0) {
        alert('No projects to export.');
        return;
    }

    if (!confirm(`Are you sure you want to export all ${projects.length} saved projects to Telegram as individual HTML files?`)) {
        return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const project of projects) {
        const combinedCode = generateCombinedHTML(project); 
        const fileName = `${project.name.replace(/[^a-z0-9_.-]/gi, '_')}.html`;
        const blob = new Blob([combinedCode], { type: 'text/html' });

        const sent = await sendToTelegram(blob, true, project.name, fileName, 'text/html');

        if (sent) {
            successCount++;
        } else {
            failedCount++;
            // Stop if the first failure is a configuration issue
            const config = getTelegramConfig();
            if (!config.token || !config.chatId) break; 
        }
    }

    alert(`Export finished. Successes: ${successCount} files sent. Failures: ${failedCount}.`);
});
