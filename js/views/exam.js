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
  }
  
  // Start countdown timer if not already running
  if (!state.examSession.timerId) {
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
            <li class="option-item ${selectedAnswer === i ? 'selected' : ''}" data-index="${i}">
              <span class="option-letter">
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
