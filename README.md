# Project Manager

A browser-based code playground and project manager: write HTML, CSS and JS with a live preview, keep projects in your browser, import/export them as JSON, export to Telegram, sync with GitHub and package a project as a web app (ZIP). No build step.

## Run
Open `index.html` in a browser (or serve the folder with any static server).
`Make Webapp` loads JSZip from a CDN, so it needs an internet connection.

## Structure
```
index.html          page markup (header, project grid, modals) and script/style includes
css/                01 icons · 02 theme variables · 03 header · 04 buttons · 05 project cards
                    06 editor · 07 modals · 08 credits banner · 09 responsive
js/                 loaded in numeric order as classic scripts (shared global scope)
  00-utils             shared helpers (HTML escaping, safe saved-data read/write, Telegram escaping)
  01-editor-template   HTML string injected when the editor opens
  02-dom-refs          element lookups and shared state variables
  03-theme             dark/light theme
  04-modals            show/hide modal helpers
  05-html-builder      builds the combined HTML document from a project
  06-project-cards     project storage and card rendering
  07-editor-modal      open/close editor, persistent draft
  08-import-export     JSON import/export
  09-telegram          Telegram setup and export
  10-make-webapp       ZIP packaging
  11-github-sync       GitHub push/pull
  12-keyboard-shortcuts global shortcuts
  13-code-editor       the editor (find/replace, fullscreen, preview, save/load)
  14-file-upload-and-init  file uploader and first render
```
Keep the script order in `index.html`: later files use variables and functions from earlier ones.

## Notes
- Restructured from the single file `Project_manager_new_virtion.html` (still available in git history) with no change to the code itself.
- Removed leftovers from the old file: a duplicated outer HTML shell, browser-extension styles (dark-image filter, ad blocker rules) and an empty trailing script.
- Your GitHub and Telegram tokens are stored in your browser's localStorage (`githubConfig`, `telegramConfig`). Use tokens with the smallest permissions you can.
