/**
 * Timing utilities for E2E tests
 */

export const ONE_SECOND_MS = 1000
export const FIVE_SECONDS_MS = 5000
export const TEN_SECONDS_MS = 10000

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
