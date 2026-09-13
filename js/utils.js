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
