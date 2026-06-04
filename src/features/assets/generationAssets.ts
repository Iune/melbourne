import type { ContestParseError } from '../contest/contestTypes';
import { normalizeFlagReference } from '../flags/flagAssets';

/**
 * Represents one optional custom font uploaded for generation.
 */
export interface GenerationFontAsset {
  bytes: ArrayBuffer;
  fileName: string;
}

/**
 * Represents all in-memory custom assets available to one generation job.
 */
export interface GenerationAssets {
  customBaseFont: GenerationFontAsset | null;
  customFlags: Record<string, ArrayBuffer>;
  customPointsFont: GenerationFontAsset | null;
}

/**
 * Represents the uploaded form files used to build generation assets.
 */
export interface UploadedGenerationFiles {
  baseFontFile: File | null;
  customFlagFiles: File[];
  pointsFontFile: File | null;
}

/**
 * Builds the normalized `Custom/...` flag reference for one uploaded file.
 */
function createCustomFlagReference(fileName: string): string | null {
  return normalizeFlagReference(`Custom/${fileName}`);
}

/**
 * Returns blocking validation errors for uploaded custom flag files.
 */
export function validateCustomFlagUploads(
  customFlagFiles: File[],
): ContestParseError[] {
  const errors: ContestParseError[] = [];
  const seenReferences = new Set<string>();

  for (const customFlagFile of customFlagFiles) {
    const normalizedReference = createCustomFlagReference(customFlagFile.name);

    if (normalizedReference === null) {
      errors.push({
        message: `Invalid uploaded custom flag file: ${customFlagFile.name || '(empty)'}`,
      });
      continue;
    }

    if (seenReferences.has(normalizedReference)) {
      errors.push({
        message: `Duplicate uploaded custom flag file: ${normalizedReference}`,
      });
      continue;
    }

    seenReferences.add(normalizedReference);
  }

  return errors;
}

/**
 * Returns the set of normalized `Custom/...` references available for uploads.
 */
export function createCustomFlagReferenceSet(
  customFlagFiles: File[],
): Set<string> {
  const references = new Set<string>();

  for (const customFlagFile of customFlagFiles) {
    const normalizedReference = createCustomFlagReference(customFlagFile.name);

    if (normalizedReference !== null) {
      references.add(normalizedReference);
    }
  }

  return references;
}

/**
 * Loads one optional uploaded font into a generation asset payload.
 */
async function loadFontAsset(
  fontFile: File | null,
): Promise<GenerationFontAsset | null> {
  if (fontFile === null) {
    return null;
  }

  return {
    bytes: await fontFile.arrayBuffer(),
    fileName: fontFile.name,
  };
}

/**
 * Builds the in-memory generation assets payload from uploaded form files.
 */
export async function buildGenerationAssets(
  uploadedFiles: UploadedGenerationFiles,
): Promise<GenerationAssets> {
  const customFlags: Record<string, ArrayBuffer> = {};

  for (const customFlagFile of uploadedFiles.customFlagFiles) {
    const normalizedReference = createCustomFlagReference(customFlagFile.name);

    if (normalizedReference === null) {
      throw new Error(
        `Invalid uploaded custom flag file: ${customFlagFile.name || '(empty)'}`,
      );
    }

    if (normalizedReference in customFlags) {
      throw new Error(
        `Duplicate uploaded custom flag file: ${normalizedReference}`,
      );
    }

    customFlags[normalizedReference] = await customFlagFile.arrayBuffer();
  }

  return {
    customBaseFont: await loadFontAsset(uploadedFiles.baseFontFile),
    customFlags,
    customPointsFont: await loadFontAsset(uploadedFiles.pointsFontFile),
  };
}
