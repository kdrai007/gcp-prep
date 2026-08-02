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
  document.getElementById('mode-practice').addEventListener('click', () => {
    state.filteredQuestions = getFilteredQuestions();
    state.currentQuestionIndex = 0;
    setView('practice');
  });
  
  document.getElementById('mode-exam').addEventListener('click', () => {
    setView('exam');
  });
  
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
