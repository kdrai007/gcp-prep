# GCP Quiz Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the static GCP quiz page into a premium, responsive single-page web application featuring multiple study modes (Practice, Exam, Flashcard), modern Glassmorphism aesthetics, progress analytics, and local persistence.

**Architecture:** A client-side state-driven SPA implemented with ES6 JavaScript modules. App state changes trigger visual rendering updates. A simple router manages hash navigation (`#/dashboard`, `#/practice`, etc.).

**Tech Stack:** Vanilla HTML5, CSS Custom Properties, Vanilla ES6 JavaScript, Google Fonts (Outfit).

---

## Plan Sequence

### Task 1: Setup HTML Skeleton and Directory Structure

**Files:**
- Modify: `index.html`
- Create empty files:
  - `js/state.js`
  - `js/storage.js`
  - `js/views/dashboard.js`
  - `js/views/practice.js`
  - `js/views/exam.js`
  - `js/views/flashcard.js`
  - `js/views/review.js`
  - `js/app.js`

**Step 1: Write the updated `index.html`**
Update `index.html` to establish the semantic skeleton, include CSS/fonts, and script module loader.

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-site-verification" content="Dtlk3nsllAtc5KSiYkIFV6zoU3-6bZ1_rOyuFiDODkE" />
  <title>GCP Associate Cloud Engineer Practice Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-layout">
    <!-- Premium Header -->
    <header class="app-header">
      <div class="logo-container">
        <span class="logo-icon">☁️</span>
        <h1>GCP ACE Practice Hub</h1>
      </div>
      <div class="header-actions">
        <button id="theme-toggle" class="btn-icon" aria-label="Toggle Theme">🌓</button>
      </div>
    </header>

    <!-- Main Container -->
    <main class="app-main" id="app-view">
      <div class="loading-spinner">Loading GCP practice hub...</div>
    </main>
  </div>

  <!-- Entry Script as Module -->
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

**Step 2: Run verification**
1. Check that the file creates successfully.
2. Confirm the directory structure using `ls -R`.

**Step 3: Commit**
```bash
git add index.html
git commit -m "chore: setup new HTML layout and module placeholders"
```

---

### Task 2: State and LocalStorage Engines

**Files:**
- Create: `js/state.js`
- Create: `js/storage.js`

**Step 1: Write implementation for `js/state.js`**
Define the application state and core mutation handlers.

```javascript
export const state = {
  questions: [],
  filteredQuestions: [],
  currentView: 'dashboard',
  currentQuestionIndex: 0,
  activeMode: null, // 'practice' | 'exam' | 'flashcard'
  bookmarks: [],
  practiceProgress: {}, // { questionId: { attempted: true, correct: true } }
  history: [], // { id, score, date, elapsed, total }
  
  examSession: {
    questions: [],
    answers: {}, // { index: optionIndex }
    timeRemaining: 0,
    timerId: null
  }
};

export function setView(viewName) {
  state.currentView = viewName;
  window.location.hash = `#/${viewName}`;
}

export function resetExam() {
  if (state.examSession.timerId) {
    clearInterval(state.examSession.timerId);
    state.examSession.timerId = null;
  }
  state.examSession = {
    questions: [],
    answers: {},
    timeRemaining: 0,
    timerId: null
  };
}
```

**Step 2: Write implementation for `js/storage.js`**
Define local persistence for tracking bookmarks, histories, and practice progress.

```javascript
const KEYS = {
  BOOKMARKS: 'gcp_quiz_bookmarks',
  HISTORY: 'gcp_quiz_history',
  PRACTICE: 'gcp_quiz_practice'
};

export const storage = {
  saveBookmarks(bookmarks) {
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },
  loadBookmarks() {
    return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS)) || [];
  },
  saveHistory(history) {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },
  loadHistory() {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
  },
  savePractice(practice) {
    localStorage.setItem(KEYS.PRACTICE, JSON.stringify(practice));
  },
  loadPractice() {
    return JSON.parse(localStorage.getItem(KEYS.PRACTICE)) || {};
  }
};
```

**Step 3: Run verification**
We will verify that importing state works without syntax errors.

**Step 4: Commit**
```bash
git add js/state.js js/storage.js
git commit -m "feat: implement state and storage modules"
```

---

### Task 3: Create Modern CSS Theme and Styles

**Files:**
- Modify: `style.css`

**Step 1: Write CSS variables and reset rules**
Replace `style.css` with custom theme support, Layouts (Grid/Flexbox), card styling, and animations.

```css
/* Custom variables */
:root {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-card-bg: rgba(30, 41, 59, 0.7);
  --color-card-border: rgba(148, 163, 184, 0.1);
  --color-text-main: #f8fafc;
  --color-text-muted: #94a3b8;
  
  --color-gcp-blue: #4285f4;
  --color-gcp-red: #ea4335;
  --color-gcp-yellow: #fbbb05;
  --color-gcp-green: #34a853;
  
  --font-sans: 'Outfit', 'Inter', -apple-system, sans-serif;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-premium: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  --glass-blur: blur(12px);
  --max-width: 900px;
}

