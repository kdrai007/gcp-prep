import { state, setView } from '../state.js';

export function renderFlashcard() {
  const container = document.getElementById('app-view');
  
  const baseList = state.filteredQuestions.length > 0 ? state.filteredQuestions : state.questions;
  let list = [...baseList].sort(() => 0.5 - Math.random());
  let currentCardIndex = 0;
  
  function renderCard() {
    const q = list[currentCardIndex];
    if (!q) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h3>No questions available for flashcard study.</h3>
          <button class="btn btn-primary" id="back-dash" style="margin-top: 1rem;">Back to Dashboard</button>
        </div>
      `;
      document.getElementById('back-dash').addEventListener('click', () => setView('dashboard'));
      return;
    }
    
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" id="fc-back">← Back</button>
        <span class="quiz-meta">Card ${currentCardIndex + 1} of ${list.length}</span>
      </div>

      <div class="flashcard-wrapper">
        <div class="flashcard" id="flashcard-card">
          <!-- Front Face -->
          <div class="card-face card-front">
            <h3 style="color: var(--color-gcp-blue); margin-bottom: 1rem;">Question Details</h3>
            <p class="question-text" style="font-size: 1.15rem;">${q.question}</p>
            <span style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Click card to flip</span>
          </div>
          
          <!-- Back Face -->
          <div class="card-face card-back">
            <h3 style="color: var(--color-gcp-green); margin-bottom: 0.5rem;">Correct Answer</h3>
            <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
              ${optionLetters[q.correct]}) ${q.options[q.correct]}
            </p>
            <div style="font-size: 0.95rem; text-align: left; max-height: 180px; overflow-y: auto; padding: 0.5rem; border-top: 1px solid var(--color-card-border);">
              ${q.explanation}
            </div>
            <span style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Click card to flip back</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; max-width: 400px; margin: 0 auto; gap: 1rem;">
        <button class="btn btn-secondary" id="fc-prev" style="flex: 1;" ${currentCardIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary" id="fc-next" style="flex: 1;" ${currentCardIndex === list.length - 1 ? 'disabled' : ''}>Next</button>
      </div>
    `;

    // 3D Flip toggle click listener
    const card = document.getElementById('flashcard-card');
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });

    // Navigation Handlers
    document.getElementById('fc-prev').addEventListener('click', () => {
      if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCard();
      }
    });

    document.getElementById('fc-next').addEventListener('click', () => {
      if (currentCardIndex < list.length - 1) {
        currentCardIndex++;
        renderCard();
      }
    });

    document.getElementById('fc-back').addEventListener('click', () => setView('dashboard'));
  }

  renderCard();
}
