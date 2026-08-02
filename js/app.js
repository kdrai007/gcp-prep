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
