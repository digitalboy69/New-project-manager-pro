// Small shared helpers used by the other js/ files.
// (Loaded first, as a classic script after the page body; shares one global scope with the other js/ files.)

// Escape text before putting it into innerHTML or an HTML attribute.
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Read JSON from localStorage without crashing on missing or corrupted data.
function readStoredJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === '') return fallback;
        const parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) {
        console.warn(`Ignoring unreadable saved data for "${key}":`, e);
        return fallback;
    }
}

// Write JSON to localStorage; returns false (and tells the user once) if the browser refuses, e.g. storage full.
function writeStoredJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Could not save "${key}":`, e);
        alert('Could not save: browser storage is full or blocked. Export your projects to JSON to keep a backup.');
        return false;
    }
}

// Telegram MarkdownV2: escape every reserved character in normal text.
function escapeMarkdownV2(text) {
    return String(text).replace(/([_*\[\]()~`>#+=\-|{}.!\\])/g, '\\$1');
}

// Inside a MarkdownV2 code block only ` and \ need escaping.
function escapeMarkdownV2Code(text) {
    return String(text).replace(/([`\\])/g, '\\$1');
}
