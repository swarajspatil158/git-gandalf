/**
 * TICKET 9: Terminal Review Renderer
 *
 * Renders a clear, opinionated terminal report.
 * No side effects, no file writes, rendering only.
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

/**
 * @typedef {Object} ReviewOutput
 * @property {'ALLOW'|'WARN'|'BLOCK'} decision
 * @property {string} reason
 * @property {Array<{severity: string, file: string, line: number, message: string}>} issues
 * @property {'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'} risk
 * @property {number} [filesReviewed]
 * @property {boolean} [llmUnavailable]
 */

/**
 * Renders the review to console
 * @param {ReviewOutput} review
 */
export function renderReview(review) {
  const { decision, reason, issues, risk, filesReviewed, llmUnavailable } = review;

  console.log('');
  console.log(renderHeader());
  console.log('');

  // Decision banner
  console.log(renderDecisionBanner(decision));
  console.log('');

  // Summary
  if (reason) {
    console.log(`${colors.bold}Summary:${colors.reset} ${reason}`);
    console.log('');
  }

  // Risk level
  console.log(`${colors.bold}Risk Level:${colors.reset} ${renderRisk(risk)}`);

  if (filesReviewed !== undefined) {
    console.log(`${colors.bold}Files Reviewed:${colors.reset} ${filesReviewed}`);
  }

  if (llmUnavailable) {
    console.log('');
    console.log(`${colors.yellow}⚠ LLM was unavailable. Review skipped.${colors.reset}`);
  }

  // Issues
  if (issues && issues.length > 0) {
    console.log('');
    console.log(`${colors.bold}Issues Found (${issues.length}):${colors.reset}`);
    console.log('');

    for (const issue of issues) {
      renderIssue(issue);
    }
  }

  console.log('');
  console.log(renderFooter(decision));
  console.log('');
}

/**
 * Renders the Gandalf header
 */
function renderHeader() {
  return `${colors.magenta}${colors.bold}` +
    `╔═══════════════════════════════════════════════════════════════╗\n` +
    `║                       🧙 GIT GANDALF 🧙                       ║\n` +
    `║            "You Shall Not Commit" (bad code)                  ║\n` +
    `╚═══════════════════════════════════════════════════════════════╝` +
    `${colors.reset}`;
}

/**
 * Renders decision banner
 */
function renderDecisionBanner(decision) {
  switch (decision) {
    case 'ALLOW':
      return `${colors.bgGreen}${colors.white}${colors.bold}  ✓ COMMIT ALLOWED  ${colors.reset}`;
    case 'WARN':
      return `${colors.bgYellow}${colors.white}${colors.bold}  ⚠ COMMIT ALLOWED (with warnings)  ${colors.reset}`;
    case 'BLOCK':
      return `${colors.bgRed}${colors.white}${colors.bold}  ✗ COMMIT BLOCKED  ${colors.reset}`;
    default:
      return `${colors.bgRed}${colors.white}${colors.bold}  ? UNKNOWN DECISION  ${colors.reset}`;
  }
}

/**
 * Renders risk level with color
 */
function renderRisk(risk) {
  switch (risk) {
    case 'LOW':
      return `${colors.green}LOW${colors.reset}`;
    case 'MEDIUM':
      return `${colors.yellow}MEDIUM${colors.reset}`;
    case 'HIGH':
      return `${colors.red}HIGH${colors.reset}`;
    default:
      return `${colors.dim}UNKNOWN${colors.reset}`;
  }
}

/**
 * Renders a single issue
 */
function renderIssue(issue) {
  const severityColor = {
    low: colors.green,
    medium: colors.yellow,
    high: colors.red
  }[issue.severity] || colors.white;

  const severityIcon = {
    low: '○',
    medium: '◐',
    high: '●'
  }[issue.severity] || '?';

  console.log(`  ${severityColor}${severityIcon} [${issue.severity.toUpperCase()}]${colors.reset} ${colors.cyan}${issue.file}:${issue.line}${colors.reset}`);
  console.log(`    ${issue.message}`);
  console.log('');
}

/**
 * Renders footer with action guidance
 */
function renderFooter(decision) {
  switch (decision) {
    case 'ALLOW':
      return `${colors.dim}Commit will proceed.${colors.reset}`;
    case 'WARN':
      return `${colors.yellow}Commit will proceed. Consider addressing the warnings.${colors.reset}`;
    case 'BLOCK':
      return `${colors.red}${colors.bold}Commit blocked.${colors.reset} Fix the issues above or use ${colors.cyan}git commit --no-verify${colors.reset} to bypass.`;
    default:
      return '';
  }
}
