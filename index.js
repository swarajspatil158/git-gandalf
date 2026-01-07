#!/usr/bin/env node

/**
 * Git Gandalf - Local LLM-Powered Pre-Commit Code Reviewer
 * "You Shall Not Commit" (unless the code is good)
 *
 * Entry point that reads diff from STDIN and produces review output
 */

import { readDiffFromStdin } from './src/diffIntake.js';
import { extractDiffMetadata } from './src/diffMetadata.js';
import { runLLM } from './src/llmRunner.js';
import { buildPrompt } from './src/prompt.js';
import { normalizeJudgment } from './src/normalize.js';
import { makeDecision } from './src/policy.js';
import { renderReview } from './src/renderer.js';
import { exitWithCode } from './src/exitCode.js';

const PROMPT_VERSION = '1.0.0';

async function main() {
  try {
    // TICKET 3: Read diff from STDIN
    const diffResult = await readDiffFromStdin();

    if (!diffResult.success) {
      renderReview({
        decision: diffResult.isEmpty ? 'ALLOW' : 'BLOCK',
        reason: diffResult.error,
        issues: [],
        risk: diffResult.isEmpty ? 'LOW' : 'HIGH'
      });
      exitWithCode(diffResult.isEmpty ? 'ALLOW' : 'BLOCK');
      return;
    }

    const rawDiff = diffResult.diff;

    // TICKET 4: Extract metadata from diff
    const metadata = extractDiffMetadata(rawDiff);

    // TICKET 6: Build the prompt
    const prompt = buildPrompt(rawDiff, metadata, PROMPT_VERSION);

    // TICKET 5: Run local LLM
    const llmResult = await runLLM(prompt);

    if (!llmResult.success) {
      // TICKET 11: Handle LLM failures
      renderReview({
        decision: llmResult.isTimeout ? 'WARN' : 'WARN',
        reason: llmResult.error,
        issues: [],
        risk: 'UNKNOWN',
        llmUnavailable: true
      });
      exitWithCode('WARN');
      return;
    }

    // TICKET 7: Normalize LLM output
    const normalizedResult = normalizeJudgment(llmResult.output);

    if (!normalizedResult.success) {
      // TICKET 11: Malformed LLM output → BLOCK
      renderReview({
        decision: 'BLOCK',
        reason: `Malformed LLM response: ${normalizedResult.error}`,
        issues: [],
        risk: 'HIGH'
      });
      exitWithCode('BLOCK');
      return;
    }

    const judgment = normalizedResult.judgment;

    // TICKET 8: Apply policy
    const decision = makeDecision(judgment.risk);

    // TICKET 9: Render output
    renderReview({
      decision,
      reason: judgment.summary,
      issues: judgment.issues,
      risk: judgment.risk,
      filesReviewed: metadata.files.length
    });

    // TICKET 10: Exit with appropriate code
    exitWithCode(decision);

  } catch (error) {
    // TICKET 11: Internal exception → BLOCK
    renderReview({
      decision: 'BLOCK',
      reason: `Internal error: ${error.message}`,
      issues: [],
      risk: 'HIGH'
    });
    exitWithCode('BLOCK');
  }
}

main();
