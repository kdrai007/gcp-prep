# Design Document: Google Cloud Quiz Web Application Redesign

**Date:** 2026-07-17  
**Status:** Approved  
**Author:** Antigravity (AI Assistant)

---

## 1. Executive Summary
The goal of this project is to redesign the existing Google Cloud Quiz practice app from a static single-page question list into a premium, interactive, dynamic, and beautiful Single-Page Application (SPA) built using modern vanilla JavaScript, CSS custom properties, and custom components. The redesign features high-end UI aesthetics (GCP glassmorphism theme, smooth animations, dark mode) and three distinct learning modes: Practice, Exam, and Flashcards.

---

## 2. System Architecture

We will implement a Modular View-State architecture using ES6 JavaScript modules. This separates state management, routing, local storage persistence, and view renderers.

### Directory Structure
```
gcp-ace-practice-questions/
├── index.html                  # Core single-page layout structure
├── data.json                   # Existing practice questions dataset
├── style.css                   # Global styling system, variables, layouts, animations
├── docs/
│   └── plans/
│       └── 2026-07-17-gcp-quiz-redesign-design.md   # This design document
└── js/
    ├── app.js                  # Entry point & lightweight hash-based router
    ├── state.js                # Core state container (reactive-style)
    ├── storage.js              # LocalStorage wrapper for stats, bookmarks, and progress
    └── views/
        ├── dashboard.js        # View: User progress stats, mode selector cards, filters
        ├── practice.js         # View: Guided question runner with instant review
        ├── exam.js             # View: Simulated GCP certification exam with timers
        ├── flashcard.js        # View: Flip cards for active recall memorization
        └── review.js           # View: Detailed exam feedback and mistake analysis
```

---

## 3. UI/UX Design System & Theme

We will establish a premium styling system in `style.css` using CSS custom properties for styling flexibility and Dark Mode support.

### CSS Custom Properties (Theme Tokens)
```css
:root {
  --color-bg-primary: #0f172a; /* Slate 900 */
  --color-bg-secondary: #1e293b; /* Slate 800 */
  --color-card-bg: rgba(30, 41, 59, 0.7);
  --color-card-border: rgba(148, 163, 184, 0.1);
  --color-glass-blur: blur(12px);
  
  /* GCP Brand Palette */
  --color-gcp-blue: #4285f4;
  --color-gcp-red: #ea4335;
  --color-gcp-yellow: #fbbb05;
  --color-gcp-green: #34a853;
  
  /* Text */
  --color-text-main: #f8fafc; /* Slate 50 */
  --color-text-muted: #94a3b8; /* Slate 400 */
  
  /* Utilities */
  --font-sans: 'Outfit', 'Inter', -apple-system, sans-serif;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-premium: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
}

[data-theme="light"] {
  --color-bg-primary: #f8fafc; /* Slate 50 */
  --color-bg-secondary: #f1f5f9; /* Slate 100 */
  --color-card-bg: rgba(255, 255, 255, 0.8);
  --color-card-border: rgba(148, 163, 184, 0.2);
  --color-text-main: #0f172a; /* Slate 900 */
  --color-text-muted: #64748b; /* Slate 500 */
}
```

### Visual Enhancements
* **Glassmorphism**: Quiz cards and controls will feature translucent backdrops using `backdrop-filter: blur()`.
* **Micro-interactions**: Subtle hover state transitions on multiple-choice options (fill background color change + slight lift).
* **Smooth Page Transitions**: Page views fade in and out during navigation.
* **3D Flip Card Effect**: CSS 3D transforms (`transform-style: preserve-3d`) for card flips in Flashcard Mode.

---

## 4. State Management

The `state.js` module holds the current application state and exposes methods to modify it.

```javascript
export const state = {
  // Database
  questions: [],
  filteredQuestions: [],
  
  // Navigation
  currentView: 'dashboard',
  currentQuestionIndex: 0,
  
  // Current Mode Session
  activeMode: null, // 'practice' | 'exam' | 'flashcard'
  
  // User Performance Data (Persisted)
  bookmarks: [], // Array of questionIds
  history: [],   // Array of { examId, score, date, timeSpent, totalQuestions }
  practiceProgress: {}, // Map of { questionId: { attempted: bool, answeredCorrectly: bool } }
  
  // Exam Specifics
  examSession: {
    selectedAnswers: {}, // Map of { questionIndex: selectedOptionIndex }
    timeRemaining: 0,
    timerId: null,
    examQuestions: []  // 50 randomly sampled questions
  }
};
```

---

## 5. Functional Features by View

### A. Dashboard View
* Displays completion rate and accuracy statistics via SVG progress rings.
* Interactive mode selector cards.
* Filter system: Dropdowns for specific GCP tags/topics (dynamically extracted from data, e.g., IAM, Storage, Networking).
* Full-text search over questions.

### B. Practice Mode
* Displays questions one at a time.
* Selection feedback: Clicking an option immediately reveals if it's correct (Green highlight) or incorrect (Red highlight) and reveals the explanation panel.
* Track bookmarks and bookmark statuses.

### C. Exam Mode
* Generates a 50-question mock exam.
* 120-minute timer counting down at the top of the interface.
* Navigation sidebar allowing candidates to quickly jump between questions, check progress, and flag questions.
* Warning modal upon clicking "Submit Exam".

### D. Flashcard Mode
* 3D card layout featuring the question text on the front.
* Click to flip with smooth CSS transition.
* "Known" vs "Review Later" buttons to dynamically adjust card pools.

### E. Review Mode
* Highlights the overall score, accuracy rate, and passing criteria (>= 70%).
* Comprehensive list of questions showing your answers alongside the correct options and explanations.
