import { state, setView, resetExam } from '../state.js';
import { formatCode, renderBadges } from '../utils.js';

export function renderReview() {
  const container = document.getElementById('app-view');
  
  const rawReviewData = state.latestReviewData;
  const items = Array.isArray(rawReviewData) ? rawReviewData : (rawReviewData?.items || []);
  const totalCount = rawReviewData?.totalQuestions || items.length || 50;
  const examTitle = rawReviewData?.title || 'Exam Review';

  const historyList = state.history || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div style="text-align: center; padding: 2rem;" class="quiz-card">
          <h3>No Active Exam Review</h3>
          <p style="color: var(--color-text-muted); margin-top: 0.5rem;">
            Complete an exam simulation or custom quiz to see question-by-question explanations here.
          </p>
          <button class="btn btn-primary" id="rev-back-dash" style="margin-top: 1.5rem;">Return to Dashboard</button>
        </div>

        ${renderHistorySection(historyList)}
      </div>
    `;
    document.getElementById('rev-back-dash').addEventListener('click', () => setView('dashboard'));
    return;
  }
  
  const correctCount = items.filter(d => d.isCorrect).length;
  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isPassed = scorePercent >= 70; // 70% passing threshold for GCP
  
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <!-- Scoreboard Panel -->
      <div class="stats-card" style="align-items: center; text-align: center; border-color: ${isPassed ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'};">
        <span class="quiz-meta" style="font-size: 1rem; font-weight: 600;">${examTitle}</span>
        <h2 style="color: ${isPassed ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'}; font-size: 2.25rem; margin-top: 0.5rem;">
          ${isPassed ? '🎉 Pass' : '❌ Needs Review'}
        </h2>
        <div style="font-size: 3.5rem; font-weight: 700; margin: 0.25rem 0;">
          ${scorePercent}%
        </div>
        <p style="color: var(--color-text-muted);">
          You answered <strong>${correctCount}</strong> out of <strong>${totalCount}</strong> questions correctly. (Passing threshold is 70%)
        </p>
        <button class="btn btn-primary" id="rev-dash-btn" style="margin-top: 1rem;">Return to Dashboard</button>
      </div>

      <!-- Question list -->
      <div>
        <h3 style="margin-bottom: 1.25rem;">Question-by-Question Breakdown</h3>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${items.map((q, idx) => {
            return `
              <div class="quiz-card" style="border-left: 6px solid ${q.isCorrect ? 'var(--color-gcp-green)' : 'var(--color-gcp-red)'};">
                <div class="quiz-header">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span class="quiz-meta">Question ${idx + 1}</span>
                    <span class="badge ${q.isCorrect ? 'badge-easy' : 'badge-hard'}">
                      ${q.isCorrect ? '✓ Correct' : '✕ Missed'}
                    </span>
                  </div>
                  ${renderBadges(q.category, q.difficulty)}
                </div>
                
                <p class="question-text" style="font-size: 1.05rem; margin-bottom: 1rem;">${formatCode(q.question)}</p>
                
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
                        <span>${formatCode(opt)}</span>
                      </li>
                    `;
                  }).join('')}
                </ul>
                
                <div class="explanation-panel">
                  <strong>Correct Answer: ${optionLetters[q.correct]}) ${formatCode(q.options[q.correct])}</strong>
                  <p style="margin-top: 0.5rem;">${formatCode(q.explanation)}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${renderHistorySection(historyList)}
    </div>
  `;

  document.getElementById('rev-dash-btn').addEventListener('click', () => {
    resetExam();
    state.latestReviewData = null;
    setView('dashboard');
  });
}

function renderHistorySection(historyList) {
  if (!historyList || historyList.length === 0) {
    return '';
  }

  return `
    <div class="quiz-card" style="margin-top: 1rem;">
      <h3 style="margin-bottom: 1rem;">Past Exam Sessions</h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${historyList.slice(0, 10).map((h, i) => {
          const pass = h.score >= 70;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--color-bg-secondary); border: 1px solid var(--color-card-border); border-radius: 8px;">
              <div>
                <strong>${h.title || 'Practice Exam'}</strong>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${h.date} • ${h.total} Questions</div>
              </div>
              <div style="text-align: right;">
                <span class="badge ${pass ? 'badge-easy' : 'badge-hard'}">${h.score}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
