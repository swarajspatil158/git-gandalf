/**
 * TICKET 6: LLM-as-Judge Prompt
 *
 * Defines Git Gandalf's judging contract.
 * Prompt changes are breaking changes.
 */

import { formatMetadataForPrompt } from './diffMetadata.js';

/**
 * Builds the review prompt for the LLM
 * @param {string} rawDiff - The raw diff text
 * @param {import('./diffMetadata.js').DiffMetadata} metadata - Extracted metadata
 * @param {string} version - Prompt version
 * @returns {string}
 */
export function buildPrompt(rawDiff, metadata, version) {
  const metadataText = formatMetadataForPrompt(metadata);

  return `# Git Gandalf Code Review - Prompt v${version}

You are a senior engineer performing a code review on a git commit. Your job is to identify potential issues, security vulnerabilities, bugs, and code quality problems.

## Review Guidelines

1. Focus on:
   - Security vulnerabilities (SQL injection, XSS, command injection, etc.)
   - Obvious bugs and logic errors
   - Missing error handling for critical operations
   - Hardcoded secrets or credentials
   - Breaking changes without migration path

2. Do NOT flag:
   - Style preferences
   - Minor optimizations
   - Missing tests (unless critical path)
   - Documentation gaps

3. Risk Assessment:
   - LOW: Minor issues or no issues found. Safe to commit.
   - MEDIUM: Potential issues that warrant attention but aren't blocking.
   - HIGH: Critical issues that should block the commit.

## Diff Metadata

${metadataText}

## Raw Diff

\`\`\`diff
${rawDiff}
\`\`\`

## Required Output Format

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact schema:

{
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "summary": "One sentence summary of the review",
  "issues": [
    {
      "severity": "low" | "medium" | "high",
      "file": "path/to/file",
      "line": 42,
      "message": "Description of the issue"
    }
  ]
}

Rules:
- "risk" is REQUIRED and must be exactly "LOW", "MEDIUM", or "HIGH"
- "summary" is REQUIRED and must be a string
- "issues" is REQUIRED and must be an array (can be empty)
- Each issue must have: severity, file, line (number), message
- Do not include any text outside the JSON object

Respond with your JSON review now:`;
}
