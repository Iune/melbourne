import {
  BUNDLED_FLAG_METADATA,
  type BundledFlagMetadataEntry,
} from './bundledFlagMetadata';

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
 * Represents one bundled flag asset entry shown in the flags view.
 */
export interface BundledFlagAssetEntry {
  details: string;
  fileName: string;
  packName: string;
  reference: string;
}

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

/**
 * Returns bundled flag assets grouped by pack and sorted alphabetically.
 */
export function getBundledFlagAssetEntriesByPack(): Map<
  string,
  BundledFlagAssetEntry[]
> {
  return new Map(
    Object.entries(BUNDLED_FLAG_METADATA)
      .sort(([leftPackName], [rightPackName]) => {
        return leftPackName.localeCompare(rightPackName);
      })
      .map(([packName, entries]) => {
        return [
          packName,
          [...entries]
            .sort((leftEntry, rightEntry) => {
              return leftEntry.fileName.localeCompare(rightEntry.fileName);
            })
            .map((entry: BundledFlagMetadataEntry) => {
              return {
                details: entry.details,
                fileName: entry.fileName,
                packName,
                reference: `${packName}/${entry.fileName}`,
              };
            }),
        ];
      }),
  );
}

/**
 * Returns the normalized set of bundled flag references discovered from assets.
 */
export function getBundledFlagAssetReferences(): Set<string> {
  return new Set(BUNDLED_FLAG_REFERENCE_TO_URL.keys());
}

/**
 * Returns the normalized set of bundled flag references declared in metadata.
 */
export function getBundledFlagMetadataReferences(): Set<string> {
  return new Set(
    Object.entries(BUNDLED_FLAG_METADATA).flatMap(([packName, entries]) => {
      return entries.map((entry) => `${packName}/${entry.fileName}`);
    }),
  );
}
