/**
 * TICKET 10: Exit Code Contract
 *
 * Maps policy decisions to exit codes.
 * No retries, no interactivity, no environment flags.
 *
 * Mapping:
 * - ALLOW → process.exit(0)
 * - WARN → process.exit(0)
 * - BLOCK → process.exit(1)
 */

/**
 * Exits the process with appropriate code based on decision
 * @param {'ALLOW'|'WARN'|'BLOCK'} decision - Policy decision
 */
export function exitWithCode(decision) {
  switch (decision) {
    case 'ALLOW':
    case 'WARN':
      process.exit(0);
      break;
    case 'BLOCK':
      process.exit(1);
      break;
    default:
      // Unknown decision - fail closed
      process.exit(1);
  }
}

/**
 * Gets exit code without exiting (for testing)
 * @param {'ALLOW'|'WARN'|'BLOCK'} decision - Policy decision
 * @returns {number}
 */
export function getExitCode(decision) {
  switch (decision) {
    case 'ALLOW':
    case 'WARN':
      return 0;
    case 'BLOCK':
      return 1;
    default:
      return 1;
  }
}
