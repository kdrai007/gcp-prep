import { state, setView } from '../state.js';
import { storage } from '../storage.js';

export function renderPractice() {
  const container = document.getElementById('app-view');
  
  let index = state.currentQuestionIndex;
  const questionsList = state.filteredQuestions.length > 0 ? state.filteredQuestions : state.questions;
  const q = questionsList[index];
  
  if (!q) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h3>No questions match your filter criteria.</h3>
        <button class="btn btn-primary" id="back-dash" style="margin-top: 1rem;">Back to Dashboard</button>
      </div>
    `;
    document.getElementById('back-dash').addEventListener('click', () => setView('dashboard'));
    return;
  }
  
  const total = questionsList.length;
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
    state.practiceProgress[q.id] = { 
      attempted: true, 
      correct: isCorrect, 
      selectedAnswerIndex: selectedIdx, 
      correctAnswerIndex: q.correct 
    };
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