[data-theme="light"] {
  --color-bg-primary: #f8fafc;
  --color-bg-secondary: #f1f5f9;
  --color-card-bg: rgba(255, 255, 255, 0.85);
  --color-card-border: rgba(148, 163, 184, 0.2);
  --color-text-main: #0f172a;
  --color-text-muted: #64748b;
  --shadow-premium: 0 10px 30px -10px rgba(15, 23, 42, 0.08);
}

/* Global Reset & Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg-primary);
  color: var(--color-text-main);
  line-height: 1.6;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow-x: hidden;
}

/* App Layout */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-card-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.75rem;
}

.logo-container h1 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Views Wrapper */
.app-main {
  flex: 1;
  max-width: var(--max-width);
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Dashboard Styles */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1.2fr 0.8fr;
  }
}

.stats-card {
  background: var(--color-card-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-card-border);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-rings-container {
  display: flex;
  justify-content: space-around;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-ring-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-ring {
  position: relative;
  width: 100px;
  height: 100px;
}

.stat-ring svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.ring-bg {
  fill: none;
  stroke: var(--color-bg-secondary);
  stroke-width: 8;
}

.ring-fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}

.stat-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 1.25rem;
}

.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.mode-card {
  background: var(--color-card-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-card-border);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-premium);
}

.mode-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-gcp-blue);
  box-shadow: 0 12px 24px -10px rgba(66, 133, 244, 0.2);
}

.mode-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-card p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Filters & Search Control styling */
.search-filter-panel {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 600px) {
  .search-filter-panel {
    flex-direction: row;
  }
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.input-text, .select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-card-border);
  border-radius: 8px;
  color: var(--color-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: var(--transition-smooth);
}

.input-text:focus, .select-input:focus {
  border-color: var(--color-gcp-blue);
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.15);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: var(--transition-smooth);
  border: none;
  font-size: 0.95rem;
}

.btn-primary {
  background: var(--color-gcp-blue);
  color: #fff;
}

.btn-primary:hover {
  background: #2b75e2;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-card-border);
  color: var(--color-text-main);
}

.btn-secondary:hover {
  background: rgba(148, 163, 184, 0.15);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-smooth);
}

.btn-icon:hover {
  background: rgba(148, 163, 184, 0.15);
}

/* Quiz UI (Practice/Exam) Cards */
.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow-premium);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.quiz-meta {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.question-text {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  margin-bottom: 1.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition-smooth);
  gap: 0.75rem;
}

.option-item:hover {
  border-color: var(--color-gcp-blue);
  transform: translateX(4px);
}

.option-letter {
  background: rgba(148, 163, 184, 0.15);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.85rem;
}

.option-item.correct {
  border-color: var(--color-gcp-green);
  background: rgba(52, 168, 83, 0.1);
}

.option-item.correct .option-letter {
  background: var(--color-gcp-green);
  color: white;
}

.option-item.incorrect {
  border-color: var(--color-gcp-red);
  background: rgba(234, 67, 53, 0.1);
}

.option-item.incorrect .option-letter {
  background: var(--color-gcp-red);
  color: white;
}

.explanation-panel {
  background: rgba(52, 168, 83, 0.08);
  border-left: 4px solid var(--color-gcp-green);
  padding: 1.25rem;
  border-radius: 0 10px 10px 0;
  margin-top: 1.5rem;
  font-size: 0.95rem;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Exam Mode Navigation */
.exam-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .exam-layout {
    grid-template-columns: 1fr 280px;
  }
}

