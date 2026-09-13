export const state = {
  questions: [],
  filteredQuestions: [],
  currentView: 'dashboard',
  currentQuestionIndex: 0,
  activeMode: null, // 'practice' | 'exam' | 'flashcard'
  bookmarks: [],
  practiceProgress: {}, // { questionId: { attempted: true, correct: true } }
  history: [], // { id, score, date, elapsed, total }
  
  // Filters
  categoryFilter: 'all',
  difficultyFilter: 'all',
  searchQuery: '',
  
  examSession: {
    questions: [],
    answers: {}, // { index: optionIndex }
    timeRemaining: 0,
    totalTime: 0,
    timerId: null,
    examTitle: 'GCP Practice Exam'
  },
  latestReviewData: null
};

export function setView(viewName) {
  state.currentView = viewName;
  window.location.hash = `#/${viewName}`;
}

export function resetExam() {
  if (state.examSession.timerId) {
    clearInterval(state.examSession.timerId);
    state.examSession.timerId = null;
  }
  state.examSession = {
    questions: [],
    answers: {},
    timeRemaining: 0,
    totalTime: 0,
    timerId: null,
    examTitle: 'GCP Practice Exam'
  };
}

/**
 * Filter questions based on state.searchQuery, state.categoryFilter, and state.difficultyFilter
 */
export function applyFilters() {
  let filtered = [...state.questions];

  if (state.categoryFilter && state.categoryFilter !== 'all') {
    filtered = filtered.filter(q => q.category === state.categoryFilter);
  }

  if (state.difficultyFilter && state.difficultyFilter !== 'all') {
    filtered = filtered.filter(q => (q.difficulty || 'Medium') === state.difficultyFilter);
  }

  if (state.searchQuery && state.searchQuery.trim() !== '') {
    const term = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(q => {
      const qText = (q.question + ' ' + (q.explanation || '') + ' ' + (q.options || []).join(' ')).toLowerCase();
      return qText.includes(term);
    });
  }

  state.filteredQuestions = filtered;
  state.currentQuestionIndex = 0;
  return filtered;
}
