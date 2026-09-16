const KEYS = {
  BOOKMARKS: 'gcp_quiz_bookmarks',
  HISTORY: 'gcp_quiz_history',
  PRACTICE: 'gcp_quiz_practice',
  STREAK: 'gcp_quiz_streak',
  EXAM_DATE: 'gcp_quiz_exam_date'
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
  saveStreak(streak) {
    localStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  },
  loadStreak() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.STREAK)) || { count: 0, lastDate: null };
    } catch {
      return { count: 0, lastDate: null };
    }
  },
  saveExamDate(dateStr) {
    if (dateStr) {
      localStorage.setItem(KEYS.EXAM_DATE, dateStr);
    } else {
      localStorage.removeItem(KEYS.EXAM_DATE);
    }
  },
  loadExamDate() {
    return localStorage.getItem(KEYS.EXAM_DATE) || null;
  },
  exportAll() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      bookmarks: this.loadBookmarks(),
      history: this.loadHistory(),
      practiceProgress: this.loadPractice(),
      streak: this.loadStreak(),
      examDate: this.loadExamDate()
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
      if (data.streak && typeof data.streak === 'object') {
        this.saveStreak(data.streak);
      }
      if (data.examDate !== undefined) {
        this.saveExamDate(data.examDate);
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
    localStorage.removeItem(KEYS.STREAK);
    localStorage.removeItem(KEYS.EXAM_DATE);
  }
};
