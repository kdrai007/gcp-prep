import { state, setView, hasActiveFilters, resetFilters } from '../state.js';
import { storage } from '../storage.js';
import { formatCode, renderBadges, recordStudyActivity } from '../utils.js';

let practiceKeyHandler = null;

export function renderPractice() {
  const container = document.getElementById('app-view');

  // Clean up existing keyboard listener if present
  if (practiceKeyHandler) {
    window.removeEventListener('keydown', practiceKeyHandler);
    practiceKeyHandler = null;
  }

  const isFiltered = hasActiveFilters();
  const questionsList = isFiltered ? state.filteredQuestions : state.questions;
  
  if (questionsList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;" class="quiz-card">
        <h3>🔍 No questions match your search or filter criteria.</h3>
        <p style="color: var(--color-text-muted); margin-top: 0.5rem;">
          ${state.searchQuery ? `Search: "<strong>${state.searchQuery}</strong>" ` : ''}
          ${state.categoryFilter !== 'all' ? `• Topic: <strong>${state.categoryFilter}</strong> ` : ''}
          ${state.difficultyFilter !== 'all' ? `• Difficulty: <strong>${state.difficultyFilter}</strong>` : ''}
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" id="practice-reset-filters">Reset Filters</button>
          <button class="btn btn-primary" id="back-dash">Back to Dashboard</button>
        </div>
      </div>
    `;
    document.getElementById('practice-reset-filters').addEventListener('click', () => {
      resetFilters();
      renderPractice();
    });
    document.getElementById('back-dash').addEventListener('click', () => setView('dashboard'));
    return;
  }
  
  let index = state.currentQuestionIndex;
  if (index >= questionsList.length) {
    index = 0;
    state.currentQuestionIndex = 0;
  }
  const q = questionsList[index];
  
  const total = questionsList.length;
  const isBookmarked = state.bookmarks.includes(q.id);
  const progressRecord = state.practiceProgress[q.id];
  
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  container.innerHTML = `
    <div class="quiz-container">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <button class="btn btn-secondary" id="practice-back">← Back to Dashboard</button>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-secondary" id="practice-bookmark">${isBookmarked ? '⭐ Bookmarked' : '☆ Bookmark'}</button>
        </div>
      </div>

      ${isFiltered ? `
        <div style="font-size: 0.82rem; background: rgba(66, 133, 244, 0.08); border: 1px solid rgba(66, 133, 244, 0.2); padding: 0.35rem 0.75rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>Active filter: <strong>${total}</strong> matching questions ${state.searchQuery ? `(search: "${state.searchQuery}")` : ''}</span>
          <a href="#" id="practice-clear-filters-link" style="color: var(--color-gcp-blue); text-decoration: none; font-weight: 500;">Reset Filters</a>
        </div>
      ` : ''}

      <div class="quiz-card">
        <div class="quiz-header">
          <span class="quiz-meta">Question ${index + 1} of ${total} (ID: #${q.id})</span>
          ${renderBadges(q.category, q.difficulty)}
        </div>
        
        <p class="question-text">${formatCode(q.question)}</p>
        
        <ul class="options-list" id="options-list">
          ${q.options.map((opt, i) => `
            <li class="option-item" data-index="${i}">
              <span class="option-letter">${optionLetters[i]}</span>
              <span>${formatCode(opt)}</span>
            </li>
          `).join('')}
        </ul>

        <div id="practice-explanation" class="explanation-panel" style="display: none;">
          <strong>Correct Answer: ${optionLetters[q.correct]}) ${formatCode(q.options[q.correct])}</strong>
          <p style="margin-top: 0.5rem;">${formatCode(q.explanation)}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" id="prev-btn" ${index === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn btn-primary" id="next-btn" ${index === total - 1 ? 'disabled' : ''}>Next →</button>
      </div>

      <!-- Keyboard Shortcuts Hint Bar -->
      <div class="keyboard-hint-bar">
        <span><span class="kbd-key">A</span>–<span class="kbd-key">D</span> or <span class="kbd-key">1</span>–<span class="kbd-key">4</span> Select</span>
        <span><span class="kbd-key">←</span> / <span class="kbd-key">→</span> Navigate</span>
        <span><span class="kbd-key">B</span> Bookmark</span>
      </div>
    </div>
  `;

  const options = document.querySelectorAll('.option-item');
  const explanationPanel = document.getElementById('practice-explanation');
  
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

  // Show explanation if already answered in state
  if (progressRecord) {
    revealAnswer(progressRecord.correctAnswerIndex, progressRecord.selectedAnswerIndex);
  }

  function handleSelectOption(selectedIdx) {
    if (selectedIdx < 0 || selectedIdx >= q.options.length) return;
    if (state.practiceProgress[q.id]?.attempted) return; // already locked

    const isCorrect = selectedIdx === q.correct;
    
    // Save to state & storage
    state.practiceProgress[q.id] = { 
      attempted: true, 
      correct: isCorrect, 
      selectedAnswerIndex: selectedIdx, 
      correctAnswerIndex: q.correct 
    };
    storage.savePractice(state.practiceProgress);
    recordStudyActivity();
    
    revealAnswer(q.correct, selectedIdx);
  }

  // Answer selection event
  document.getElementById('options-list').addEventListener('click', (e) => {
    const item = e.target.closest('.option-item');
    if (!item) return;
    const selectedIdx = parseInt(item.getAttribute('data-index'));
    handleSelectOption(selectedIdx);
  });

  // Bookmark toggle function
  function toggleBookmark() {
    const isBookmarkedNow = state.bookmarks.includes(q.id);
    const bookmarkBtn = document.getElementById('practice-bookmark');
    if (isBookmarkedNow) {
      state.bookmarks = state.bookmarks.filter(id => id !== q.id);
      if (bookmarkBtn) bookmarkBtn.textContent = '☆ Bookmark';
    } else {
      state.bookmarks.push(q.id);
      if (bookmarkBtn) bookmarkBtn.textContent = '⭐ Bookmarked';
    }
    storage.saveBookmarks(state.bookmarks);
  }

  // Bookmark toggle event
  document.getElementById('practice-bookmark').addEventListener('click', toggleBookmark);

  // Clear filters link
  const clearLink = document.getElementById('practice-clear-filters-link');
  if (clearLink) {
    clearLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetFilters();
      renderPractice();
    });
  }

  // Navigation handlers
  function goPrev() {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      renderPractice();
    }
  }

  function goNext() {
    if (state.currentQuestionIndex < total - 1) {
      state.currentQuestionIndex++;
      renderPractice();
    }
  }

  document.getElementById('prev-btn').addEventListener('click', goPrev);
  document.getElementById('next-btn').addEventListener('click', goNext);

  document.getElementById('practice-back').addEventListener('click', () => {
    if (practiceKeyHandler) {
      window.removeEventListener('keydown', practiceKeyHandler);
      practiceKeyHandler = null;
    }
    setView('dashboard');
  });

  // Keyboard Shortcuts Handler
  practiceKeyHandler = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const key = e.key.toUpperCase();

    if (['A', 'B', 'C', 'D'].includes(key)) {
      if (key === 'B' && e.altKey) {
        toggleBookmark();
        return;
      }
      const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      handleSelectOption(map[key]);
    } else if (['1', '2', '3', '4'].includes(key)) {
      handleSelectOption(parseInt(key) - 1);
    } else if (e.key === 'ArrowLeft') {
      goPrev();
    } else if (e.key === 'ArrowRight') {
      goNext();
    }
  };

  window.addEventListener('keydown', practiceKeyHandler);
}
