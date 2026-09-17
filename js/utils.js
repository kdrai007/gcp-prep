import { state } from './state.js';
import { storage } from './storage.js';

/**
 * Utility functions for GCP ACE Practice Hub
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight search query matches in text
 */
export function highlightText(text, searchQuery) {
  if (!text) return '';
  const escapedText = escapeHtml(text);
  if (!searchQuery || searchQuery.trim() === '') return escapedText;

  const terms = searchQuery.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return escapedText;

  const pattern = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi');
  return escapedText.replace(pattern, '<mark class="search-highlight">$1</mark>');
}

/**
 * Format markdown backticks `code` or CLI commands into styled inline code elements
 */
export function formatCode(text) {
  if (!text) return '';
  
  // First escape basic HTML
  let formatted = escapeHtml(text);
  
  // Replace `code` backticks with <code class="inline-code">...</code>
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Match commands like 'gcloud ...' or 'gsutil ...' or 'bq ...' or 'kubectl ...' wrapped in quotes or standalone
  formatted = formatted.replace(
    /(['"])(gcloud\s+[^'"]+|gsutil\s+[^'"]+|bq\s+[^'"]+|kubectl\s+[^'"]+)(['"])/g,
    '$1<code class="inline-code">$2</code>$3'
  );

  return formatted;
}

/**
 * Render a styled difficulty badge
 */
export function renderDifficultyBadge(difficulty) {
  const diff = difficulty || 'Medium';
  let badgeClass = 'badge-medium';
  let icon = '🟡';
  
  if (diff === 'Easy') {
    badgeClass = 'badge-easy';
    icon = '🟢';
  } else if (diff === 'Hard') {
    badgeClass = 'badge-hard';
    icon = '🔴';
  }
  
  return `<span class="badge ${badgeClass}">${icon} ${escapeHtml(diff)}</span>`;
}

/**
 * Render a category badge
 */
export function renderCategoryBadge(category) {
  const cat = category || 'General';
  return `<span class="badge badge-category">📁 ${escapeHtml(cat)}</span>`;
}

/**
 * Render both Category & Difficulty badges together
 */
export function renderBadges(category, difficulty) {
  return `
    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
      ${renderCategoryBadge(category)}
      ${renderDifficultyBadge(difficulty)}
    </div>
  `;
}

/**
 * Get current date formatted as YYYY-MM-DD
 */
export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in days from today to a given YYYY-MM-DD string
 */
export function getDaysDifference(targetDateString) {
  if (!targetDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = targetDateString.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return null;
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate active consecutive streak
 */
export function calculateCurrentStreak(streakData) {
  if (!streakData || !streakData.lastDate || !streakData.count) {
    return 0;
  }
  const daysDiff = getDaysDifference(streakData.lastDate);
  // If last active was today (0) or yesterday (-1), streak is valid
  if (daysDiff === 0 || daysDiff === -1) {
    return streakData.count;
  }
  return 0;
}

/**
 * Format countdown text and color for target exam date
 */
export function formatExamCountdown(dateString) {
  if (!dateString) {
    return { text: 'Set Exam Date', count: null, isSet: false, color: 'var(--color-gcp-green)' };
  }
  const days = getDaysDifference(dateString);
  if (days === null) {
    return { text: 'Set Exam Date', count: null, isSet: false, color: 'var(--color-gcp-green)' };
  }
  if (days > 1) {
    const color = days <= 7 ? 'var(--color-gcp-red)' : (days <= 21 ? 'var(--color-gcp-yellow)' : 'var(--color-gcp-green)');
    return { text: `${days}d to Exam`, count: days, isSet: true, color };
  } else if (days === 1) {
    return { text: 'Tomorrow! 🎯', count: 1, isSet: true, color: 'var(--color-gcp-red)' };
  } else if (days === 0) {
    return { text: 'Exam Today! 🎯', count: 0, isSet: true, color: 'var(--color-gcp-red)' };
  } else {
    return { text: `Exam Passed (${Math.abs(days)}d ago)`, count: days, isSet: true, color: 'var(--color-text-muted)' };
  }
}

/**
 * Update the DOM header telemetry indicators (streak & countdown)
 */
export function updateHeaderTelemetry() {
  const streakData = state.streak || storage.loadStreak();
  const currentStreak = calculateCurrentStreak(streakData);

  const streakElem = document.getElementById('header-streak-val');
  if (streakElem) {
    streakElem.textContent = `${currentStreak}d Streak`;
  }

  const examDate = state.examDate || storage.loadExamDate();
  const countdown = formatExamCountdown(examDate);
  const examElem = document.getElementById('header-exam-val');
  const examChip = document.getElementById('header-exam-chip');
  if (examElem) {
    examElem.textContent = countdown.text;
  }
  if (examChip) {
    examChip.style.color = countdown.color;
  }
}

/**
 * Record a study session/answer activity to advance or maintain streak
 */
export function recordStudyActivity() {
  const today = getTodayString();
  const streakData = storage.loadStreak();
  let count = streakData.count || 0;
  const lastDate = streakData.lastDate;

  if (lastDate === today) {
    // Already recorded today, keep current count
    state.streak = streakData;
    updateHeaderTelemetry();
    return count;
  }

  const daysDiff = getDaysDifference(lastDate);
  if (daysDiff === -1) {
    // Consecutive day activity!
    count += 1;
  } else {
    // Fresh start or broken streak
    count = 1;
  }

  const newStreak = { count, lastDate: today };
  storage.saveStreak(newStreak);
  state.streak = newStreak;
  updateHeaderTelemetry();
  return count;
}