.exam-nav-sidebar {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.exam-timer {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gcp-yellow);
  text-align: center;
  padding: 0.5rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.grid-num {
  padding: 0.5rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-card-border);
  border-radius: 6px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.grid-num:hover {
  border-color: var(--color-gcp-blue);
}

.grid-num.active {
  background: var(--color-gcp-blue);
  color: white;
  border-color: var(--color-gcp-blue);
}

.grid-num.answered {
  background: rgba(148, 163, 184, 0.25);
  border-color: var(--color-text-muted);
}

/* Flashcard Styles */
.flashcard-wrapper {
  perspective: 1000px;
  width: 100%;
  max-width: 600px;
  height: 380px;
  margin: 2rem auto;
}

.flashcard {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--color-card-border);
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.card-front {
  background: var(--color-card-bg);
}

.card-back {
  background: var(--color-bg-secondary);
  transform: rotateY(180deg);
  overflow-y: auto;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.25rem;
  color: var(--color-text-muted);
}
```

**Step 2: Run verification**
1. Check syntax errors in CSS (none should exist).

**Step 3: Commit**
```bash
git add style.css
git commit -m "feat: complete base styling system with Dark Mode custom properties"
```

---

### Task 4: Base Router and Dashboard View

**Files:**
- Create: `js/views/dashboard.js`
- Create: `js/app.js`

**Step 1: Write Dashboard view logic in `js/views/dashboard.js`**
Construct the Dashboard, progress indicators, search/filters, and study mode selection.

```javascript
import { state, setView } from '../state.js';

export function renderDashboard() {
  const container = document.getElementById('app-view');
  
  // Calculate statistics
  const total = state.questions.length;
  const attempted = Object.keys(state.practiceProgress).length;
  const correct = Object.values(state.practiceProgress).filter(p => p.correct).length;
  
  const completionPercent = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  
  // Dynamically extract categories
  const categories = [...new Set(state.questions.flatMap(q => q.category || ['General']))];
  
  container.innerHTML = `
    <div class="search-filter-panel">
      <div class="search-input-wrapper">
        <input type="text" id="search-bar" class="input-text" placeholder="Search questions (e.g. IAM, Storage)...">
      </div>
      <div>
        <select id="category-filter" class="select-input">
          <option value="all">All Topics</option>
          ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Statistics Widget -->
      <section class="stats-card">
        <h2>Your Progress Dashboard</h2>
        <div class="progress-rings-container">
          <div class="stat-ring-wrapper">
            <div class="stat-ring">
              <svg>
                <circle class="ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="ring-fill" cx="50" cy="50" r="40" stroke="var(--color-gcp-blue)" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * completionPercent) / 100}"></circle>
              </svg>
              <div class="stat-percent">${completionPercent}%</div>
            </div>
            <span>Completion Rate</span>
          </div>
          <div class="stat-ring-wrapper">
            <div class="stat-ring">
              <svg>
                <circle class="ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="ring-fill" cx="50" cy="50" r="40" stroke="var(--color-gcp-green)" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * accuracyPercent) / 100}"></circle>
              </svg>
              <div class="stat-percent">${accuracyPercent}%</div>
            </div>
            <span>Accuracy Score</span>
          </div>
        </div>
        <p style="text-align: center; color: var(--color-text-muted); font-size: 0.9rem;">
          Solved ${attempted} of ${total} practice questions (${correct} correct)
        </p>
      </section>

      <!-- Selection Cards -->
      <section class="mode-cards">
        <div class="mode-card" id="mode-practice">
          <h3>📖 Practice Mode</h3>
          <p>Go through all questions at your own pace with instant answer checks and explanations.</p>
        </div>
        <div class="mode-card" id="mode-exam">
          <h3>⏱️ Exam Mode</h3>
          <p>Simulate the actual GCP ACE Exam. 50 random questions, 120 minutes, with summary results.</p>
        </div>
        <div class="mode-card" id="mode-flashcard">
          <h3>🗂️ Flashcard Mode</h3>
          <p>Quick recall practice. Look at the question, flip to review the correct concept.</p>
        </div>
      </section>
    </div>
  `;

  // Attach Event Listeners
  document.getElementById('mode-practice').addEventListener('click', () => setView('practice'));
  document.getElementById('mode-exam').addEventListener('click', () => setView('exam'));
  document.getElementById('mode-flashcard').addEventListener('click', () => setView('flashcard'));
}
```

**Step 2: Write entry point in `js/app.js`**
Fetch data and orchestrate the client-side router.

```javascript
import { state } from './state.js';
import { storage } from './storage.js';
import { renderDashboard } from './views/dashboard.js';
import { renderPractice } from './views/practice.js';
import { renderExam } from './views/exam.js';
import { renderFlashcard } from './views/flashcard.js';
import { renderReview } from './views/review.js';

// Route router mapping
const routes = {
  'dashboard': renderDashboard,
  'practice': renderPractice,
  'exam': renderExam,
  'flashcard': renderFlashcard,
  'review': renderReview
};

function router() {
  const hash = window.location.hash.slice(2) || 'dashboard';
  const renderView = routes[hash] || renderDashboard;
  state.currentView = hash;
  
  // Clear any exam timers if navigating away from exam
  if (hash !== 'exam' && state.examSession.timerId) {
    clearInterval(state.examSession.timerId);
    state.examSession.timerId = null;
  }
  
  renderView();
}

async function initializeApp() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Data fetch failed');
    
    const data = await res.json();
    
    // Tag dynamically based on questions keywords
    state.questions = data.map(q => {
      let category = 'General';
      const text = (q.question + ' ' + q.explanation).toLowerCase();
      if (text.includes('gke') || text.includes('kubernetes')) category = 'GKE / Containers';
      else if (text.includes('iam') || text.includes('role') || text.includes('permission')) category = 'Identity & IAM';
      else if (text.includes('storage') || text.includes('bucket')) category = 'Cloud Storage';
      else if (text.includes('sql') || text.includes('spanner') || text.includes('firestore') || text.includes('bigtable')) category = 'Databases';
      else if (text.includes('subnet') || text.includes('vpc') || text.includes('dns') || text.includes('load balancing')) category = 'Networking';
      else if (text.includes('compute') || text.includes('instance') || text.includes('vm')) category = 'Compute Engine';
      
      return { ...q, category };
    });
    
    // Load local storage states
    state.bookmarks = storage.loadBookmarks();
    state.practiceProgress = storage.loadPractice();
    state.history = storage.loadHistory();
    
    // Listen for hash changes
    window.addEventListener('hashchange', router);
    
    // Initial Route
    router();
  } catch (err) {
    document.getElementById('app-view').innerHTML = `<div class="explanation-panel" style="border-left-color: var(--color-gcp-red); background: rgba(234, 67, 53, 0.1);">Error launching app: ${err.message}</div>`;
  }
}

