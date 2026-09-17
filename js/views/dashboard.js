import { state, setView, applyFilters, resetFilters, hasActiveFilters, resetExam } from '../state.js';
import { storage } from '../storage.js';
import { renderBadges, highlightText, renderDifficultyBadge, renderCategoryBadge, formatExamCountdown, calculateCurrentStreak } from '../utils.js';

// Domain specifications matching Google Cloud Associate Cloud Engineer Exam Blueprint
const DOMAIN_SPECS = [
  {
    id: 'compute',
    name: 'Compute & Kubernetes',
    weight: '28% Weight',
    categories: ['GKE / Containers', 'Compute Engine & Serverless'],
    icon: '💻'
  },
  {
    id: 'iam',
    name: 'Identity & Access Management (IAM)',
    weight: '22% Weight',
    categories: ['Identity & IAM'],
    icon: '🔐'
  },
  {
    id: 'networking',
    name: 'VPC Networking & Traffic Security',
    weight: '20% Weight',
    categories: ['Networking'],
    icon: '🌐'
  },
  {
    id: 'storage',
    name: 'Cloud Storage & Databases',
    weight: '18% Weight',
    categories: ['Cloud Storage', 'Databases & Analytics'],
    icon: '🗄️'
  },
  {
    id: 'ops',
    name: 'Operations & Management',
    weight: '12% Weight',
    categories: ['Management & Operations', 'General Cloud Concepts'],
    icon: '⚙️'
  }
];

