import { state, setView, resetExam } from '../state.js';
import { storage } from '../storage.js';
import { formatCode, renderBadges } from '../utils.js';

let examKeyHandler = null;

export function renderExam() {
  const container = document.getElementById('app-view');

  // Clean up keyboard listener
  if (examKeyHandler) {
    window.removeEventListener('keydown', examKeyHandler);
    examKeyHandler = null;
  }
  
  // Generate random 50 questions if not started via custom quiz
  if (state.examSession.questions.length === 0) {
    const shuffled = [...state.questions].sort(() => 0.5 - Math.random());
    state.examSession.questions = shuffled.slice(0, 50);
    state.examSession.timeRemaining = 120 * 60; // 120 minutes in seconds
    state.examSession.totalTime = 120 * 60;
    state.examSession.answers = {};
    state.examSession.examTitle = 'Full 50-Question Practice Exam';
  }

  const totalQuestions = state.examSession.questions.length;
  const isTimed = state.examSession.totalTime > 0;
  
  // Start countdown timer if timed and not already running
  if (isTimed && !state.examSession.timerId) {
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
    
    if (!isTimed) {
      timerElem.textContent = 'Untimed Practice';
      return;
    }

    const minutes = Math.floor(Math.max(0, state.examSession.timeRemaining) / 60);
    const seconds = Math.max(0, state.examSession.timeRemaining) % 60;
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
          <span class="quiz-meta">Question ${currentExamIndex + 1} of ${totalQuestions}</span>
          ${renderBadges(q.category, q.difficulty)}
        </div>
        <p class="question-text">${formatCode(q.question)}</p>
        <ul class="options-list">
          ${q.options.map((opt, i) => `
            <li class="option-item ${selectedAnswer === i ? 'selected' : ''}" data-index="${i}">
              <span class="option-letter">
                ${optionLetters[i]}
              </span>
              <span>${formatCode(opt)}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" id="exam-prev" ${currentExamIndex === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn btn-primary" id="exam-next" ${currentExamIndex === totalQuestions - 1 ? 'disabled' : ''}>Next →</button>
      </div>

      <!-- Keyboard Shortcuts Hint Bar -->
      <div class="keyboard-hint-bar" style="margin-top: 1rem;">
        <span><span class="kbd-key">A</span>–<span class="kbd-key">D</span> / <span class="kbd-key">1</span>–<span class="kbd-key">4</span> Select</span>
        <span><span class="kbd-key">←</span> / <span class="kbd-key">→</span> Navigate</span>
      </div>
    `;

    // Handle Option Selection
    questionContainer.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', () => {
        const optionIdx = parseInt(item.getAttribute('data-index'));
        selectOption(optionIdx);
      });
    });

    // Navigation buttons
    document.getElementById('exam-prev')?.addEventListener('click', () => goPrev());
    document.getElementById('exam-next')?.addEventListener('click', () => goNext());
  }

  function selectOption(optionIdx) {
    if (optionIdx === undefined || optionIdx < 0) return;
    const q = state.examSession.questions[currentExamIndex];
    if (optionIdx >= q.options.length) return;

    state.examSession.answers[currentExamIndex] = optionIdx;
    renderActiveQuestion();
    updateGridStatus();
  }

  function goPrev() {
    if (currentExamIndex > 0) {
      currentExamIndex--;
      renderActiveQuestion();
      updateGridStatus();
    }
  }

  function goNext() {
    if (currentExamIndex < totalQuestions - 1) {
      currentExamIndex++;
      renderActiveQuestion();
      updateGridStatus();
    }
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
    if (state.examSession.timerId) {
      clearInterval(state.examSession.timerId);
      state.examSession.timerId = null;
    }
    
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
        category: q.category,
        difficulty: q.difficulty,
        isCorrect: isCorrect
      });
    });
    
    const finalScorePercent = Math.round((correctCount / totalQuestions) * 100);
    const timeElapsed = isTimed ? (state.examSession.totalTime - state.examSession.timeRemaining) : 0;
    
    // Record in history
    const historyItem = {
      id: Date.now().toString(),
      title: state.examSession.examTitle || 'Practice Exam',
      score: finalScorePercent,
      date: new Date().toLocaleDateString(),
      elapsed: timeElapsed,
      total: totalQuestions,
      correctCount: correctCount
    };
    state.history.unshift(historyItem);
    storage.saveHistory(state.history);
    
    // Save review data to app-state so Review Page can fetch it
    state.latestReviewData = {
      items: reviewData,
      totalQuestions: totalQuestions,
      title: state.examSession.examTitle || 'Exam Review'
    };

    if (examKeyHandler) {
      window.removeEventListener('keydown', examKeyHandler);
      examKeyHandler = null;
    }
    
    // Redirect to review page
    setView('review');
  }

  // Draw core Layout
  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <h2 style="font-size: 1.3rem;">${state.examSession.examTitle || 'Practice Exam'}</h2>
    </div>
    <div class="exam-layout">
      <!-- Question Container -->
      <div id="exam-question-container"></div>
      
      <!-- Exam Control Sidebar -->
      <aside class="exam-nav-sidebar">
        <div class="exam-timer">
          ⏳ <span id="exam-timer-val">00:00</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1rem;">Question Grid</h3>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">
            ${Object.keys(state.examSession.answers).length} / ${totalQuestions}
          </span>
        </div>

        <div class="question-grid" style="max-height: 280px; overflow-y: auto; padding-right: 0.25rem;">
          ${Array.from({ length: totalQuestions }).map((_, i) => `
            <div class="grid-num" data-index="${i}">${i + 1}</div>
          `).join('')}
        </div>
        
        <button class="btn btn-primary" id="exam-submit-btn" style="width: 100%; background: var(--color-gcp-red); margin-top: 1rem;">Submit Exam</button>
        <button class="btn btn-secondary" id="exam-quit-btn" style="width: 100%; margin-top: 0.5rem;">Quit Exam</button>
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
    const answeredCount = Object.keys(state.examSession.answers).length;
    const unanswered = totalQuestions - answeredCount;
    let msg = 'Are you sure you want to submit your exam answers?';
    if (unanswered > 0) {
      msg = `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`;
    }
    if (confirm(msg)) {
      submitExam();
    }
  });

  document.getElementById('exam-quit-btn').addEventListener('click', () => {
    if (confirm('Quit now? Current exam progress will be lost.')) {
      if (examKeyHandler) {
        window.removeEventListener('keydown', examKeyHandler);
        examKeyHandler = null;
      }
      resetExam();
      setView('dashboard');
    }
  });

  // Keyboard Shortcuts Handler
  examKeyHandler = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const key = e.key.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(key)) {
      const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      selectOption(map[key]);
    } else if (['1', '2', '3', '4'].includes(key)) {
      selectOption(parseInt(key) - 1);
    } else if (e.key === 'ArrowLeft') {
      goPrev();
    } else if (e.key === 'ArrowRight') {
      goNext();
    }
  };

  window.addEventListener('keydown', examKeyHandler);

  // Load first view
  renderActiveQuestion();
  updateTimerDisplay();
  updateGridStatus();
}