// Dark Mode Toggle logic
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', targetTheme);
});

window.addEventListener('DOMContentLoaded', initializeApp);
```

**Step 3: Run verification**
1. Check router navigation logic.

**Step 4: Commit**
```bash
git add js/app.js js/views/dashboard.js
git commit -m "feat: implement SPA router and dashboard view"
```

---

### Task 5: Practice Mode Implementation

**Files:**
- Create: `js/views/practice.js`

**Step 1: Write Practice Mode code**
Enable single-question steps, direct visual selection validation (highlights green/red), bookmark flags, and option buttons.

```javascript
import { state, setView } from '../state.js';
import { storage } from '../storage.js';

export function renderPractice() {
  const container = document.getElementById('app-view');
  
  let index = state.currentQuestionIndex;
  const q = state.questions[index];
  
  if (!q) {
    container.innerHTML = `<div>No questions found. <button class="btn btn-primary" id="back-dash">Back to Dashboard</button></div>`;
    document.getElementById('back-dash').addEventListener('click', () => setView('dashboard'));
    return;
  }
  
  const total = state.questions.length;
  const isBookmarked = state.bookmarks.includes(q.id);
  const progressRecord = state.practiceProgress[q.id];
  
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  container.innerHTML = `
    <div class="quiz-container">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" id="practice-back">← Back</button>
        <button class="btn btn-secondary" id="practice-bookmark">${isBookmarked ? '⭐ Bookmarked' : '☆ Bookmark'}</button>
      </div>

      <div class="quiz-card">
        <div class="quiz-header">
          <span class="quiz-meta">Question ${index + 1} of ${total}</span>
          <span class="quiz-meta" style="background: rgba(66, 133, 244, 0.1); color: var(--color-gcp-blue); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
            ${q.category}
          </span>
        </div>
        
        <p class="question-text">${q.question}</p>
        
        <ul class="options-list" id="options-list">
          ${q.options.map((opt, i) => `
            <li class="option-item" data-index="${i}">
              <span class="option-letter">${optionLetters[i]}</span>
              <span>${opt}</span>
            </li>
          `).join('')}
        </ul>

        <div id="practice-explanation" class="explanation-panel" style="display: none;">
          <strong>Correct Answer: ${optionLetters[q.correct]}) ${q.options[q.correct]}</strong>
          <p style="margin-top: 0.5rem;">${q.explanation}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between;">
        <button class="btn btn-secondary" id="prev-btn" ${index === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary" id="next-btn" ${index === total - 1 ? 'disabled' : ''}>Next</button>
      </div>
    </div>
  `;

  const options = document.querySelectorAll('.option-item');
  const explanationPanel = document.getElementById('practice-explanation');
  
  // Show explanation if already answered in state
  if (progressRecord) {
    revealAnswer(progressRecord.correctAnswerIndex, progressRecord.selectedAnswerIndex);
  }

  function revealAnswer(correctIdx, selectedIdx) {
    options.forEach(item => {
      const idx = parseInt(item.getAttribute('data-index'));
      if (idx === correctIdx) {
        item.classList.add('correct');
      } else if (idx === selectedIdx) {
        item.classList.add('incorrect');
      }
      item.style.pointerEvents = 'none'; // Lock choices
    });
    explanationPanel.style.display = 'block';
  }

  // Answer selection event
  document.getElementById('options-list').addEventListener('click', (e) => {
    const item = e.target.closest('.option-item');
    if (!item) return;
    
    const selectedIdx = parseInt(item.getAttribute('data-index'));
    const isCorrect = selectedIdx === q.correct;
    
    // Save to state & storage
    state.practiceProgress[q.id] = { attempted: true, correct: isCorrect, selectedAnswerIndex: selectedIdx, correctAnswerIndex: q.correct };
    storage.savePractice(state.practiceProgress);
    
    revealAnswer(q.correct, selectedIdx);
  });

  // Bookmark toggle event
  document.getElementById('practice-bookmark').addEventListener('click', (e) => {
    const isBookmarkedNow = state.bookmarks.includes(q.id);
    if (isBookmarkedNow) {
      state.bookmarks = state.bookmarks.filter(id => id !== q.id);
      e.target.textContent = '☆ Bookmark';
    } else {
      state.bookmarks.push(q.id);
      e.target.textContent = '⭐ Bookmarked';
    }
    storage.saveBookmarks(state.bookmarks);
  });

  // Navigation handlers
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      renderPractice();
    }
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    if (state.currentQuestionIndex < total - 1) {
      state.currentQuestionIndex++;
      renderPractice();
    }
  });

  document.getElementById('practice-back').addEventListener('click', () => setView('dashboard'));
}
```

**Step 2: Run verification**
1. Check navigation and selection persistence.

**Step 3: Commit**
```bash
git add js/views/practice.js
git commit -m "feat: implement Practice Mode study view with selection validation"
```

---

### Task 6: Exam Mode Implementation

**Files:**
- Create: `js/views/exam.js`

**Step 1: Write Exam Mode code**
Perform random 50-question generation, timer countdowns, and a question navigation sidebar.

```javascript
import { state, setView, resetExam } from '../state.js';
import { storage } from '../storage.js';

