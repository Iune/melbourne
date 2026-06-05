import { BUNDLED_FLAG_METADATA, type BundledFlagMetadataEntry } from './bundledFlagMetadata';

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
 * Represents one bundled flag entry exposed to the UI for the bundled-flags view.
 */
export interface BundledFlagAssetEntry {
  details: string;
  fileName: string;
  packName: string;
  reference: string;
}

/**
 * Normalizes a logical flag reference and rejects unsafe path-like input.
 *
 * @param reference The raw flag reference supplied by contest data or user input, such as
 * `ISC/Kaledonii.png` or `Custom/A.png`.
 * @returns A normalized forward-slash reference when the input is safe to treat as a logical flag
 * identifier, or `null` when the input is empty, absolute, uses backslashes, or includes `.`/`..`
 * path traversal segments.
 */
export function normalizeFlagReference(reference: string): string | null {
  const trimmedReference = reference.trim();

  if (trimmedReference.length === 0 || trimmedReference.startsWith('/') || trimmedReference.includes('\\')) {
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
 * Checks whether a normalized flag reference exists in the bundled asset map.
 *
 * @param normalizedReference A previously normalized logical flag reference, such as
 * `World/is.png`.
 * @returns `true` when the reference resolves to a bundled flag asset included in the app build.
 */
export function hasBundledFlagAsset(normalizedReference: string): boolean {
  return BUNDLED_FLAG_REFERENCE_TO_URL.has(normalizedReference);
}

/**
 * Looks up the browser URL for a bundled flag asset.
 *
 * @param normalizedReference A previously normalized logical flag reference, such as
 * `Rect/fr.png`.
 * @returns The Vite-resolved browser URL for the bundled flag asset, or `null` when the reference
 * does not exist in the bundled asset map.
 */
export function getBundledFlagAssetUrl(normalizedReference: string): string | null {
  return BUNDLED_FLAG_REFERENCE_TO_URL.get(normalizedReference) ?? null;
}

/**
 * Builds the bundled-flag listing shown in the Flags view.
 *
 * @returns A map keyed by pack name whose values are alphabetically sorted flag entries containing
 * the file name, display details, and full logical reference for each bundled flag.
 */
export function getBundledFlagAssetEntriesByPack(): Map<string, BundledFlagAssetEntry[]> {
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
 * Returns the set of bundled flag references discovered from the actual asset files.
 *
 * @returns A set of normalized logical references derived from the bundled flag files included in
 * the app build.
 */
export function getBundledFlagAssetReferences(): Set<string> {
  return new Set(BUNDLED_FLAG_REFERENCE_TO_URL.keys());
}

/**
 * Returns the set of bundled flag references declared in the manually maintained metadata list.
 *
 * @returns A set of normalized logical references derived from the flag metadata definitions used
 * by the Flags view.
 */
export function getBundledFlagMetadataReferences(): Set<string> {
  return new Set(
    Object.entries(BUNDLED_FLAG_METADATA).flatMap(([packName, entries]) => {
      return entries.map((entry) => `${packName}/${entry.fileName}`);
    }),
  );
}
