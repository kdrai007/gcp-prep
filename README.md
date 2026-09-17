# GCP Associate Cloud Engineer (ACE) Practice Hub ☁️

A modern, fast, and feature-rich Single Page Application (SPA) designed to help candidates prepare for and pass the **Google Cloud Associate Cloud Engineer (GCP-ACE)** certification exam.

---

## ✨ Features

- **100 Curated Exam Questions:**
  - Covers core GCP domains: Compute Engine, GKE / Containers, Cloud Storage, Databases (Cloud SQL, Spanner, Bigtable, Firestore), Networking (VPC, Subnets, Cloud NAT, Load Balancing), Identity & Access Management (IAM), Security, and Cloud Operations.
  - Includes recent exam patterns: Artifact Registry, GKE Autopilot, Workload Identity Federation, CLI command syntax (`gcloud`, `gsutil`), resource cost labels, and Cloud SQL HA.

- **Difficulty Tagging & Segmentation:**
  - Questions are classified into **🟢 Easy**, **🟡 Medium**, and **🔴 Hard** tiers.
  - **Dynamic Filters:** Filter questions by both Topic and Difficulty directly on the dashboard.
  - **Segmented Analytics:** Real-time breakdown of your completion and accuracy rate per difficulty level.

- **Multiple Study Modes:**
  - 📖 **Practice Mode:** Go through questions at your own pace with instant answer feedback and comprehensive explanations.
  - 🎯 **Target Weaknesses:** One-click mode that isolates and tests only the questions you have previously answered incorrectly.
  - ⚡ **Custom Quiz Generator:** Tailor your study sessions: select question count (10, 25, 50, or all), target topics, difficulty, and timer pace (standard 2.4 min/Q, speed sprint, or untimed).
  - ⏱️ **Full Exam Simulation:** 50 randomized questions with a 120-minute countdown timer and interactive progress grid matching the actual exam experience.
  - 🗂️ **Interactive 3D Flashcards:** Flip cards to reinforce key GCP facts and memory recall.
  - 📑 **Review & History:** In-depth score breakdowns, past exam history, and bookmarked questions.

- **⌨️ Power-User Keyboard Shortcuts:**
  - **`A`**, **`B`**, **`C`**, **`D`** or **`1`**, **`2`**, **`3`**, **`4`**: Select option.
  - **`←` / `→`**: Navigate to previous / next question or flashcard.
  - **`Space`**: Flip flashcard front/back.
  - **`B`**: Toggle question bookmark.

- **💾 Data Management & Privacy:**
  - 100% client-side: all progress, bookmarks, and test runs are stored securely in browser `localStorage`.
  - **Export Progress:** Download your entire study state as a timestamped JSON file.
  - **Import Progress:** Restore or transfer your progress across devices and browsers.
  - **Reset Progress:** Easily wipe history or start fresh when you are ready.

- **📱 Progressive Web App (PWA) & Offline Ready:**
  - Includes `manifest.json` and a Service Worker (`sw.js`) that caches all questions and application assets for offline study.

---

## 🚀 Getting Started

No build tools, bundlers, or package managers are required! The application is built with vanilla JavaScript (ES modules), HTML5, and CSS3.

### Running with a Local Web Server (Recommended)

Because ES modules (`type="module"`) are used, serve the project through any local HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node (npx)
npx serve .
```

Then open your browser at:
```
http://localhost:8000
```

---

## 📁 Project Structure

```
.
├── index.html            # Main HTML entry point & PWA metadata
├── style.css             # Glassmorphic UI styling, dark/light themes, badges
├── manifest.json         # PWA web app manifest
├── sw.js                 # Service worker for offline caching
├── data.json             # 100 questions database with difficulty & explanations
├── js/
│   ├── app.js            # App bootstrap, hash router, and dynamic tagging
│   ├── state.js          # Centralized reactive state store
│   ├── storage.js        # LocalStorage helpers with export/import/clear
│   ├── utils.js          # Code formatting, HTML escaping, and badge helpers
│   └── views/
│       ├── dashboard.js  # Dashboard, filters, segmented stats & custom quiz modal
│       ├── practice.js   # Practice mode with keyboard shortcuts
│       ├── exam.js       # Exam simulator & customizable quiz engine
│       ├── flashcard.js  # 3D interactive flashcards
│       └── review.js     # Post-exam review and session score history
└── README.md             # Project documentation
```

---

## 🤝 Contributing & Adding Questions

To add more questions, append them to `data.json` following this structure:

```json
{
  "id": "101",
  "question": "Your question text here...",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct": 0,
  "explanation": "Explanation of why Option A is correct...",
  "difficulty": "Medium"
}
```
*(Difficulty can be `"Easy"`, `"Medium"`, or `"Hard"`).*
