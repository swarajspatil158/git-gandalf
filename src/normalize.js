/**
 * TICKET 7: Judgment Normalization Layer
 *
 * Converts raw LLM output into trusted internal state.
 * No heuristics, no policy, deterministic mapping only.
 */

/**
 * @typedef {Object} Issue
 * @property {'low'|'medium'|'high'} severity
 * @property {string} file
 * @property {number} line
 * @property {string} message
 */

/**
 * @typedef {Object} Judgment
 * @property {'LOW'|'MEDIUM'|'HIGH'} risk
 * @property {string} summary
 * @property {Issue[]} issues
 */

/**
 * @typedef {Object} NormalizeResult
 * @property {boolean} success
 * @property {Judgment} [judgment]
 * @property {string} [error]
 */

const VALID_RISKS = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_SEVERITIES = ['low', 'medium', 'high'];

/**
 * Normalizes raw LLM JSON output into validated judgment
 * @param {string} rawOutput - Raw LLM output string
 * @returns {NormalizeResult}
 */
export function normalizeJudgment(rawOutput) {
  // Try to extract JSON from the output (handle potential markdown wrapping)
  let jsonStr = rawOutput.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${e.message}`
    };
  }

  // Validate required fields
  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      error: 'Response is not an object'
    };
  }

  // Validate risk
  if (!parsed.risk || !VALID_RISKS.includes(parsed.risk)) {
    return {
      success: false,
      error: `Invalid or missing risk field. Must be one of: ${VALID_RISKS.join(', ')}`
    };
  }

  // Validate summary
  if (typeof parsed.summary !== 'string') {
    return {
      success: false,
      error: 'Missing or invalid summary field'
    };
  }

  // Validate issues array
  if (!Array.isArray(parsed.issues)) {
    return {
      success: false,
      error: 'Missing or invalid issues array'
    };
  }

  // Validate each issue
  const validatedIssues = [];
  for (let i = 0; i < parsed.issues.length; i++) {
    const issue = parsed.issues[i];
    const validation = validateIssue(issue, i);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    validatedIssues.push({
      severity: issue.severity.toLowerCase(),
      file: String(issue.file),
      line: Number(issue.line),
      message: String(issue.message)
    });
  }

  return {
    success: true,
    judgment: {
      risk: parsed.risk,
      summary: parsed.summary,
      issues: validatedIssues
    }
  };
}

/**
 * Validates a single issue object
 * @param {any} issue - Issue to validate
 * @param {number} index - Index in array for error messages
 * @returns {{valid: boolean, error?: string}}
 */
function validateIssue(issue, index) {
  if (!issue || typeof issue !== 'object') {
    return { valid: false, error: `Issue ${index} is not an object` };
  }

  if (!issue.severity || !VALID_SEVERITIES.includes(issue.severity.toLowerCase())) {
    return {
      valid: false,
      error: `Issue ${index} has invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`
    };
  }

  if (typeof issue.file !== 'string' || !issue.file) {
    return { valid: false, error: `Issue ${index} is missing file path` };
  }

  if (typeof issue.line !== 'number' || isNaN(issue.line)) {
    return { valid: false, error: `Issue ${index} has invalid line number` };
  }

  if (typeof issue.message !== 'string' || !issue.message) {
    return { valid: false, error: `Issue ${index} is missing message` };
  }

  return { valid: true };
}
