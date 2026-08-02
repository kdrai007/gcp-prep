export const state = {
  questions: [],
  filteredQuestions: [],
  currentView: 'dashboard',
  currentQuestionIndex: 0,
  activeMode: null, // 'practice' | 'exam' | 'flashcard'
  bookmarks: [],
  practiceProgress: {}, // { questionId: { attempted: true, correct: true } }
  history: [], // { id, score, date, elapsed, total }
  
  examSession: {
    questions: [],
    answers: {}, // { index: optionIndex }
    timeRemaining: 0,
    timerId: null
  }
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
    timerId: null
  };
}