export function renderExam() {
  const container = document.getElementById('app-view');
  
  // Generate random 50 questions if not started
  if (state.examSession.questions.length === 0) {
    const shuffled = [...state.questions].sort(() => 0.5 - Math.random());
    state.examSession.questions = shuffled.slice(0, 50);
    state.examSession.timeRemaining = 120 * 60; // 120 minutes in seconds
    state.examSession.answers = {};
    
    // Start countdown timer
    state.examSession.timerId = setInterval(() => {
      state.examSession.timeRemaining--;
      updateTimerDisplay();
      if (state.examSession.timeRemaining <= 0) {
        submitExam();
      }
    }, 1000);
  }
  
  let currentExamIndex = 0;
  
  function updateTimerDisplay() {
    const timerElem = document.getElementById('exam-timer-val');
    if (!timerElem) return;
    
    const minutes = Math.floor(state.examSession.timeRemaining / 60);
    const seconds = state.examSession.timeRemaining % 60;
    timerElem.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function renderActiveQuestion() {
    const questionContainer = document.getElementById('exam-question-container');
    if (!questionContainer) return;
    
    const q = state.examSession.questions[currentExamIndex];
    const selectedAnswer = state.examSession.answers[currentExamIndex];
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    questionContainer.innerHTML = `
      <div class="quiz-card" style="margin-bottom: 1.5rem;">
        <div class="quiz-header">
          <span class="quiz-meta">Exam Question ${currentExamIndex + 1} of 50</span>
        </div>
        <p class="question-text">${q.question}</p>
        <ul class="options-list">
          ${q.options.map((opt, i) => `
            <li class="option-item ${selectedAnswer === i ? 'correct' : ''}" data-index="${i}">
              <span class="option-letter" style="${selectedAnswer === i ? 'background: var(--color-gcp-blue); color: white;' : ''}">
                ${optionLetters[i]}
              </span>
              <span>${opt}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="display: flex; justify-content: space-between;">
        <button class="btn btn-secondary" id="exam-prev" ${currentExamIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary" id="exam-next" ${currentExamIndex === 49 ? 'disabled' : ''}>Next</button>
      </div>
    `;

    // Handle Option Selection
    questionContainer.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', () => {
        const optionIdx = parseInt(item.getAttribute('data-index'));
        state.examSession.answers[currentExamIndex] = optionIdx;
        
        // Refresh question view and grid markers
        renderActiveQuestion();
        updateGridStatus();
      });
    });

    // Navigation buttons
    document.getElementById('exam-prev')?.addEventListener('click', () => {
      if (currentExamIndex > 0) {
        currentExamIndex--;
        renderActiveQuestion();
        updateGridStatus();
      }
    });

    document.getElementById('exam-next')?.addEventListener('click', () => {
      if (currentExamIndex < 49) {
        currentExamIndex++;
        renderActiveQuestion();
        updateGridStatus();
      }
    });
  }

  function updateGridStatus() {
    const gridItems = document.querySelectorAll('.grid-num');
    gridItems.forEach(item => {
      const idx = parseInt(item.getAttribute('data-index'));
      item.className = 'grid-num';
      
      if (idx === currentExamIndex) {
        item.classList.add('active');
      } else if (state.examSession.answers[idx] !== undefined) {
        item.classList.add('answered');
      }
    });
  }

  function submitExam() {
    clearInterval(state.examSession.timerId);
    state.examSession.timerId = null;
    
    // Evaluate Score
    let correctCount = 0;
    const reviewData = [];
    
    state.examSession.questions.forEach((q, idx) => {
      const selected = state.examSession.answers[idx];
      const isCorrect = selected === q.correct;
      if (isCorrect) correctCount++;
      
      reviewData.push({
        question: q.question,
        options: q.options,
        correct: q.correct,
        selected: selected,
        explanation: q.explanation,
        isCorrect: isCorrect
      });
    });
    
    const finalScorePercent = Math.round((correctCount / 50) * 100);
    
    // Record in history
    const historyItem = {
      id: Date.now().toString(),
      score: finalScorePercent,
      date: new Date().toLocaleDateString(),
      elapsed: 120 * 60 - state.examSession.timeRemaining,
      total: 50
    };
    state.history.unshift(historyItem);
    storage.saveHistory(state.history);
    
    // Save review data to app-state so Review Page can fetch it
    state.latestReviewData = reviewData;
    
    // Redirect to review page
    setView('review');
  }

  // Draw core Layout
  container.innerHTML = `
    <div class="exam-layout">
      <!-- Question Container -->
      <div id="exam-question-container"></div>
      
      <!-- Exam Control Sidebar -->
      <aside class="exam-nav-sidebar">
        <div class="exam-timer">
          ⏳ <span id="exam-timer-val">120:00</span>
        </div>
        
        <h3>Progress Navigation</h3>
        <div class="question-grid">
          ${Array.from({ length: 50 }).map((_, i) => `
            <div class="grid-num" data-index="${i}">${i + 1}</div>
          `).join('')}
        </div>
        
        <button class="btn btn-primary" id="exam-submit-btn" style="width: 100%; background: var(--color-gcp-red);">Submit Exam</button>
        <button class="btn btn-secondary" id="exam-quit-btn" style="width: 100%;">Quit Exam</button>
      </aside>
    </div>
  `;

  // Navigation Grid listeners
  document.querySelector('.question-grid').addEventListener('click', (e) => {
    const item = e.target.closest('.grid-num');
    if (!item) return;
    currentExamIndex = parseInt(item.getAttribute('data-index'));
    renderActiveQuestion();
    updateGridStatus();
  });

  // Submit and Cancel Event listeners
  document.getElementById('exam-submit-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to submit your exam answers?')) {
      submitExam();
    }
  });

  document.getElementById('exam-quit-btn').addEventListener('click', () => {
    if (confirm('Quit now? Current exam progress will be lost.')) {
      resetExam();
      setView('dashboard');
    }
  });

  // Load first view
  renderActiveQuestion();
  updateTimerDisplay();
  updateGridStatus();
}
```

**Step 2: Run verification**
1. Check random array parsing limits and timer increments.

**Step 3: Commit**
```bash
git add js/views/exam.js
git commit -m "feat: implement Exam Mode simulated timer and summary generation"
```

---

### Task 7: Flashcard Mode Implementation

**Files:**
- Create: `js/views/flashcard.js`

**Step 1: Write Flashcard Mode code**
Design 3D flip triggers, random question loading, and selection controls.

```javascript
import { state, setView } from '../state.js';

export function renderFlashcard() {
  const container = document.getElementById('app-view');
  
  let list = [...state.questions].sort(() => 0.5 - Math.random());
  let currentCardIndex = 0;
  
  function renderCard() {
    const q = list[currentCardIndex];
    if (!q) {
      container.innerHTML = `<div>No questions available. <button class="btn btn-primary" id="back-dash">Dashboard</button></div>`;
      document.getElementById('back-dash').addEventListener('click', () => setView('dashboard'));
      return;
    }
    
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" id="fc-back">← Back</button>
        <span class="quiz-meta">Card ${currentCardIndex + 1} of ${list.length}</span>
      </div>

      <div class="flashcard-wrapper">
        <div class="flashcard" id="flashcard-card">
          <!-- Front Face -->
          <div class="card-face card-front">
            <h3 style="color: var(--color-gcp-blue); margin-bottom: 1rem;">Question Details</h3>
            <p class="question-text" style="font-size: 1.15rem;">${q.question}</p>
            <span style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Click card to flip</span>
          </div>
          
          <!-- Back Face -->
          <div class="card-face card-back">
            <h3 style="color: var(--color-gcp-green); margin-bottom: 0.5rem;">Correct Answer</h3>
            <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
              ${optionLetters[q.correct]}) ${q.options[q.correct]}
            </p>
            <div style="font-size: 0.95rem; text-align: left; max-height: 180px; overflow-y: auto; padding: 0.5rem; border-top: 1px solid var(--color-card-border);">
              ${q.explanation}
            </div>
            <span style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Click card to flip back</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; max-width: 400px; margin: 0 auto; gap: 1rem;">
        <button class="btn btn-secondary" id="fc-prev" style="flex: 1;" ${currentCardIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary" id="fc-next" style="flex: 1;" ${currentCardIndex === list.length - 1 ? 'disabled' : ''}>Next</button>
      </div>
    `;

    // 3D Flip toggle click listener
    const card = document.getElementById('flashcard-card');
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });

    // Navigation Handlers
    document.getElementById('fc-prev').addEventListener('click', () => {
      if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCard();
      }
    });

    document.getElementById('fc-next').addEventListener('click', () => {
      if (currentCardIndex < list.length - 1) {
        currentCardIndex++;
        renderCard();
      }
    });

    document.getElementById('fc-back').addEventListener('click', () => setView('dashboard'));
  }

  renderCard();
}
```

**Step 2: Run verification**
1. Check flip transitions in CSS styles.

**Step 3: Commit**
```bash
git add js/views/flashcard.js
git commit -m "feat: implement Flashcard Mode card flips"
```

---

### Task 8: Review/Scoreboard View Implementation

**Files:**
- Create: `js/views/review.js`

**Step 1: Write Review View code**
Display post-exam scoreboards, analytics cards, pass/fail status, and explanation review toggles.

```javascript
import { state, setView, resetExam } from '../state.js';

