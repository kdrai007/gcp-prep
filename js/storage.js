const KEYS = {
  BOOKMARKS: 'gcp_quiz_bookmarks',
  HISTORY: 'gcp_quiz_history',
  PRACTICE: 'gcp_quiz_practice'
};

export const storage = {
  saveBookmarks(bookmarks) {
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },
  loadBookmarks() {
    return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS)) || [];
  },
  saveHistory(history) {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },
  loadHistory() {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
  },
  savePractice(practice) {
    localStorage.setItem(KEYS.PRACTICE, JSON.stringify(practice));
  },
  loadPractice() {
    return JSON.parse(localStorage.getItem(KEYS.PRACTICE)) || {};
  }
};
