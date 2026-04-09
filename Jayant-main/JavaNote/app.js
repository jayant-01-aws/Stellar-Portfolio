// ─── JavaNote – app.js ───

'use strict';

// ══════════════════════════════════════
//  State
// ══════════════════════════════════════
let notes    = [];
let activeId = null;
let saveTimer = null;
let searchQuery = '';

const STORAGE_KEY = 'javanote_v1';

// ══════════════════════════════════════
//  Storage
// ══════════════════════════════════════
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch {
    notes = [];
  }
}

function persistNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ══════════════════════════════════════
//  Utilities
// ══════════════════════════════════════
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function getPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
}

function countWords(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function readingTime(words) {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? '<1 min' : `~${mins} min`;
}

// ══════════════════════════════════════
//  Status Indicators
// ══════════════════════════════════════
function setSaveStatus(state) {
  const el = document.getElementById('save-status');
  if (state === 'saving') {
    el.textContent = 'Saving…';
    el.className   = 'saving';
  } else {
    el.textContent = 'All saved';
    el.className   = 'saved';
    setTimeout(() => { el.className = ''; }, 2000);
  }
}

// ══════════════════════════════════════
//  Render Notes List
// ══════════════════════════════════════
function renderList() {
  const list = document.getElementById('notes-list');
  const countEl = document.getElementById('notes-count');
  const footerCount = document.getElementById('footer-count');

  // Sort newest first
  let sorted = [...notes].sort((a, b) => b.updated - a.updated);

  // Apply search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    sorted = sorted.filter(n =>
      (n.title + getPlainText(n.content)).toLowerCase().includes(q)
    );
  }

  footerCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
  countEl.textContent     = searchQuery
    ? `${sorted.length} result${sorted.length !== 1 ? 's' : ''}`
    : `All notes`;

  list.innerHTML = '';

  if (!sorted.length) {
    list.innerHTML = `<div class="empty-notes-msg">${
      searchQuery ? 'No notes match your search.' : 'No notes yet.<br>Click <b>+ New Note</b> to start.'
    }</div>`;
    return;
  }

  sorted.forEach(n => {
    const el = document.createElement('div');
    el.className = 'note-item' + (n.id === activeId ? ' active' : '');
    const preview = getPlainText(n.content).slice(0, 70) || 'Empty note…';
    el.innerHTML = `
      <div class="ni-title">${escapeHtml(n.title) || 'Untitled'}</div>
      <div class="ni-date">${fmtDate(n.updated)}</div>
      <div class="ni-preview">${escapeHtml(preview)}</div>
    `;
    el.addEventListener('click', () => openNote(n.id));
    list.appendChild(el);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════
//  Open / Close Note
// ══════════════════════════════════════
function openNote(id) {
  activeId = id;
  const n = notes.find(x => x.id === id);
  if (!n) return;

  // Show editor, hide empty state
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('note-editor').classList.remove('hidden');

  // Populate fields
  document.getElementById('note-title').value = n.title || '';
  document.getElementById('note-date').textContent  = fmtDate(n.updated) + ' ' + fmtTime(n.updated);
  document.getElementById('editor').innerHTML = n.content || '';

  updateStats(n);
  renderList();

  // Focus editor
  setTimeout(() => {
    const ed = document.getElementById('editor');
    ed.focus();
    // Move cursor to end
    const range = document.createRange();
    const sel   = window.getSelection();
    range.selectNodeContents(ed);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, 50);
}

// ══════════════════════════════════════
//  New Note
// ══════════════════════════════════════
function newNote() {
  const n = {
    id:      genId(),
    title:   '',
    content: '',
    created: Date.now(),
    updated: Date.now(),
  };
  notes.unshift(n);
  persistNotes();
  openNote(n.id);
  // Focus title immediately
  setTimeout(() => document.getElementById('note-title').focus(), 60);
}

// ══════════════════════════════════════
//  Delete Note
// ══════════════════════════════════════
function deleteNote() {
  if (!activeId) return;
  const n = notes.find(x => x.id === activeId);
  const name = n?.title || 'Untitled';
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  notes = notes.filter(x => x.id !== activeId);
  persistNotes();
  activeId = null;

  document.getElementById('note-editor').classList.add('hidden');
  document.getElementById('empty-state').classList.remove('hidden');
  renderList();
}

// ══════════════════════════════════════
//  Update Title
// ══════════════════════════════════════
function updateTitle(val) {
  if (!activeId) return;
  const n = notes.find(x => x.id === activeId);
  if (!n) return;
  n.title   = val;
  n.updated = Date.now();
  scheduleSave();
}

// ══════════════════════════════════════
//  Editor Input Handler
// ══════════════════════════════════════
function onEditorInput() {
  if (!activeId) return;
  const n = notes.find(x => x.id === activeId);
  if (!n) return;
  n.content = document.getElementById('editor').innerHTML;
  n.updated = Date.now();
  updateStats(n);
  scheduleSave();
}

// ══════════════════════════════════════
//  Stats
// ══════════════════════════════════════
function updateStats(n) {
  const plain = getPlainText(n.content || '');
  const words = countWords(plain);
  const chars = plain.length;
  const lines = (n.content || '').split(/<br|<\/p>|<\/h[1-6]>|<\/li>/i).length;
  const read  = readingTime(words);

  document.getElementById('word-count-badge').textContent = `${words} words`;
  document.getElementById('sb-words').textContent = `${words} words`;
  document.getElementById('sb-chars').textContent = `${chars} characters`;
  document.getElementById('sb-lines').textContent = `${Math.max(1, lines)} lines`;
  document.getElementById('sb-read').textContent  = `${read} read`;
  document.getElementById('sb-updated').textContent =
    n.updated ? `Last saved: ${fmtTime(n.updated)}` : 'Not saved';
}

// ══════════════════════════════════════
//  Save Scheduler
// ══════════════════════════════════════
function scheduleSave() {
  setSaveStatus('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persistNotes();
    renderList();
    setSaveStatus('saved');

    // Update the date in UI
    const n = notes.find(x => x.id === activeId);
    if (n) document.getElementById('note-date').textContent = fmtDate(n.updated) + ' ' + fmtTime(n.updated);
  }, 700);
}

// ══════════════════════════════════════
//  Filter Notes (Search)
// ══════════════════════════════════════
function filterNotes(val) {
  searchQuery = val.trim();
  renderList();
}

// ══════════════════════════════════════
//  Formatting Commands
// ══════════════════════════════════════
function fmt(cmd, val) {
  document.getElementById('editor').focus();
  document.execCommand(cmd, false, val || null);
  onEditorInput();
}

function wrapCode() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const text  = range.toString();
  if (!text) return;
  const code = document.createElement('code');
  code.textContent = text;
  range.deleteContents();
  range.insertNode(code);
  sel.removeAllRanges();
  onEditorInput();
}

// ══════════════════════════════════════
//  Keyboard Shortcuts
// ══════════════════════════════════════
function handleKeydown(e) {
  // Tab → indent with 2 spaces
  if (e.key === 'Tab') {
    e.preventDefault();
    document.execCommand('insertHTML', false, '&nbsp;&nbsp;');
    return;
  }
}

// Global shortcuts
document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'n') { e.preventDefault(); newNote(); }
});