export function renderReview() {
  const container = document.getElementById('app-view');
  
  const data = state.latestReviewData;
  if (!data) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <h3>No Exam review sessions found.</h3>
        <button class="btn btn-primary" id="rev-back-dash" style="margin-top: 1.5rem;">Dashboard</button>
      </div>
    `;
    document.getElementById('rev-back-dash').addEventListener('click', () => setView('dashboard'));
    return;
  }
  
  const correctCount = data.filter(d => d.isCorrect).bind ? data.filter(d => d.isCorrect).length : data.filter(d => d.isCorrect).length;
  const scorePercent = Math.round((correctCount / 50) * 100);
  const isPassed = scorePercent >= 70; // 70% passing threshold for GCP
  
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <!-- Scoreboard Panel -->
      <div class="stats-card" style="align-items: center; text-align: center; border-color: ${isPassed ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'};">
        <h2 style="color: ${isPassed ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'}; font-size: 2.25rem;">
          ${isPassed ? '🎉 Pass' : '❌ Fail'}
        </h2>
        <div style="font-size: 3rem; font-weight: 700; margin: 0.5rem 0;">
          ${scorePercent}%
        </div>
        <p style="color: var(--color-text-muted);">
          You got <strong>${correctCount}</strong> out of <strong>50</strong> questions correct. (Passing score is 70%)
        </p>
        <button class="btn btn-primary" id="rev-dash-btn">Return to Dashboard</button>
      </div>

      <!-- Question list -->
      <div>
        <h3 style="margin-bottom: 1rem;">Question Review</h3>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${data.map((q, idx) => {
            const hasSelected = q.selected !== undefined;
            return `
              <div class="quiz-card" style="border-left: 6px solid ${q.isCorrect ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'};">
                <div class="quiz-header">
                  <span class="quiz-meta">Question ${idx + 1}</span>
                  <span class="quiz-meta" style="font-weight: 600; color: ${q.isCorrect ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'};">
                    ${q.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                
                <p class="question-text" style="font-size: 1.05rem; margin-bottom: 1rem;">${q.question}</p>
                
                <ul class="options-list">
                  ${q.options.map((opt, i) => {
                    let cardClass = '';
                    let letterStyle = '';
                    
                    if (i === q.correct) {
                      cardClass = 'correct';
                    } else if (i === q.selected) {
                      cardClass = 'incorrect';
                    }
                    
                    return `
                      <li class="option-item ${cardClass}" style="pointer-events: none; padding: 0.75rem 1rem;">
                        <span class="option-letter" style="${cardClass ? 'color:white;' : ''}">${optionLetters[i]}</span>
                        <span>${opt}</span>
                      </li>
                    `;
                  }).join('')}
                </ul>
                
                <div class="explanation-panel">
                  <strong>Correct Answer: ${optionLetters[q.correct]}) ${q.options[q.correct]}</strong>
                  <p style="margin-top: 0.5rem;">${q.explanation}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('rev-dash-btn').addEventListener('click', () => {
    resetExam();
    state.latestReviewData = null; // Clear review data
    setView('dashboard');
  });
}
```

**Step 2: Run verification**
1. Check mapping parameters.

**Step 3: Commit**
```bash
git add js/views/review.js
git commit -m "feat: implement review scoreboard and error analysis views"
```

---

### Task 9: Final Layout Polish, Filtering, and Verification

**Files:**
- Modify: `js/views/dashboard.js`
- Modify: `js/views/practice.js`

**Step 1: Implement Dynamic Search & Filters in Dashboard**
Ensure `renderDashboard` supports filter select dropdowns and search inputs properly filtering `state.questions`.

```javascript
// Replace in js/views/dashboard.js
import { state, setView } from '../state.js';

