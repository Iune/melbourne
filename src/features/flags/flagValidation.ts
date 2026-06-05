import {
  createCustomFlagReferenceSet,
  validateCustomFlagUploads,
} from '../assets/generationAssets';
import type { ContestData, ContestParseError } from '../contest/contestTypes';
import { hasBundledFlagAsset, normalizeFlagReference } from './flagAssets';

/**
 * Validates every contest flag reference against the bundled packs and current custom uploads.
 *
 * @param contest The parsed contest data whose entry flag references should be checked before
 * generation begins.
 * @param customFlagFiles The currently selected custom flag upload files, if any, that should be
 * treated as the `Custom/` flag pack for this validation pass.
 * @returns A flat list of blocking validation errors covering duplicate custom uploads, invalid
 * logical flag references, and missing bundled or custom flag assets.
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