// ══════════════════════════════════════
//  Dark Mode Toggle
// ══════════════════════════════════════
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('javanote_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadTheme() {
  const saved = localStorage.getItem('javanote_theme');
  if (saved === 'dark') document.body.classList.add('dark');
}

// ══════════════════════════════════════
//  Bootstrap
// ══════════════════════════════════════
(function init() {
  loadTheme();
  loadNotes();

  // Seed demo note if fresh install
  if (!notes.length) {
    const demo = {
      id:      genId(),
      title:   'Welcome to JavaNote ☕',
      content: `<h2>Welcome to JavaNote</h2>
<p>A warm, focused, text-based note-taking app designed for writers and thinkers.</p>
<h3>Features</h3>
<ul>
  <li><b>Rich text formatting</b> – Bold, italic, headings, lists, quotes, code</li>
  <li><b>Instant search</b> – Find notes as you type</li>
  <li><b>Auto-save</b> – Your work is saved automatically</li>
  <li><b>Word count</b> – Live stats in the status bar</li>
  <li><b>Dark mode</b> – Toggle with the ◐ button</li>
  <li><b>Keyboard shortcut</b> – Ctrl+N to create a new note</li>
</ul>
<blockquote>Great ideas deserve great notes. Start writing below.</blockquote>
<p>Click <b>+ New Note</b> in the sidebar to create your first entry.</p>`,
      created: Date.now(),
      updated: Date.now(),
    };
    notes = [demo];
    persistNotes();
  }

  renderList();

  // Open most recent note on load
  if (notes.length) {
    const sorted = [...notes].sort((a, b) => b.updated - a.updated);
    openNote(sorted[0].id);
  }
})();
