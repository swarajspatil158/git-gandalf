/**
 * TICKET 4: Diff Metadata Extraction
 *
 * Extracts structural metadata from raw diff.
 * Pure function, unit-testable.
 * No semantic understanding, no language detection, no risk inference.
 */

/**
 * @typedef {Object} FileChange
 * @property {string} path - File path
 * @property {'add'|'delete'|'modify'|'rename'} type - Type of change
 * @property {number} additions - Lines added
 * @property {number} deletions - Lines deleted
 * @property {boolean} isBinary - Whether file is binary
 * @property {string} [oldPath] - Old path if renamed
 */

/**
 * @typedef {Object} DiffMetadata
 * @property {FileChange[]} files - List of changed files
 * @property {number} totalAdditions - Total lines added
 * @property {number} totalDeletions - Total lines deleted
 * @property {number} fileCount - Number of files changed
 */

/**
 * Extracts metadata from a unified diff
 * @param {string} rawDiff - Raw diff text
 * @returns {DiffMetadata}
 */
export function extractDiffMetadata(rawDiff) {
  const files = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  // Split diff by file headers
  const fileChunks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const chunk of fileChunks) {
    const fileInfo = parseFileChunk(chunk);
    if (fileInfo) {
      files.push(fileInfo);
      totalAdditions += fileInfo.additions;
      totalDeletions += fileInfo.deletions;
    }
  }

  return {
    files,
    totalAdditions,
    totalDeletions,
    fileCount: files.length
  };
}

/**
 * Parses a single file chunk from the diff
 * @param {string} chunk - File diff chunk
 * @returns {FileChange|null}
 */
function parseFileChunk(chunk) {
  const lines = chunk.split('\n');

  // First line contains file paths: a/path b/path
  const headerMatch = lines[0]?.match(/^a\/(.+?) b\/(.+?)$/);
  if (!headerMatch) {
    // Try alternate format
    const altMatch = lines[0]?.match(/^(.+?) (.+?)$/);
    if (!altMatch) return null;
  }

  const oldPath = headerMatch ? headerMatch[1] : lines[0].split(' ')[0];
  const newPath = headerMatch ? headerMatch[2] : lines[0].split(' ')[1];

  // Check for binary file
  if (chunk.includes('Binary files')) {
    return {
      path: newPath || oldPath,
      type: 'modify',
      additions: 0,
      deletions: 0,
      isBinary: true
    };
  }

  // Determine change type
  let type = 'modify';
  if (chunk.includes('new file mode')) {
    type = 'add';
  } else if (chunk.includes('deleted file mode')) {
    type = 'delete';
  } else if (chunk.includes('rename from') || oldPath !== newPath) {
    type = 'rename';
  }

  // Count additions and deletions
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  const result = {
    path: newPath || oldPath,
    type,
    additions,
    deletions,
    isBinary: false
  };

  if (type === 'rename' && oldPath !== newPath) {
    result.oldPath = oldPath;
  }

  return result;
}

/**
 * Format metadata for inclusion in prompt
 * @param {DiffMetadata} metadata
 * @returns {string}
 */
export function formatMetadataForPrompt(metadata) {
  const lines = [
    `Files changed: ${metadata.fileCount}`,
    `Total additions: +${metadata.totalAdditions}`,
    `Total deletions: -${metadata.totalDeletions}`,
    '',
    'Changed files:'
  ];

  for (const file of metadata.files) {
    if (file.isBinary) {
      lines.push(`  [BINARY] ${file.path}`);
    } else {
      const changeIndicator = {
        add: '[NEW]',
        delete: '[DEL]',
        modify: '[MOD]',
        rename: '[REN]'
      }[file.type];

      let fileLine = `  ${changeIndicator} ${file.path} (+${file.additions}/-${file.deletions})`;
      if (file.oldPath) {
        fileLine += ` (from ${file.oldPath})`;
      }
      lines.push(fileLine);
    }
  }

  return lines.join('\n');
}
