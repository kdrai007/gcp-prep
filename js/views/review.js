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
  
  const correctCount = data.filter(d => d.isCorrect).length;
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
