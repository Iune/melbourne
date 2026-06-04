import type { ContestData, ContestParseError } from '../contest/contestTypes';

const BUNDLED_FLAG_ASSET_PATHS = Object.keys(
  import.meta.glob('/assets/flags/**/*', { eager: false }),
);
const FLAG_ASSET_ROOT = '/assets/flags/';
const BUNDLED_FLAG_REFERENCE_SET = new Set(
  BUNDLED_FLAG_ASSET_PATHS.map((assetPath) => {
    return assetPath.slice(FLAG_ASSET_ROOT.length);
  }),
);

/**
 * Represents the normalized or rejected result of secure flag reference parsing.
 */
type FlagReferenceValidationResult =
  | { normalizedReference: string; ok: true }
  | { ok: false };

/**
 * Validates and normalizes one contest flag reference for safe bundled lookup.
 */
function validateFlagReference(
  reference: string,
): FlagReferenceValidationResult {
  const trimmedReference = reference.trim();

  if (
    trimmedReference.length === 0 ||
    trimmedReference.startsWith('/') ||
    trimmedReference.includes('\\')
  ) {
    return { ok: false };
  }

  const pathSegments = trimmedReference.split('/');

  if (
    pathSegments.some((segment) => {
      return segment.length === 0 || segment === '.' || segment === '..';
    })
  ) {
    return { ok: false };
  }

  return {
    normalizedReference: pathSegments.join('/'),
    ok: true,
  };
}

/**
 * Returns blocking validation errors for bundled flag references in contest data.
 */
export function validateBundledFlags(
  contest: ContestData,
): ContestParseError[] {
  const errors: ContestParseError[] = [];

  for (const entry of contest.entries) {
    const validationResult = validateFlagReference(entry.flag);

    if (!validationResult.ok) {
      errors.push({
        message: `Invalid flag reference for ${entry.country}: ${entry.flag || '(empty)'}`,
      });
      continue;
    }

    if (!BUNDLED_FLAG_REFERENCE_SET.has(validationResult.normalizedReference)) {
      errors.push({
        message: `Missing bundled flag for ${entry.country}: ${validationResult.normalizedReference}`,
      });
    }
  }

  return errors;
}
