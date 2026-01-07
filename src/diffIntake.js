/**
 * TICKET 3: Diff Intake + Guardrails
 *
 * Reads raw diff from STDIN and validates it.
 * This module only knows "string in, string out"
 */

// Maximum diff size in characters (500KB)
const MAX_DIFF_SIZE = 500 * 1024;

/**
 * Reads diff from STDIN
 * @returns {Promise<{success: boolean, diff?: string, error?: string, isEmpty?: boolean}>}
 */
export async function readDiffFromStdin() {
  return new Promise((resolve) => {
    let data = '';
    let timedOut = false;

    // Timeout for reading STDIN (30 seconds)
    const timeout = setTimeout(() => {
      timedOut = true;
      resolve({
        success: false,
        error: 'Timeout reading diff from STDIN'
      });
    }, 30000);

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      if (timedOut) return;
      data += chunk;

      // Check size limit while reading
      if (data.length > MAX_DIFF_SIZE) {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: `Diff exceeds maximum size of ${MAX_DIFF_SIZE} characters`
        });
      }
    });

    process.stdin.on('end', () => {
      if (timedOut) return;
      clearTimeout(timeout);

      // Normalize line endings
      const normalizedDiff = normalizeLineEndings(data);

      // Check for empty diff
      if (!normalizedDiff || normalizedDiff.trim() === '') {
        resolve({
          success: false,
          isEmpty: true,
          error: 'No changes to review'
        });
        return;
      }

      resolve({
        success: true,
        diff: normalizedDiff
      });
    });

    process.stdin.on('error', (err) => {
      if (timedOut) return;
      clearTimeout(timeout);
      resolve({
        success: false,
        error: `Failed to read diff: ${err.message}`
      });
    });

    // Handle case where STDIN is not a pipe
    if (process.stdin.isTTY) {
      clearTimeout(timeout);
      resolve({
        success: false,
        isEmpty: true,
        error: 'No diff provided (STDIN is a terminal)'
      });
    }
  });
}

/**
 * Normalizes line endings to LF
 * @param {string} text
 * @returns {string}
 */
function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
