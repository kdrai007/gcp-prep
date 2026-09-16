import { state } from './state.js';
import { storage } from './storage.js';
import { updateHeaderTelemetry, calculateCurrentStreak, getTodayString } from './utils.js';
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
      let category = q.category || 'General';
      if (!q.category) {
        const text = (q.question + ' ' + q.explanation).toLowerCase();
        if (text.includes('gke') || text.includes('kubernetes') || text.includes('autopilot')) category = 'GKE / Containers';
        else if (text.includes('iam') || text.includes('role') || text.includes('permission') || text.includes('service account')) category = 'Identity & IAM';
        else if (text.includes('storage') || text.includes('bucket') || text.includes('artifact registry')) category = 'Cloud Storage';
        else if (text.includes('sql') || text.includes('spanner') || text.includes('firestore') || text.includes('bigtable') || text.includes('bigquery')) category = 'Databases';
        else if (text.includes('subnet') || text.includes('vpc') || text.includes('dns') || text.includes('load balancing') || text.includes('nat')) category = 'Networking';
        else if (text.includes('compute') || text.includes('instance') || text.includes('vm') || text.includes('cloud run') || text.includes('app engine')) category = 'Compute Engine';
        else if (text.includes('logging') || text.includes('monitoring') || text.includes('billing')) category = 'Management & Ops';
      }
      
      const difficulty = q.difficulty || 'Medium';

      return { ...q, category, difficulty };
    });
    
    // Load local storage states
    state.bookmarks = storage.loadBookmarks();
    state.practiceProgress = storage.loadPractice();
    state.history = storage.loadHistory();
    state.streak = storage.loadStreak();
    state.examDate = storage.loadExamDate();

    // Initialize HUD telemetry & modal interactions
    updateHeaderTelemetry();
    setupTelemetryModals();
    
    // Listen for hash changes
    window.addEventListener('hashchange', router);
    
    // Initial Route
    router();
  } catch (err) {
    document.getElementById('app-view').innerHTML = `<div class="explanation-panel" style="border-left-color: var(--color-gcp-red); background: rgba(234, 67, 53, 0.1);">Error launching app: ${err.message}</div>`;
  }
}

function setupTelemetryModals() {
  // 1. Exam Date Modal
  const examModal = document.getElementById('exam-date-modal');
  const examChip = document.getElementById('header-exam-chip');
  const examDateInput = document.getElementById('target-exam-date-input');
  const examModalClose = document.getElementById('exam-date-modal-close');
  const examModalCancel = document.getElementById('btn-cancel-exam-date');
  const examModalSave = document.getElementById('btn-save-exam-date');
  const examModalClear = document.getElementById('btn-clear-exam-date');
  const presetButtons = document.querySelectorAll('.preset-date-btn');

  function openExamModal() {
    if (!examModal) return;
    const todayStr = getTodayString();
    if (examDateInput) {
      examDateInput.min = todayStr;
      examDateInput.value = state.examDate || '';
    }
    examModal.style.display = 'flex';
  }

  function closeExamModal() {
    if (examModal) examModal.style.display = 'none';
  }

  if (examChip) {
    examChip.addEventListener('click', openExamModal);
  }

  if (examModalClose) examModalClose.addEventListener('click', closeExamModal);
  if (examModalCancel) examModalCancel.addEventListener('click', closeExamModal);

  if (examModal) {
    examModal.addEventListener('click', (e) => {
      if (e.target === examModal) closeExamModal();
    });
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.getAttribute('data-days') || '30', 10);
      const target = new Date();
      target.setDate(target.getDate() + days);
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      if (examDateInput) {
        examDateInput.value = `${yyyy}-${mm}-${dd}`;
      }
    });
  });

  if (examModalSave) {
    examModalSave.addEventListener('click', () => {
      const val = examDateInput ? examDateInput.value.trim() : '';
      if (!val) {
        storage.saveExamDate(null);
        state.examDate = null;
      } else {
        storage.saveExamDate(val);
        state.examDate = val;
      }
      updateHeaderTelemetry();
      closeExamModal();
      if (state.currentView === 'dashboard') {
        renderDashboard();
      }
    });
  }

  if (examModalClear) {
    examModalClear.addEventListener('click', () => {
      storage.saveExamDate(null);
      state.examDate = null;
      if (examDateInput) examDateInput.value = '';
      updateHeaderTelemetry();
      closeExamModal();
      if (state.currentView === 'dashboard') {
        renderDashboard();
      }
    });
  }

  // 2. Streak Info Modal
  const streakModal = document.getElementById('streak-info-modal');
  const streakChip = document.getElementById('header-streak-chip');
  const streakModalClose = document.getElementById('streak-modal-close');
  const btnCloseStreakModal = document.getElementById('btn-close-streak-modal');
  const modalStreakCount = document.getElementById('modal-streak-count');
  const modalStreakStatus = document.getElementById('modal-streak-status');

  function openStreakModal() {
    if (!streakModal) return;
    const streakData = state.streak || storage.loadStreak();
    const currentStreak = calculateCurrentStreak(streakData);
    const todayStr = getTodayString();

    if (modalStreakCount) {
      modalStreakCount.textContent = currentStreak;
    }

    if (modalStreakStatus) {
      if (streakData?.lastDate === todayStr && currentStreak > 0) {
        modalStreakStatus.innerHTML = '<span style="color: var(--color-gcp-green);">● Active Today</span> — Flame kept burning! 🔥';
      } else if (currentStreak > 0) {
        modalStreakStatus.innerHTML = '<span style="color: var(--color-gcp-yellow);">⚠️ Practice today</span> to keep your streak alive!';
      } else {
        modalStreakStatus.innerHTML = '<span style="color: var(--color-text-muted);">○ Inactive</span> — Solve a question to start your streak!';
      }
    }

    streakModal.style.display = 'flex';
  }

  function closeStreakModal() {
    if (streakModal) streakModal.style.display = 'none';
  }

  if (streakChip) {
    streakChip.addEventListener('click', openStreakModal);
  }

  if (streakModalClose) streakModalClose.addEventListener('click', closeStreakModal);
  if (btnCloseStreakModal) btnCloseStreakModal.addEventListener('click', closeStreakModal);

  if (streakModal) {
    streakModal.addEventListener('click', (e) => {
      if (e.target === streakModal) closeStreakModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeExamModal();
      closeStreakModal();
    }
  });
}

// Dark Mode Toggle logic
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', targetTheme);
  });
}

// Register PWA Service Worker if supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.update();
    }).catch(err => {
      console.debug('Service Worker registration skipped:', err);
    });
  });
}

window.addEventListener('DOMContentLoaded', initializeApp);