export function renderDashboard() {
  const container = document.getElementById('app-view');
  
  const total = state.questions.length;
  const attempted = Object.keys(state.practiceProgress).length;
  const correct = Object.values(state.practiceProgress).filter(p => p.correct).length;
  
  const completionPercent = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  
  const categories = [...new Set(state.questions.flatMap(q => q.category || ['General']))];
  
  container.innerHTML = `
    <div class="search-filter-panel">
      <div class="search-input-wrapper">
        <input type="text" id="search-bar" class="input-text" placeholder="Search questions (e.g. IAM, Storage)...">
      </div>
      <div>
        <select id="category-filter" class="select-input">
          <option value="all">All Topics</option>
          ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Statistics Widget -->
      <section class="stats-card">
        <h2>Your Progress Dashboard</h2>
        <div class="progress-rings-container">
          <div class="stat-ring-wrapper">
            <div class="stat-ring">
              <svg>
                <circle class="ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="ring-fill" cx="50" cy="50" r="40" stroke="var(--color-gcp-blue)" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * completionPercent) / 100}"></circle>
              </svg>
              <div class="stat-percent">${completionPercent}%</div>
            </div>
            <span>Completion Rate</span>
          </div>
          <div class="stat-ring-wrapper">
            <div class="stat-ring">
              <svg>
                <circle class="ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="ring-fill" cx="50" cy="50" r="40" stroke="var(--color-gcp-green)" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * accuracyPercent) / 100}"></circle>
              </svg>
              <div class="stat-percent">${accuracyPercent}%</div>
            </div>
            <span>Accuracy Score</span>
          </div>
        </div>
        <p style="text-align: center; color: var(--color-text-muted); font-size: 0.9rem;">
          Solved ${attempted} of ${total} practice questions (${correct} correct)
        </p>
      </section>

      <!-- Selection Cards -->
      <section class="mode-cards">
        <div class="mode-card" id="mode-practice">
          <h3>📖 Practice Mode</h3>
          <p>Go through all questions at your own pace with instant answer checks and explanations.</p>
        </div>
        <div class="mode-card" id="mode-exam">
          <h3>⏱️ Exam Mode</h3>
          <p>Simulate the actual GCP ACE Exam. 50 random questions, 120 minutes, with summary results.</p>
        </div>
        <div class="mode-card" id="mode-flashcard">
          <h3>🗂️ Flashcard Mode</h3>
          <p>Quick recall practice. Look at the question, flip to review the correct concept.</p>
        </div>
      </section>
    </div>
  `;

  // Attach Navigation Listeners
  document.getElementById('mode-practice').addEventListener('click', () => {
    state.filteredQuestions = getFilteredQuestions();
    state.currentQuestionIndex = 0;
    setView('practice');
  });
  document.getElementById('mode-exam').addEventListener('click', () => setView('exam'));
  document.getElementById('mode-flashcard').addEventListener('click', () => {
    state.filteredQuestions = getFilteredQuestions();
    setView('flashcard');
  });

  // Get active filters values
  function getFilteredQuestions() {
    const searchVal = document.getElementById('search-bar').value.toLowerCase();
    const catVal = document.getElementById('category-filter').value;
    
    return state.questions.filter(q => {
      const matchSearch = q.question.toLowerCase().includes(searchVal) || q.explanation.toLowerCase().includes(searchVal);
      const matchCategory = catVal === 'all' || q.category === catVal;
      return matchSearch && matchCategory;
    });
  }
}
```

**Step 2: Modify `js/views/practice.js` and `js/views/flashcard.js` to use filtered questions**
Make sure if filteredQuestions exists, practice and flashcard modes default to it instead of the whole pool of questions.

```javascript
// Modify practice.js top part to fetch from filtered list:
const questionsList = state.filteredQuestions.length > 0 ? state.filteredQuestions : state.questions;
const total = questionsList.length;
const q = questionsList[index];
```

**Step 3: Run verification**
1. Run local development server.
2. Confirm search filtering and navigation work perfectly.

**Step 4: Commit**
```bash
git add js/views/dashboard.js js/views/practice.js
git commit -m "feat: wire up search and category filtering system across views"
```
