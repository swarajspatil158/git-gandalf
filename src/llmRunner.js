/**
 * TICKET 5: Local LLM Runner
 *
 * Node wrapper around local LLM.
 * This module is infrastructure-only: no prompt logic, no parsing, no business rules.
 */

// Default timeout: 60 seconds
const DEFAULT_TIMEOUT = 60000;

// LM Studio default endpoint
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions';

/**
 * @typedef {Object} LLMResult
 * @property {boolean} success - Whether the call succeeded
 * @property {string} [output] - Raw LLM output
 * @property {string} [error] - Error message if failed
 * @property {boolean} [isTimeout] - Whether failure was due to timeout
 */

/**
 * Runs prompt through local LLM
 * @param {string} prompt - The prompt to send
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<LLMResult>}
 */
export async function runLLM(prompt, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'qwen/qwen3-4b-2507',
        messages: [
          {
            role: 'system',
            content: 'You are Git Gandalf, a senior engineer code reviewer. You analyze code changes and provide structured feedback in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: -1,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `LLM request failed with status ${response.status}`
      };
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;

    if (!output) {
      return {
        success: false,
        error: 'LLM returned empty response'
      };
    }

    return {
      success: true,
      output: output.trim()
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `LLM request timed out after ${timeout}ms`,
        isTimeout: true
      };
    }

    // Check for connection errors (LLM not running)
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Could not connect to LLM server. Is LM Studio running?'
      };
    }

    return {
      success: false,
      error: `LLM error: ${error.message}`
    };
  }
}

/**
 * Check if LLM server is available
 * @returns {Promise<boolean>}
 */
export async function isLLMAvailable() {
  try {
    const response = await fetch(LM_STUDIO_URL.replace('/chat/completions', '/models'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
