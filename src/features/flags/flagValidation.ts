import type { ContestData, ContestParseError } from '../contest/contestTypes';
import { hasBundledFlagAsset, normalizeFlagReference } from './flagAssets';

/**
 * Returns blocking validation errors for bundled flag references in contest data.
 */
export function validateBundledFlags(
  contest: ContestData,
): ContestParseError[] {
  const errors: ContestParseError[] = [];

  for (const entry of contest.entries) {
    const normalizedReference = normalizeFlagReference(entry.flag);

    if (normalizedReference === null) {
      errors.push({
        message: `Invalid flag reference for ${entry.country}: ${entry.flag || '(empty)'}`,
      });
      continue;
    }

    if (!hasBundledFlagAsset(normalizedReference)) {
      errors.push({
        message: `Missing bundled flag for ${entry.country}: ${normalizedReference}`,
      });
    }
  }

  return errors;
}
