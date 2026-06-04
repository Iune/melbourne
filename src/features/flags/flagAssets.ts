const BUNDLED_FLAG_ASSET_URLS = import.meta.glob('/src/assets/flags/**/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>;
const FLAG_ASSET_ROOT = '/src/assets/flags/';
const BUNDLED_FLAG_REFERENCE_TO_URL = new Map(
  Object.entries(BUNDLED_FLAG_ASSET_URLS).map(([assetPath, assetUrl]) => {
    return [assetPath.slice(FLAG_ASSET_ROOT.length), assetUrl];
  }),
);

/**
 * Normalizes one bundled flag reference or rejects it when unsafe.
 */
export function normalizeFlagReference(reference: string): string | null {
  const trimmedReference = reference.trim();

  if (
    trimmedReference.length === 0 ||
    trimmedReference.startsWith('/') ||
    trimmedReference.includes('\\')
  ) {
    return null;
  }

  const pathSegments = trimmedReference.split('/');

  if (
    pathSegments.some((segment) => {
      return segment.length === 0 || segment === '.' || segment === '..';
    })
  ) {
    return null;
  }

  return pathSegments.join('/');
}

/**
 * Returns true when a normalized flag reference exists in bundled assets.
 */
export function hasBundledFlagAsset(normalizedReference: string): boolean {
  return BUNDLED_FLAG_REFERENCE_TO_URL.has(normalizedReference);
}

/**
 * Returns the browser asset URL for one normalized bundled flag reference.
 */
export function getBundledFlagAssetUrl(
  normalizedReference: string,
): string | null {
  return BUNDLED_FLAG_REFERENCE_TO_URL.get(normalizedReference) ?? null;
}
