# JavaNote – Text-Based Note Taking Application

A warm, distraction-free, rich-text note taking app that runs entirely in your browser.
No server, no install, no dependencies.

---

## Files

```
JavaNote/
├── index.html   ← App structure & layout
├── style.css    ← All styling (light & dark mode)
├── app.js       ← All logic (notes, formatting, search, autosave)
└── README.md    ← This file
```

---

## How to Run

### Option 1 – Double-click (Easiest)
1. Download / unzip the `JavaNote` folder
2. Double-click `index.html`
3. It opens in your browser — done!

### Option 2 – VS Code Live Server
1. Open the `JavaNote` folder in VS Code
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

### Option 3 – Python local server
```bash
cd JavaNote
python -m http.server 8080
# Then open: http://localhost:8080
```

### Option 4 – Node.js (npx serve)
```bash
cd JavaNote
npx serve .
# Then open the URL shown in terminal
```

---

## Features

| Feature            | Details                                      |
|--------------------|----------------------------------------------|
| Rich text editor   | Bold, italic, underline, strikethrough       |
| Headings           | H1, H2, H3 and paragraph reset               |
| Lists              | Bullet and numbered lists                    |
| Blockquote         | Styled pull-quote formatting                 |
| Inline code        | Monospace code spans                         |
| Divider            | Horizontal rule                              |
| Alignment          | Left and center align                        |
| Undo / Redo        | Ctrl+Z / Ctrl+Y in editor                    |
| Auto-save          | Saves 700ms after you stop typing            |
| Search             | Instant sidebar search across all notes      |
| Word count         | Live count in toolbar and status bar         |
| Reading time       | Estimated reading time                       |
| Dark mode          | Toggle with ◐ button (persists across sessions) |
| Keyboard shortcut  | Ctrl+N (or Cmd+N) to create a new note       |
| Persistent storage | All notes saved in browser localStorage      |

---

## Browser Support

Works in all modern browsers: Chrome, Firefox, Edge, Safari.
No internet connection required after first load (fonts load from Google Fonts on first open).

---

*JavaNote v1.0 — Built with HTML, CSS & Vanilla JS*
