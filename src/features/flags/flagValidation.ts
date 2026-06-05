import {
  createCustomFlagReferenceSet,
  validateCustomFlagUploads,
} from '../assets/generationAssets';
import type { ContestData, ContestParseError } from '../contest/contestTypes';
import { hasBundledFlagAsset, normalizeFlagReference } from './flagAssets';

/**
 * Returns blocking validation errors for bundled and uploaded flag references.
 */
export function validateFlagReferences(
  contest: ContestData,
  customFlagFiles: File[] = [],
): ContestParseError[] {
  const errors = validateCustomFlagUploads(customFlagFiles);
  const customFlagReferences = createCustomFlagReferenceSet(customFlagFiles);

  for (const entry of contest.entries) {
    const normalizedReference = normalizeFlagReference(entry.flag);

    if (normalizedReference === null) {
      errors.push({
        message: `Invalid flag reference for ${entry.country}: ${entry.flag || '(empty)'}`,
      });
      continue;
    }

    if (normalizedReference.startsWith('Custom/')) {
      if (!customFlagReferences.has(normalizedReference)) {
        errors.push({
          message: `Missing custom flag for ${entry.country}: ${normalizedReference}`,
        });
      }

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