export function renderDashboard() {
  const container = document.getElementById('app-view');

  // Apply active filters
  applyFilters();

  const total = state.questions.length;
  const attempted = Object.keys(state.practiceProgress).length;
  const correct = Object.values(state.practiceProgress).filter(p => p.correct).length;
  const missedCount = attempted - correct;
  const unattemptedCount = total - attempted;

  const completionPercent = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  // Exam Readiness Heuristic (40% completion weight + 60% accuracy weight)
  const readinessPercent = Math.min(100, Math.round((completionPercent * 0.4) + (accuracyPercent * 0.6)));

  // Pass Probability projection
  let passProjection = 'In Diagnostic Phase';
  let passColor = 'var(--color-gcp-yellow)';
  if (readinessPercent >= 75) {
    passProjection = 'Passing Likely (88%+ projected)';
    passColor = 'var(--color-gcp-green)';
  } else if (readinessPercent >= 50) {
    passProjection = 'Borderline Passing (70-75%)';
    passColor = 'var(--color-gcp-yellow)';
  } else if (attempted > 10) {
    passProjection = 'Needs Core Review (<65%)';
    passColor = 'var(--color-gcp-red)';
  }

  // Streak & Target Exam Date Telemetry
  const streakData = state.streak || storage.loadStreak();
  const currentStreak = calculateCurrentStreak(streakData);
  const examDate = state.examDate || storage.loadExamDate();
  const countdown = formatExamCountdown(examDate);

  // Difficulty specific stats
  const diffStats = {
    Easy: { total: 0, solved: 0, correct: 0 },
    Medium: { total: 0, solved: 0, correct: 0 },
    Hard: { total: 0, solved: 0, correct: 0 }
  };

  state.questions.forEach(q => {
    const d = q.difficulty || 'Medium';
    if (!diffStats[d]) diffStats[d] = { total: 0, solved: 0, correct: 0 };
    diffStats[d].total++;
    const prog = state.practiceProgress[q.id];
    if (prog && prog.attempted) {
      diffStats[d].solved++;
      if (prog.correct) diffStats[d].correct++;
    }
  });

  const easyAcc = diffStats.Easy.solved > 0 ? Math.round((diffStats.Easy.correct / diffStats.Easy.solved) * 100) : 0;
  const medAcc = diffStats.Medium.solved > 0 ? Math.round((diffStats.Medium.correct / diffStats.Medium.solved) * 100) : 0;
  const hardAcc = diffStats.Hard.solved > 0 ? Math.round((diffStats.Hard.correct / diffStats.Hard.solved) * 100) : 0;

  // Domain mastery breakdown calculation
  const domainStats = DOMAIN_SPECS.map(spec => {
    const domainQuestions = state.questions.filter(q => spec.categories.includes(q.category));
    const domainTotal = domainQuestions.length;
    let domainSolved = 0;
    let domainCorrect = 0;

    domainQuestions.forEach(q => {
      const p = state.practiceProgress[q.id];
      if (p && p.attempted) {
        domainSolved++;
        if (p.correct) domainCorrect++;
      }
    });

    const masteryPercent = domainTotal > 0 ? Math.round((domainCorrect / domainTotal) * 100) : 0;
    const isMastered = masteryPercent >= 75;

    return {
      ...spec,
      total: domainTotal,
      solved: domainSolved,
      correct: domainCorrect,
      mastery: masteryPercent,
      isMastered
    };
  });

  const masteredDomainsCount = domainStats.filter(d => d.isMastered).length;

  // Filter state
  const isFiltered = hasActiveFilters();
  const filteredList = state.filteredQuestions;
  const filteredCount = filteredList.length;

  const categories = [...new Set(state.questions.flatMap(q => q.category || ['General']))].sort();

  // Radial gauge offset (r=50, circumference = 251.2)
  const gaugeDashoffset = 251.2 - (251.2 * readinessPercent) / 100;

  container.innerHTML = `
    <!-- ==========================================
         HERO SECTION: READINESS GAUGE & KPI MATRIX
         ========================================== -->
    <section class="hero-bento-grid">
      <!-- Readiness Score Radar Tile -->
      <div class="readiness-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span class="badge badge-category" style="font-size: 0.72rem;">EXAM READINESS INDEX</span>
            <span class="badge" style="background: rgba(66, 133, 244, 0.15); color: ${passColor}; border: 1px solid ${passColor}; font-size: 0.72rem;">
              ● ${passProjection}
            </span>
          </div>

          <div class="readiness-gauge-layout">
            <div class="radial-gauge">
              <svg viewBox="0 0 120 120">
                <circle class="gauge-bg" cx="60" cy="60" r="48"></circle>
                <circle class="gauge-fill" cx="60" cy="60" r="48" stroke="var(--color-gcp-blue)" stroke-dasharray="301.6" stroke-dashoffset="${301.6 - (301.6 * readinessPercent) / 100}"></circle>
              </svg>
              <div class="gauge-text">
                <div class="gauge-score" style="color: var(--color-text-main);">${readinessPercent}%</div>
                <div class="gauge-label">Readiness</div>
              </div>
            </div>

            <div style="flex: 1; min-width: 160px;">
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem;">
                ${readinessPercent >= 70 ? 'Ready for Benchmark Test' : 'Syllabus in Progress'}
              </h3>
              <p style="font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.45;">
                You've mastered <strong>${masteredDomainsCount} of 5</strong> exam domains. Target passing score on official exam is 70%.
              </p>

              <!-- Target Exam & Streak Telemetry Pills -->
              <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <button id="btn-hero-exam-date" class="btn-icon" style="background: rgba(15, 23, 42, 0.45); border: 1px dashed var(--color-card-border); border-radius: 8px; padding: 0.3rem 0.65rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; color: ${countdown.color};" title="Click to set or change target exam date">
                  <span>🎯</span> <strong>${countdown.text}</strong>
                  <span style="color: var(--color-text-muted); font-size: 0.7rem;">✏️</span>
                </button>
                <button id="btn-hero-streak" class="btn-icon" style="background: rgba(15, 23, 42, 0.45); border: 1px dashed var(--color-card-border); border-radius: 8px; padding: 0.3rem 0.65rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; color: var(--color-gcp-yellow);" title="Click to view daily study streak details">
                  <span>🔥</span> <strong>${currentStreak}d Streak</strong>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btn-hero-sprint" style="box-shadow: 0 0 14px rgba(66, 133, 244, 0.35); flex: 1;">
            Start Next Sprint 🚀
          </button>
          <button class="btn btn-secondary" id="btn-hero-exam" style="flex: 1;">
            Launch 50-Q Exam ⏱️
          </button>
        </div>
      </div>

      <!-- 4 KPI Metrics Grid -->
      <div class="kpi-grid">
        <!-- Tile 1: Questions Solved -->
        <div class="kpi-tile">
          <div class="kpi-header">
            <span class="kpi-title">Questions Solved</span>
            <span class="badge badge-easy" style="font-size: 0.7rem;">${completionPercent}% Complete</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${attempted}</span>
            <span class="kpi-sub">/ ${total} total</span>
          </div>
          <div class="metric-progress-bar">
            <div class="metric-progress-fill" style="width: ${completionPercent}%; background: var(--color-gcp-blue);"></div>
          </div>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">
            ${unattemptedCount} questions remaining in active question bank
          </span>
        </div>

        <!-- Tile 2: Overall Accuracy -->
        <div class="kpi-tile">
          <div class="kpi-header">
            <span class="kpi-title">Overall Accuracy</span>
            <span class="badge ${accuracyPercent >= 70 ? 'badge-easy' : 'badge-medium'}" style="font-size: 0.7rem;">
              ${accuracyPercent >= 70 ? 'Above Passing' : 'Needs Focus'}
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value" style="color: ${accuracyPercent >= 70 ? 'var(--color-gcp-green)' : 'var(--color-gcp-yellow)'};">${accuracyPercent}%</span>
            <span class="kpi-sub">(Passing: 70%)</span>
          </div>
          <div class="metric-progress-bar">
            <div class="metric-progress-fill" style="width: ${accuracyPercent}%; background: ${accuracyPercent >= 70 ? 'var(--color-gcp-green)' : 'var(--color-gcp-yellow)'};"></div>
          </div>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">
            <strong>${correct}</strong> correct answers • <strong>${missedCount}</strong> missed
          </span>
        </div>

        <!-- Tile 3: Study Sessions & History -->
        <div class="kpi-tile">
          <div class="kpi-header">
            <span class="kpi-title">Exam Simulations</span>
            <span class="badge badge-category" style="font-size: 0.7rem;">Official Format</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${state.history.length}</span>
            <span class="kpi-sub">full tests completed</span>
          </div>
          <div class="metric-progress-bar">
            <div class="metric-progress-fill" style="width: ${Math.min(100, state.history.length * 20)}%; background: var(--color-gcp-green);"></div>
          </div>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">
            ${state.history.length > 0 ? `Latest score: ${state.history[0].score}%` : 'Take your first 50-Q exam'}
          </span>
        </div>

        <!-- Tile 4: Difficulty Calibration -->
        <div class="kpi-tile">
          <div class="kpi-header">
            <span class="kpi-title">Difficulty Mastery</span>
            <span class="badge badge-category" style="font-size: 0.7rem;">Calibrated</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
              <span>🟢 Easy: ${diffStats.Easy.solved}/${diffStats.Easy.total}</span>
              <strong>${easyAcc}% Acc</strong>
            </div>
            <div class="metric-progress-bar" style="height: 4px;">
              <div class="metric-progress-fill" style="width: ${easyAcc}%; background: var(--color-gcp-green);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
              <span>🟡 Medium: ${diffStats.Medium.solved}/${diffStats.Medium.total}</span>
              <strong>${medAcc}% Acc</strong>
            </div>
            <div class="metric-progress-bar" style="height: 4px;">
              <div class="metric-progress-fill" style="width: ${medAcc}%; background: var(--color-gcp-yellow);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
              <span>🔴 Hard: ${diffStats.Hard.solved}/${diffStats.Hard.total}</span>
              <strong>${hardAcc}% Acc</strong>
            </div>
            <div class="metric-progress-bar" style="height: 4px;">
              <div class="metric-progress-fill" style="width: ${hardAcc}%; background: var(--color-gcp-red);"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==========================================
         INTERACTIVE STUDY MODES (5 DISTINCT TILES)
         ========================================== -->
    <section style="margin-bottom: 2.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
          <span>🎯 Study & Exam Execution Modes</span>
        </h3>
        <span style="font-size: 0.8rem; color: var(--color-text-muted);">5 Specialized Learning Tools</span>
      </div>

      <div class="modes-grid-5">
        <!-- Mode 1: Practice Mode -->
        <div class="mode-card-stitch" id="mode-practice" style="border-top: 3px solid var(--color-gcp-blue);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4>📖 Practice Mode</h4>
              <span class="badge badge-category" style="font-size: 0.7rem;">${total} Qs</span>
            </div>
            <p>Self-paced explorer with immediate answer feedback, architectural rationale, and command options.</p>
          </div>
          <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: space-between;">
            <span>Resume Practice</span> <span>→</span>
          </button>
        </div>

        <!-- Mode 2: Target Weaknesses -->
        <div class="mode-card-stitch" id="mode-weaknesses" style="border-top: 3px solid var(--color-gcp-red);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4>🎯 Target Weaknesses</h4>
              <span class="badge ${missedCount > 0 ? 'badge-hard' : 'badge-category'}" style="font-size: 0.7rem;">
                ${missedCount} Missed
              </span>
            </div>
            <p>Focused drilling exclusively on questions previously answered incorrectly for targeted recovery.</p>
          </div>
          <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: space-between;">
            <span>Drill Mistakes</span> <span>→</span>
          </button>
        </div>

        <!-- Mode 3: Custom Quiz Builder -->
        <div class="mode-card-stitch" id="mode-custom-quiz" style="border-top: 3px solid var(--color-gcp-yellow);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4>⚡ Custom Sprint</h4>
              <span class="badge badge-medium" style="font-size: 0.7rem;">Configurable</span>
            </div>
            <p>Build custom sessions: select question count (10, 25, 50), focus domains, difficulty, and pace.</p>
          </div>
          <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: space-between;">
            <span>Configure Quiz</span> <span>⚙️</span>
          </button>
        </div>

        <!-- Mode 4: Full Simulation Exam -->
        <div class="mode-card-stitch" id="mode-exam" style="border-top: 3px solid var(--color-gcp-green);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4>⏱️ Exam Simulation</h4>
              <span class="badge badge-easy" style="font-size: 0.7rem;">Official Format</span>
            </div>
            <p>Official exam conditions: 50 randomized questions, 120-minute timer, and post-exam score report.</p>
          </div>
          <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: space-between;">
            <span>Launch Exam</span> <span>🚀</span>
          </button>
        </div>

        <!-- Mode 5: Flashcards -->
        <div class="mode-card-stitch" id="mode-flashcard" style="border-top: 3px solid var(--color-gcp-blue);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4>🗂️ CLI Flashcards</h4>
              <span class="badge badge-category" style="font-size: 0.7rem;">Active Recall</span>
            </div>
            <p>Fast mental recall 3D flipcards designed for memorizing gcloud flags, IAM roles, and storage tiers.</p>
          </div>
          <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: space-between;">
            <span>Flip Cards</span> <span>↺</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ==========================================
         EXAM DOMAIN COMPETENCY BREAKDOWN
         ========================================== -->
    <section style="margin-bottom: 2.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700;">📊 Exam Domain Competency Blueprint</h3>
          <p style="font-size: 0.82rem; color: var(--color-text-muted);">
            Official GCP Associate Cloud Engineer knowledge domains weighted by exam distribution
          </p>
        </div>
      </div>

      <div class="domain-syllabus-grid">
        ${domainStats.map(d => `
          <div class="domain-card" data-domain="${d.categories.join('|')}">
            <div>
              <div class="domain-header">
                <span class="domain-title">${d.icon} ${d.name}</span>
                <span class="badge badge-category" style="font-size: 0.68rem;">${d.weight}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin: 0.75rem 0 0.35rem 0;">
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">${d.correct} / ${d.total} Qs Mastered</span>
                <strong style="font-size: 0.95rem; color: ${d.mastery >= 75 ? 'var(--color-gcp-green)' : (d.mastery >= 40 ? 'var(--color-gcp-yellow)' : 'var(--color-text-muted)')};">${d.mastery}%</strong>
              </div>

              <div class="metric-progress-bar">
                <div class="metric-progress-fill" style="width: ${d.mastery}%; background: ${d.mastery >= 75 ? 'var(--color-gcp-green)' : (d.mastery >= 40 ? 'var(--color-gcp-yellow)' : 'var(--color-gcp-blue)')};"></div>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm domain-drill-btn" data-categories="${d.categories.join('|')}" style="width: 100%; font-size: 0.8rem; justify-content: space-between;">
              <span>Practice Domain</span> <span>→</span>
            </button>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ==========================================
         LIVE QUESTION BANK EXPLORER & SEARCH
         ========================================== -->
    <section class="quiz-card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
            <span>🔍 Interactive Question Bank Explorer</span>
            <span id="qb-badge-count" class="badge badge-category" style="font-size: 0.72rem;">${filteredCount} Questions</span>
          </h3>
          <p style="font-size: 0.82rem; color: var(--color-text-muted);">
            Search, filter by status or difficulty, and jump directly into any scenario.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button id="btn-practice-filtered" class="btn btn-primary btn-sm" style="box-shadow: 0 0 12px rgba(66, 133, 244, 0.3);">
            Practice Filtered (${filteredCount}) →
          </button>
        </div>
      </div>

      <!-- Search & Filters Strip -->
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <!-- Search Bar -->
          <div class="search-input-wrapper" style="flex: 1; min-width: 260px;">
            <input 
              type="text" 
              id="search-bar" 
              class="input-text" 
              placeholder="Search concepts, gcloud CLI flags, architectures (e.g. IAM, Spanner, NAT, #42)..." 
              value="${state.searchQuery}"
              autocomplete="off"
            >
            <button id="search-clear-btn" class="search-clear-btn" title="Clear search" style="${state.searchQuery ? 'display: block;' : 'display: none;'}">✕</button>
          </div>

          <!-- Category Filter -->
          <select id="category-filter" class="select-input" style="min-width: 170px; width: auto;">
            <option value="all" ${state.categoryFilter === 'all' ? 'selected' : ''}>All Domains (${total})</option>
            ${categories.map(cat => `<option value="${cat}" ${state.categoryFilter === cat ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>

          <!-- Difficulty Filter -->
          <select id="difficulty-filter" class="select-input" style="min-width: 150px; width: auto;">
            <option value="all" ${state.difficultyFilter === 'all' ? 'selected' : ''}>All Difficulties</option>
            <option value="Easy" ${state.difficultyFilter === 'Easy' ? 'selected' : ''}>🟢 Easy</option>
            <option value="Medium" ${state.difficultyFilter === 'Medium' ? 'selected' : ''}>🟡 Medium</option>
            <option value="Hard" ${state.difficultyFilter === 'Hard' ? 'selected' : ''}>🔴 Hard</option>
          </select>
        </div>

        <!-- Status Filter Pills Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div class="status-pills-row">
            <button class="status-pill-btn ${state.statusFilter === 'all' ? 'active' : ''}" data-status="all">
              All (${total})
            </button>
            <button class="status-pill-btn ${state.statusFilter === 'solved' ? 'active' : ''}" data-status="solved">
              ✅ Solved (${attempted})
            </button>
            <button class="status-pill-btn ${state.statusFilter === 'missed' ? 'active' : ''}" data-status="missed">
              ❌ Missed (${missedCount})
            </button>
            <button class="status-pill-btn ${state.statusFilter === 'unattempted' ? 'active' : ''}" data-status="unattempted">
              ⚪ Unseen (${unattemptedCount})
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem;">
            <span id="filter-count-text" style="color: var(--color-text-muted);">
              ${isFiltered ? `Found <strong>${filteredCount}</strong> matching items` : `Showing all <strong>${total}</strong> items`}
            </span>
            <button id="clear-filters-btn" class="btn-icon" style="color: var(--color-gcp-blue); font-size: 0.8rem; padding: 0.2rem 0.5rem; ${isFiltered ? 'display: inline-block;' : 'display: none;'}">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Question Bank Table List -->
      <div id="question-bank-container" class="question-bank-list">
        ${renderQuestionBankItems(filteredList, state.searchQuery)}
      </div>
    </section>

    <!-- ==========================================
         DATA MANAGEMENT & SHORTCUTS FOOTER
         ========================================== -->
    <section class="data-management-card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.25rem;">💾 Local State Persistence</h4>
          <p style="color: var(--color-text-muted); font-size: 0.82rem;">
            Export timestamped backup JSON or restore progress across devices. All data remains in your browser.
          </p>
        </div>
        <div class="data-actions-row">
          <button class="btn btn-secondary btn-sm" id="btn-export-data">⬇️ Export JSON</button>
          <button class="btn btn-secondary btn-sm" id="btn-import-data-trigger">⬆️ Import Backup</button>
          <input type="file" id="file-import-input" accept=".json" style="display: none;">
          <button class="btn btn-danger btn-sm" id="btn-reset-data">🗑️ Reset Progress</button>
        </div>
      </div>

      <!-- Hotkeys Guide Pill -->
      <div class="keyboard-hint-bar" style="margin-top: 0.5rem;">
        <span><span class="kbd-key">A</span>–<span class="kbd-key">D</span> Option Select</span>
        <span><span class="kbd-key">←</span> / <span class="kbd-key">→</span> Navigate</span>
        <span><span class="kbd-key">Space</span> Flip Flashcard</span>
        <span><span class="kbd-key">B</span> Bookmark</span>
      </div>
    </section>

    <!-- Custom Quiz Modal Backdrop -->
    <div id="custom-quiz-modal" class="modal-backdrop" style="display: none;">
      <div class="modal-card">
        <div class="modal-header">
          <h3>⚡ Custom Quiz Generator</h3>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close Modal">✕</button>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-count">Number of Questions</label>
          <select id="custom-count" class="select-input">
            <option value="10">10 Questions (Quick Sprint)</option>
            <option value="25" selected>25 Questions (Standard Practice)</option>
            <option value="50">50 Questions (Full Length)</option>
            <option value="all">All Matching Questions (${filteredCount})</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-topic">Topic Focus</label>
          <select id="custom-topic" class="select-input">
            <option value="all">All Topics</option>
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-difficulty">Difficulty Filter</label>
          <select id="custom-difficulty" class="select-input">
            <option value="all">All Difficulties (Balanced)</option>
            <option value="Easy">🟢 Easy Only</option>
            <option value="Medium">🟡 Medium Only</option>
            <option value="Hard">🔴 Hard Only</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="custom-timer">Timer Option</label>
          <select id="custom-timer" class="select-input">
            <option value="timed" selected>Standard Exam Pace (2.4 min / question)</option>
            <option value="speed">Speed Challenge (1 min / question)</option>
            <option value="none">Untimed (Relaxed Study)</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="modal-start-btn">Start Custom Quiz 🚀</button>
        </div>
      </div>
    </div>
  `;

  // Helper to render question bank items with command extract
  function renderQuestionBankItems(questions, query) {
    if (!questions || questions.length === 0) {
      return `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted);">
          <p style="font-size: 1.15rem; margin-bottom: 0.5rem;">🔍 No questions match your criteria</p>
          <p style="font-size: 0.85rem;">Try adjusting search terms or reset the status / difficulty filters.</p>
        </div>
      `;
    }

    return questions.map((q, idx) => {
      const prog = state.practiceProgress[q.id];
      let statusIcon = '⚪';
      let statusTitle = 'Unattempted';
      if (prog && prog.attempted) {
        if (prog.correct) {
          statusIcon = '✅';
          statusTitle = 'Solved Correct';
        } else {
          statusIcon = '❌';
          statusTitle = 'Missed';
        }
      }
      const isBookmarked = state.bookmarks.includes(q.id);

      // Extract any gcloud / kubectl command mentioned in explanation or options
      const commandMatch = (q.explanation + ' ' + (q.options || []).join(' ')).match(/(gcloud\s+[a-z0-9\-_\s]+|kubectl\s+[a-z0-9\-_\s]+|gsutil\s+[a-z0-9\-_\s]+)/i);
      const commandSnippet = commandMatch ? commandMatch[0].slice(0, 45) + '...' : null;

      return `
        <div class="question-bank-item" data-id="${q.id}" data-idx="${idx}">
          <div class="question-bank-info">
            <span class="question-bank-num">#${q.id}</span>
            <span title="${statusTitle}">${statusIcon}</span>
            ${isBookmarked ? '<span title="Bookmarked">⭐</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;">
              <span class="question-bank-text">${highlightText(q.question, query)}</span>
              ${commandSnippet ? `<span class="qb-command-snippet" title="${commandSnippet}">${commandSnippet}</span>` : ''}
            </div>
          </div>
          <div class="question-bank-meta">
            ${renderBadges(q.category, q.difficulty)}
            <span style="color: var(--color-gcp-blue); font-size: 0.85rem; font-weight: 600; white-space: nowrap;">Practice →</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Live filter results updater without re-rendering search box
  function updateLiveFilterResults() {
    const list = applyFilters();
    const count = list.length;
    const active = hasActiveFilters();

    const countElem = document.getElementById('filter-count-text');
    if (countElem) {
      countElem.innerHTML = active 
        ? `Found <strong>${count}</strong> of <strong>${total}</strong> matching items` 
        : `Showing all <strong>${total}</strong> items`;
    }

    const resetBtn = document.getElementById('clear-filters-btn');
    if (resetBtn) resetBtn.style.display = active ? 'inline-block' : 'none';

    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.style.display = state.searchQuery ? 'block' : 'none';

    const qbBadge = document.getElementById('qb-badge-count');
    if (qbBadge) qbBadge.textContent = `${count} Questions`;

    const btnPracticeFiltered = document.getElementById('btn-practice-filtered');
    if (btnPracticeFiltered) {
      btnPracticeFiltered.textContent = `Practice Filtered (${count}) →`;
      btnPracticeFiltered.disabled = count === 0;
    }

    const qbContainer = document.getElementById('question-bank-container');
    if (qbContainer) {
      qbContainer.innerHTML = renderQuestionBankItems(list, state.searchQuery);
      attachQuestionBankClicks();
    }
  }

  function attachQuestionBankClicks() {
    const items = document.querySelectorAll('.question-bank-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const qId = item.getAttribute('data-id');
        const qIndex = state.filteredQuestions.findIndex(q => q.id === qId);
        state.currentQuestionIndex = qIndex >= 0 ? qIndex : 0;
        setView('practice');
      });
    });
  }

  // Search Input listener
  const searchInput = document.getElementById('search-bar');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    updateLiveFilterResults();
  });

  const searchClearBtn = document.getElementById('search-clear-btn');
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      searchInput.value = '';
      searchInput.focus();
      updateLiveFilterResults();
    });
  }

  // Category & Difficulty Selects
  document.getElementById('category-filter').addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    updateLiveFilterResults();
  });

  document.getElementById('difficulty-filter').addEventListener('change', (e) => {
    state.difficultyFilter = e.target.value;
    updateLiveFilterResults();
  });

  // Status Filter Pills (All, Solved, Missed, Unattempted)
  document.querySelectorAll('.status-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.statusFilter = btn.getAttribute('data-status');
      updateLiveFilterResults();
    });
  });

  // Reset Filters Button
  const resetBtn = document.getElementById('clear-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFilters();
      searchInput.value = '';
      document.getElementById('category-filter').value = 'all';
      document.getElementById('difficulty-filter').value = 'all';
      document.querySelectorAll('.status-pill-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-status') === 'all');
      });
      updateLiveFilterResults();
    });
  }

  // Practice Filtered Button
  const btnPracticeFiltered = document.getElementById('btn-practice-filtered');
  if (btnPracticeFiltered) {
    btnPracticeFiltered.addEventListener('click', () => {
      if (state.filteredQuestions.length === 0) return;
      state.currentQuestionIndex = 0;
      setView('practice');
    });
  }

  // Initial Question Bank click bind
  attachQuestionBankClicks();

  // Hero Quick CTA Buttons
  document.getElementById('btn-hero-sprint').addEventListener('click', () => {
    // Target unattempted or missed questions
    const priorityList = state.questions.filter(q => !state.practiceProgress[q.id]?.correct);
    if (priorityList.length > 0) {
      state.filteredQuestions = priorityList;
    } else {
      state.filteredQuestions = [...state.questions];
    }
    state.currentQuestionIndex = 0;
    setView('practice');
  });

  document.getElementById('btn-hero-exam').addEventListener('click', () => {
    resetExam();
    state.examSession.questions = [...state.questions].sort(() => 0.5 - Math.random()).slice(0, 50);
    state.examSession.timeRemaining = 120 * 60;
    state.examSession.totalTime = 120 * 60;
    state.examSession.examTitle = 'Full 50-Question Practice Exam';
    setView('exam');
  });

  document.getElementById('btn-hero-exam-date')?.addEventListener('click', () => {
    document.getElementById('header-exam-chip')?.click();
  });

  document.getElementById('btn-hero-streak')?.addEventListener('click', () => {
    document.getElementById('header-streak-chip')?.click();
  });

  // Domain Syllabus Drill Buttons
  document.querySelectorAll('.domain-drill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cats = btn.getAttribute('data-categories').split('|');
      const domainQs = state.questions.filter(q => cats.includes(q.category));
      state.filteredQuestions = domainQs;
      state.currentQuestionIndex = 0;
      setView('practice');
    });
  });

  // Mode Cards
  document.getElementById('mode-practice').addEventListener('click', () => {
    applyFilters();
    state.currentQuestionIndex = 0;
    setView('practice');
  });

  document.getElementById('mode-weaknesses').addEventListener('click', () => {
    const missed = state.questions.filter(q => {
      const p = state.practiceProgress[q.id];
      return p && p.attempted && !p.correct;
    });
    if (missed.length === 0) {
      alert('Great job! You have no missed questions yet. Complete some practice questions first!');
      return;
    }
    state.filteredQuestions = missed;
    state.currentQuestionIndex = 0;
    setView('practice');
  });

  document.getElementById('mode-exam').addEventListener('click', () => {
    resetExam();
    state.examSession.questions = [...state.questions].sort(() => 0.5 - Math.random()).slice(0, 50);
    state.examSession.timeRemaining = 120 * 60;
    state.examSession.totalTime = 120 * 60;
    state.examSession.examTitle = 'Full 50-Question Practice Exam';
    setView('exam');
  });

  document.getElementById('mode-flashcard').addEventListener('click', () => {
    applyFilters();
    setView('flashcard');
  });

  // Custom Quiz Modal
  const modal = document.getElementById('custom-quiz-modal');
  document.getElementById('mode-custom-quiz').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  document.getElementById('modal-cancel-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('modal-start-btn').addEventListener('click', () => {
    const countVal = document.getElementById('custom-count').value;
    const topicVal = document.getElementById('custom-topic').value;
    const diffVal = document.getElementById('custom-difficulty').value;
    const timerVal = document.getElementById('custom-timer').value;

    let pool = [...state.questions];
    if (topicVal !== 'all') {
      pool = pool.filter(q => q.category === topicVal);
    }
    if (diffVal !== 'all') {
      pool = pool.filter(q => (q.difficulty || 'Medium') === diffVal);
    }

    if (pool.length === 0) {
      alert('No questions match the selected custom criteria! Please adjust your filters.');
      return;
    }

    pool.sort(() => 0.5 - Math.random());
    const count = countVal === 'all' ? pool.length : Math.min(parseInt(countVal), pool.length);
    const selectedQuestions = pool.slice(0, count);

    resetExam();
    state.examSession.questions = selectedQuestions;

    let secondsPerQ = 144;
    if (timerVal === 'speed') secondsPerQ = 60;
    else if (timerVal === 'none') secondsPerQ = 0;

    state.examSession.timeRemaining = secondsPerQ * count;
    state.examSession.totalTime = secondsPerQ * count;
    state.examSession.examTitle = `Custom Quiz (${count} Questions${diffVal !== 'all' ? ' • ' + diffVal : ''}${topicVal !== 'all' ? ' • ' + topicVal : ''})`;

    modal.style.display = 'none';
    setView('exam');
  });

  // Data Management: Export
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const jsonStr = storage.exportAll();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcp-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Data Management: Import
  const importFileInput = document.getElementById('file-import-input');
  document.getElementById('btn-import-data-trigger').addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = storage.importAll(event.target.result);
      if (res.success) {
        state.bookmarks = storage.loadBookmarks();
        state.practiceProgress = storage.loadPractice();
        state.history = storage.loadHistory();
        alert('Progress successfully imported!');
        renderDashboard();
      } else {
        alert('Failed to import progress: ' + res.error);
      }
    };
    reader.readAsText(file);
  });

  // Data Management: Reset
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to reset all study progress, history, and bookmarks? This action cannot be undone.');
    if (confirmed) {
      storage.clearAll();
      state.bookmarks = [];
      state.practiceProgress = {};
      state.history = [];
      renderDashboard();
    }
  });
}
