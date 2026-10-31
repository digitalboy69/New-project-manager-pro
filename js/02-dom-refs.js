// Main-page DOM references and button/modal element lookups
// (Loaded as a classic script after the page body; shares one global scope with the other js/ files, in numeric order.)

const editorModal = document.getElementById('editorModal');
const addProjectBtn = document.getElementById('addProjectBtn');
const mainPageContent = document.getElementById('mainPageContent');
const mainHeader = document.getElementById('mainHeader');
const themeToggleBtn = document.getElementById('themeToggleBtn'); 
const projectCardsGrid = document.getElementById('projectCardsGrid');
const noProjectsMessage = document.getElementById('noProjectsMessage');
const fileUploader = document.getElementById('fileUploader');
const jsonFileUploader = document.getElementById('jsonFileUploader');
const iconFileUploader = document.getElementById('iconFileUploader');

// Import/Export buttons
const importProjectsBtn = document.getElementById('importProjectsBtn');
const exportProjectsBtn = document.getElementById('exportProjectsBtn');

// Telegram buttons and modal elements (Main Page scope)
const setupTelegramBtn = document.getElementById('setupTelegramBtn');
const exportAllTelegramBtn = document.getElementById('exportAllTelegramBtn');
const telegramSetupModal = document.getElementById('telegramSetupModal');
const botTokenInput = document.getElementById('botTokenInput');
const chatIdInput = document.getElementById('chatIdInput');
const saveTelegramSetup = document.getElementById('saveTelegramSetup');
const cancelTelegramSetup = document.getElementById('cancelTelegramSetup');

// GitHub Sync Elements
const githubSyncBtn = document.getElementById('githubSyncBtn');
const githubSetupModal = document.getElementById('githubSetupModal');
const githubSyncModal = document.getElementById('githubSyncModal');
const githubTokenInput = document.getElementById('githubTokenInput');
const githubUsernameInput = document.getElementById('githubUsernameInput');
const githubRepoInput = document.getElementById('githubRepoInput');
const saveGithubSetup = document.getElementById('saveGithubSetup');
const cancelGithubSetup = document.getElementById('cancelGithubSetup');
const openGithubSetupBtn = document.getElementById('openGithubSetupBtn');
const refreshSyncBtn = document.getElementById('refreshSyncBtn');
const cancelSync = document.getElementById('cancelSync');
const githubSyncContent = document.getElementById('githubSyncContent');
const githubSyncStatus = document.getElementById('githubSyncStatus');

// Webapp Generation elements
const makeWebappBtn = document.getElementById('makeWebappBtn');
const makeWebappModal = document.getElementById('makeWebappModal');
const webappProjectSelect = document.getElementById('webappProjectSelect');
const webappAppName = document.getElementById('webappAppName');
const webappPackageName = document.getElementById('webappPackageName');
const webappIconUploadBtn = document.getElementById('webappIconUploadBtn');
const webappIconStatus = document.getElementById('webappIconStatus');
const confirmWebapp = document.getElementById('confirmWebapp');
const cancelWebapp = document.getElementById('cancelWebapp');

// Shortcuts
const shortcutsBtn = document.getElementById('shortcutsBtn');
const shortcutsModal = document.getElementById('shortcutsModal');
const okShortcuts = document.getElementById('okShortcuts');


let editorInitialized = false; 
let currentEditorInstance = null; 
let currentIconFile = null; // Store icon file for webapp creation
