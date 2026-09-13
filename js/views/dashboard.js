import { state, setView, applyFilters, resetFilters, hasActiveFilters, resetExam } from '../state.js';
import { storage } from '../storage.js';
import { renderBadges, highlightText } from '../utils.js';

export function renderDashboard() {
  const container = document.getElementById('app-view');

  // Apply current filters
  applyFilters();

  // Calculate overall statistics
  const total = state.questions.length;
  const attempted = Object.keys(state.practiceProgress).length;
  const correct = Object.values(state.practiceProgress).filter(p => p.correct).length;

  const completionPercent = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  // Calculate difficulty-specific stats
  const diffStats = {
    Easy: { total: 0, solved: 0, correct: 0 },
    Medium: { total: 0, solved: 0, correct: 0 },
    Hard: { total: 0, solved: 0, correct: 0 }
  };

  state.questions.forEach(q => {
    const d = q.difficulty || 'Medium';
    if (!diffStats[d]) diffStats[d] = { total: 0, solved: 0, correct: 0 };
    diffStats[d].total++;
    const prog = state.practiceProgress[q.id];
    if (prog && prog.attempted) {
      diffStats[d].solved++;
      if (prog.correct) diffStats[d].correct++;
    }
  });

  // Calculate missed questions (weaknesses)
  const missedQuestions = state.questions.filter(q => {
    const prog = state.practiceProgress[q.id];
    return prog && prog.attempted && !prog.correct;
  });

  // Dynamically extract categories
  const categories = [...new Set(state.questions.flatMap(q => q.category || ['General']))].sort();

  const isFiltered = hasActiveFilters();
  const filteredList = state.filteredQuestions;
  const filteredCount = filteredList.length;

  container.innerHTML = `
    <!-- Search & Filter Panel -->
    <div class="search-filter-panel">
      <div class="search-input-wrapper">
        <input 
          type="text" 
          id="search-bar" 
          class="input-text" 
          placeholder="Search questions (e.g. IAM, Storage, GKE, NAT, #45)..." 
          value="${state.searchQuery}"
          autocomplete="off"
        >
        <button id="search-clear-btn" class="search-clear-btn" title="Clear search" style="${state.searchQuery ? 'display: block;' : 'display: none;'}">✕</button>
      </div>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <select id="category-filter" class="select-input" style="min-width: 150px;">
          <option value="all" ${state.categoryFilter === 'all' ? 'selected' : ''}>All Topics</option>
          ${categories.map(cat => `<option value="${cat}" ${state.categoryFilter === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
        <select id="difficulty-filter" class="select-input" style="min-width: 140px;">
          <option value="all" ${state.difficultyFilter === 'all' ? 'selected' : ''}>All Difficulties</option>
          <option value="Easy" ${state.difficultyFilter === 'Easy' ? 'selected' : ''}>🟢 Easy</option>
          <option value="Medium" ${state.difficultyFilter === 'Medium' ? 'selected' : ''}>🟡 Medium</option>
          <option value="Hard" ${state.difficultyFilter === 'Hard' ? 'selected' : ''}>🔴 Hard</option>
        </select>
      </div>
    </div>

    <!-- Live Filter Status Summary -->
    <div id="filter-status-row" style="font-size: 0.88rem; color: var(--color-text-muted); margin-top: -1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <span id="filter-count-text">${getFilterCountText(filteredCount, total, isFiltered)}</span>
      <button id="clear-filters-btn" class="btn-icon" style="font-size: 0.82rem; color: var(--color-gcp-blue); padding: 0.2rem 0.5rem; border-radius: 4px; ${isFiltered ? 'display: inline-block;' : 'display: none;'}">
        ✕ Reset Filters
      </button>
    </div>

    <!-- Question Bank / Search Results Drawer (Shown when filtering or searchable) -->
    <div id="question-bank-section" class="quiz-card" style="margin-bottom: 2rem; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h3 style="font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔍 Question Bank & Filtered Results</span>
          <span id="qb-badge-count" class="badge badge-category" style="font-size: 0.72rem;">${filteredCount} Questions</span>
        </h3>
        <button id="btn-practice-filtered" class="btn btn-primary btn-sm">
          Practice These ${filteredCount} Questions →
        </button>
      </div>
      <div id="question-bank-container" class="question-bank-list">
        ${renderQuestionBankItems(filteredList, state.searchQuery)}
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Statistics Widget -->
      <section class="stats-card">
        <h2>Study Progress</h2>
        
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
          Solved <strong>${attempted}</strong> of <strong>${total}</strong> practice questions (<strong>${correct}</strong> correct)
        </p>

        <!-- Segmented Difficulty Stats -->
        <div>
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Breakdown by Difficulty</h4>
          <div class="difficulty-breakdown">
            <div class="diff-stat-card" style="border-top: 3px solid var(--color-gcp-green);">
              <span class="diff-stat-title" style="color: var(--color-gcp-green);">🟢 Easy</span>
              <span class="diff-stat-val">${diffStats.Easy.solved} / ${diffStats.Easy.total}</span>
              <span class="diff-stat-sub">${diffStats.Easy.solved > 0 ? Math.round((diffStats.Easy.correct / diffStats.Easy.solved) * 100) : 0}% Acc</span>
            </div>
            <div class="diff-stat-card" style="border-top: 3px solid var(--color-gcp-yellow);">
              <span class="diff-stat-title" style="color: #d97706;">🟡 Medium</span>
              <span class="diff-stat-val">${diffStats.Medium.solved} / ${diffStats.Medium.total}</span>
              <span class="diff-stat-sub">${diffStats.Medium.solved > 0 ? Math.round((diffStats.Medium.correct / diffStats.Medium.solved) * 100) : 0}% Acc</span>
            </div>
            <div class="diff-stat-card" style="border-top: 3px solid var(--color-gcp-red);">
              <span class="diff-stat-title" style="color: var(--color-gcp-red);">🔴 Hard</span>
              <span class="diff-stat-val">${diffStats.Hard.solved} / ${diffStats.Hard.total}</span>
              <span class="diff-stat-sub">${diffStats.Hard.solved > 0 ? Math.round((diffStats.Hard.correct / diffStats.Hard.solved) * 100) : 0}% Acc</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Mode Cards -->
      <section class="mode-cards">
        <div class="mode-card" id="mode-practice">
          <h3 id="mode-practice-title">📖 Practice Mode ${isFiltered ? `(${filteredCount} filtered)` : ''}</h3>
          <p id="mode-practice-desc">
            ${isFiltered 
              ? `Work through your ${filteredCount} active filtered questions with instant answer checks and explanations.` 
              : `Go through all ${total} questions at your own pace with instant answer checks and explanations.`}
          </p>
        </div>

        <div class="mode-card" id="mode-weaknesses" style="border-left: 4px solid var(--color-gcp-red);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin-bottom: 0;">🎯 Target Weaknesses</h3>
            <span class="badge ${missedQuestions.length > 0 ? 'badge-hard' : 'badge-category'}">
              ${missedQuestions.length} Missed
            </span>
          </div>
          <p style="margin-top: 0.5rem;">Practice only questions you've previously answered incorrectly to master your weak spots.</p>
        </div>

        <div class="mode-card" id="mode-custom-quiz" style="border-left: 4px solid var(--color-gcp-yellow);">
          <h3>⚡ Custom Quiz Builder</h3>
          <p>Configure a tailored sprint: select question count (10, 25, 50), focus topics, difficulty, and timer.</p>
        </div>

        <div class="mode-card" id="mode-exam">
          <h3>⏱️ Standard Exam Simulation</h3>
          <p>Simulate the official GCP Associate Cloud Engineer exam: 50 randomized questions with a 120-minute countdown timer.</p>
        </div>

        <div class="mode-card" id="mode-flashcard">
          <h3>🗂️ Flashcard Mode ${isFiltered ? `(${filteredCount} filtered)` : ''}</h3>
          <p>Interactive 3D flipcards designed for quick concept revision, mental recall, and keyboard-driven study.</p>
        </div>

        <div class="mode-card" id="mode-review">
          <h3>📑 Exam History & Bookmarks</h3>
          <p>Review past full exam test runs, scores, and ${state.bookmarks.length} bookmarked questions.</p>
        </div>
      </section>
    </div>

    <!-- Data Management & Backup -->
    <section class="data-management-card" style="margin-top: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">💾 Data Management & Backup</h3>
          <p style="color: var(--color-text-muted); font-size: 0.85rem;">Export your study progress to JSON or restore from a backup file.</p>
        </div>
        <div class="data-actions-row">
          <button class="btn btn-secondary btn-sm" id="btn-export-data">⬇️ Export Progress</button>
          <button class="btn btn-secondary btn-sm" id="btn-import-data-trigger">⬆️ Import Progress</button>
          <input type="file" id="file-import-input" accept=".json" style="display: none;">
          <button class="btn btn-danger btn-sm" id="btn-reset-data">🗑️ Reset Progress</button>
        </div>
      </div>
    </section>

    <!-- Custom Quiz Modal Backdrop -->
    <div id="custom-quiz-modal" class="modal-backdrop" style="display: none;">
      <div class="modal-card">
        <div class="modal-header">
          <h3>⚡ Custom Quiz Generator</h3>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close Modal">✕</button>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-count">Number of Questions</label>
          <select id="custom-count" class="select-input">
            <option value="10">10 Questions (Quick Sprint)</option>
            <option value="25" selected>25 Questions (Standard Practice)</option>
            <option value="50">50 Questions (Full Length)</option>
            <option value="all">All Matching Questions (${filteredCount})</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-topic">Topic Focus</label>
          <select id="custom-topic" class="select-input">
            <option value="all">All Topics</option>
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-difficulty">Difficulty Filter</label>
          <select id="custom-difficulty" class="select-input">
            <option value="all">All Difficulties (Balanced)</option>
            <option value="Easy">🟢 Easy Only</option>
            <option value="Medium">🟡 Medium Only</option>
            <option value="Hard">🔴 Hard Only</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-timer">Timer Option</label>
          <select id="custom-timer" class="select-input">
            <option value="timed" selected>Standard Exam Pace (2.4 min / question)</option>
            <option value="speed">Speed Challenge (1 min / question)</option>
            <option value="none">Untimed (Relaxed Study)</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="modal-start-btn">Start Custom Quiz 🚀</button>
        </div>
      </div>
    </div>
  `;

  // Helper functions
  function getFilterCountText(count, totalCount, active) {
    if (!active) {
      return `Showing all <strong>${totalCount}</strong> questions`;
    }
    return `Found <strong>${count}</strong> of <strong>${totalCount}</strong> questions matching filters`;
  }

  function renderQuestionBankItems(questions, query) {
    if (!questions || questions.length === 0) {
      return `
        <div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">🔍 No questions match your filter criteria.</p>
          <p style="font-size: 0.85rem;">Try adjusting your search terms or clearing the topic/difficulty filters.</p>
        </div>
      `;
    }

    return questions.map((q, idx) => {
      const prog = state.practiceProgress[q.id];
      let statusIcon = '⚪';
      let statusTitle = 'Unattempted';
      if (prog && prog.attempted) {
        if (prog.correct) {
          statusIcon = '✅';
          statusTitle = 'Solved Correct';
        } else {
          statusIcon = '❌';
          statusTitle = 'Missed';
        }
      }
      const isBookmarked = state.bookmarks.includes(q.id);

      return `
        <div class="question-bank-item" data-id="${q.id}" data-idx="${idx}">
          <div class="question-bank-info">
            <span class="question-bank-num">#${q.id}</span>
            <span title="${statusTitle}">${statusIcon}</span>
            ${isBookmarked ? '<span title="Bookmarked">⭐</span>' : ''}
            <span class="question-bank-text">${highlightText(q.question, query)}</span>
          </div>
          <div class="question-bank-meta">
            ${renderBadges(q.category, q.difficulty)}
            <span style="color: var(--color-gcp-blue); font-size: 0.85rem; font-weight: 500;">Practice →</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Live filter updater (does NOT destroy search input or lose focus!)
  function updateLiveFilterResults() {
    const list = applyFilters();
    const count = list.length;
    const active = hasActiveFilters();

    // 1. Update count text
    const countElem = document.getElementById('filter-count-text');
    if (countElem) countElem.innerHTML = getFilterCountText(count, total, active);

    // 2. Update reset button visibility
    const resetBtn = document.getElementById('clear-filters-btn');
    if (resetBtn) resetBtn.style.display = active ? 'inline-block' : 'none';

    // 3. Update search clear button visibility
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.style.display = state.searchQuery ? 'block' : 'none';

    // 4. Update question bank container
    const qbContainer = document.getElementById('question-bank-container');
    if (qbContainer) {
      qbContainer.innerHTML = renderQuestionBankItems(list, state.searchQuery);
      attachQuestionBankItemClicks();
    }

    // 5. Update badge count
    const qbBadge = document.getElementById('qb-badge-count');
    if (qbBadge) qbBadge.textContent = `${count} Questions`;

    // 6. Update practice button text
    const btnPracticeFiltered = document.getElementById('btn-practice-filtered');
    if (btnPracticeFiltered) {
      btnPracticeFiltered.textContent = `Practice These ${count} Questions →`;
      btnPracticeFiltered.disabled = count === 0;
    }

    // 7. Update mode cards description
    const modePracticeTitle = document.getElementById('mode-practice-title');
    if (modePracticeTitle) {
      modePracticeTitle.textContent = `📖 Practice Mode ${active ? `(${count} filtered)` : ''}`;
    }
    const modePracticeDesc = document.getElementById('mode-practice-desc');
    if (modePracticeDesc) {
      modePracticeDesc.textContent = active 
        ? `Work through your ${count} active filtered questions with instant answer checks and explanations.` 
        : `Go through all ${total} questions at your own pace with instant answer checks and explanations.`;
    }
  }

  function attachQuestionBankItemClicks() {
    const items = document.querySelectorAll('.question-bank-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const qId = item.getAttribute('data-id');
        const qIndex = state.filteredQuestions.findIndex(q => q.id === qId);
        state.currentQuestionIndex = qIndex >= 0 ? qIndex : 0;
        setView('practice');
      });
    });
  }

  // Bind Search input live events
  const searchInput = document.getElementById('search-bar');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    updateLiveFilterResults();
  });

  const searchClearBtn = document.getElementById('search-clear-btn');
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      searchInput.value = '';
      searchInput.focus();
      updateLiveFilterResults();
    });
  }

  // Bind Category and Difficulty filter changes
  document.getElementById('category-filter').addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    updateLiveFilterResults();
  });

  document.getElementById('difficulty-filter').addEventListener('change', (e) => {
    state.difficultyFilter = e.target.value;
    updateLiveFilterResults();
  });

  // Reset filters button
  const resetBtn = document.getElementById('clear-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFilters();
      searchInput.value = '';
      document.getElementById('category-filter').value = 'all';
      document.getElementById('difficulty-filter').value = 'all';
      updateLiveFilterResults();
    });
  }

  // Practice Filtered button
  const btnPracticeFiltered = document.getElementById('btn-practice-filtered');
  if (btnPracticeFiltered) {
    btnPracticeFiltered.addEventListener('click', () => {
      if (state.filteredQuestions.length === 0) return;
      state.currentQuestionIndex = 0;
      setView('practice');
    });
  }

  // Initial attachment for question bank items
  attachQuestionBankItemClicks();

  // Mode Card Click Handlers
  document.getElementById('mode-practice').addEventListener('click', () => {
    applyFilters();
    state.currentQuestionIndex = 0;
    setView('practice');
  });

  document.getElementById('mode-weaknesses').addEventListener('click', () => {
    if (missedQuestions.length === 0) {
      alert('Great job! You have no missed questions yet. Try some practice questions first!');
      return;
    }
    state.filteredQuestions = [...missedQuestions];
    state.currentQuestionIndex = 0;
    setView('practice');
  });

  document.getElementById('mode-exam').addEventListener('click', () => {
    resetExam();
    state.examSession.questions = [...state.questions].sort(() => 0.5 - Math.random()).slice(0, 50);
    state.examSession.timeRemaining = 120 * 60;
    state.examSession.totalTime = 120 * 60;
    state.examSession.examTitle = 'Full 50-Question Practice Exam';
    setView('exam');
  });

  // Custom Quiz Modal
  const modal = document.getElementById('custom-quiz-modal');
  document.getElementById('mode-custom-quiz').addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  document.getElementById('modal-close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  document.getElementById('modal-cancel-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('modal-start-btn').addEventListener('click', () => {
    const countVal = document.getElementById('custom-count').value;
    const topicVal = document.getElementById('custom-topic').value;
    const diffVal = document.getElementById('custom-difficulty').value;
    const timerVal = document.getElementById('custom-timer').value;

    let pool = [...state.questions];
    if (topicVal !== 'all') {
      pool = pool.filter(q => q.category === topicVal);
    }
    if (diffVal !== 'all') {
      pool = pool.filter(q => (q.difficulty || 'Medium') === diffVal);
    }

    if (pool.length === 0) {
      alert('No questions match the selected custom criteria! Please adjust your filters.');
      return;
    }

    pool.sort(() => 0.5 - Math.random());
    const count = countVal === 'all' ? pool.length : Math.min(parseInt(countVal), pool.length);
    const selectedQuestions = pool.slice(0, count);

    resetExam();
    state.examSession.questions = selectedQuestions;

    let secondsPerQ = 144; // 2.4 min
    if (timerVal === 'speed') secondsPerQ = 60;
    else if (timerVal === 'none') secondsPerQ = 0;

    state.examSession.timeRemaining = secondsPerQ * count;
    state.examSession.totalTime = secondsPerQ * count;
    state.examSession.examTitle = `Custom Quiz (${count} Questions${diffVal !== 'all' ? ' • ' + diffVal : ''}${topicVal !== 'all' ? ' • ' + topicVal : ''})`;

    modal.style.display = 'none';
    setView('exam');
  });

  document.getElementById('mode-flashcard').addEventListener('click', () => {
    applyFilters();
    setView('flashcard');
  });

  document.getElementById('mode-review').addEventListener('click', () => {
    setView('review');
  });

  // Data Management: Export
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const jsonStr = storage.exportAll();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcp-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Data Management: Import
  const importFileInput = document.getElementById('file-import-input');
  document.getElementById('btn-import-data-trigger').addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = storage.importAll(event.target.result);
      if (res.success) {
        state.bookmarks = storage.loadBookmarks();
        state.practiceProgress = storage.loadPractice();
        state.history = storage.loadHistory();
        alert('Progress successfully imported!');
        renderDashboard();
      } else {
        alert('Failed to import progress: ' + res.error);
      }
    };
    reader.readAsText(file);
  });

  // Data Management: Reset
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to reset all study progress, history, and bookmarks? This action cannot be undone.');
    if (confirmed) {
      storage.clearAll();
      state.bookmarks = [];
      state.practiceProgress = {};
      state.history = [];
      renderDashboard();
    }
  });
}
