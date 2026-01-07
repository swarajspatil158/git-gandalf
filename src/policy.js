/**
 * TICKET 8: Policy Decision Engine (Hardcoded)
 *
 * The first and only policy for P0.
 * No config, no overrides, no repo awareness.
 */

/**
 * Policy rules:
 * - LOW → ALLOW
 * - MEDIUM → WARN
 * - HIGH → BLOCK
 */

/**
 * Makes a policy decision based on risk level
 * @param {'LOW'|'MEDIUM'|'HIGH'} risk - Risk level from judgment
 * @returns {'ALLOW'|'WARN'|'BLOCK'} - Policy decision
 */
export function makeDecision(risk) {
  switch (risk) {
    case 'LOW':
      return 'ALLOW';
    case 'MEDIUM':
      return 'WARN';
    case 'HIGH':
      return 'BLOCK';
    default:
      // Fail closed on unknown risk
      return 'BLOCK';
  }
}
