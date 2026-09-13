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
    try {
      return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS)) || [];
    } catch {
      return [];
    }
  },
  saveHistory(history) {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },
  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
    } catch {
      return [];
    }
  },
  savePractice(practice) {
    localStorage.setItem(KEYS.PRACTICE, JSON.stringify(practice));
  },
  loadPractice() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PRACTICE)) || {};
    } catch {
      return {};
    }
  },
  exportAll() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: this.loadBookmarks(),
      history: this.loadHistory(),
      practiceProgress: this.loadPractice()
    };
    return JSON.stringify(payload, null, 2);
  },
  importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        this.saveBookmarks(data.bookmarks);
      }
      if (data.history && Array.isArray(data.history)) {
        this.saveHistory(data.history);
      }
      if (data.practiceProgress && typeof data.practiceProgress === 'object') {
        this.savePractice(data.practiceProgress);
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  clearAll() {
    localStorage.removeItem(KEYS.BOOKMARKS);
    localStorage.removeItem(KEYS.HISTORY);
    localStorage.removeItem(KEYS.PRACTICE);
  }
};
