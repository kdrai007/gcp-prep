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
  statusFilter: 'all', // 'all' | 'solved' | 'missed' | 'unattempted'
  searchQuery: '',
  
  examSession: {
    questions: [],
    answers: {}, // { index: optionIndex }
    timeRemaining: 0,
    totalTime: 0,
    timerId: null,
    examTitle: 'GCP Practice Exam'
  },
  // Streak & Exam Target Date
  streak: { count: 0, lastDate: null },
  examDate: null, // 'YYYY-MM-DD'
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

export function hasActiveFilters() {
  return Boolean(
    (state.searchQuery && state.searchQuery.trim() !== '') ||
    (state.categoryFilter && state.categoryFilter !== 'all') ||
    (state.difficultyFilter && state.difficultyFilter !== 'all') ||
    (state.statusFilter && state.statusFilter !== 'all')
  );
}

export function resetFilters() {
  state.searchQuery = '';
  state.categoryFilter = 'all';
  state.difficultyFilter = 'all';
  state.statusFilter = 'all';
  applyFilters();
}

/**
 * Filter questions based on state.searchQuery, categoryFilter, difficultyFilter, and statusFilter
 */
export function applyFilters() {
  let filtered = [...state.questions];

  // 1. Filter by category
  if (state.categoryFilter && state.categoryFilter !== 'all') {
    filtered = filtered.filter(q => q.category === state.categoryFilter);
  }

  // 2. Filter by difficulty
  if (state.difficultyFilter && state.difficultyFilter !== 'all') {
    filtered = filtered.filter(q => (q.difficulty || 'Medium') === state.difficultyFilter);
  }

  // 3. Filter by question status (All, Solved, Missed, Unattempted)
  if (state.statusFilter && state.statusFilter !== 'all') {
    if (state.statusFilter === 'solved') {
      filtered = filtered.filter(q => state.practiceProgress[q.id]?.attempted);
    } else if (state.statusFilter === 'missed') {
      filtered = filtered.filter(q => {
        const p = state.practiceProgress[q.id];
        return p && p.attempted && !p.correct;
      });
    } else if (state.statusFilter === 'unattempted') {
      filtered = filtered.filter(q => !state.practiceProgress[q.id]?.attempted);
    }
  }

  // 4. Search query (smart multi-term matching)
  if (state.searchQuery && state.searchQuery.trim() !== '') {
    const rawQuery = state.searchQuery.toLowerCase().trim();
    const terms = rawQuery.split(/\s+/).filter(Boolean);

    filtered = filtered.filter(q => {
      const idVariants = `q${q.id} #${q.id} question${q.id} ${q.id}`;
      const categoryStr = (q.category || '').toLowerCase();
      const diffStr = (q.difficulty || '').toLowerCase();
      const questionStr = (q.question || '').toLowerCase();
      const explanationStr = (q.explanation || '').toLowerCase();
      const optionsStr = (q.options || []).join(' ').toLowerCase();

      const haystack = `${idVariants} ${categoryStr} ${diffStr} ${questionStr} ${explanationStr} ${optionsStr}`;

      return terms.every(term => haystack.includes(term));
    });
  }

  state.filteredQuestions = filtered;
  return filtered;
}
