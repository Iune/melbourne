import type { ContestParseError } from '../contest/contestTypes';
import { normalizeFlagReference } from '../flags/flagAssets';

/**
 * Represents one uploaded custom font that should be available to a generation run.
 */
export interface GenerationFontAsset {
  bytes: ArrayBuffer;
  fileName: string;
}

/**
 * Represents the complete in-memory asset bundle available to one generation job.
 */
export interface GenerationAssets {
  customBaseFont: GenerationFontAsset | null;
  customFlags: Record<string, ArrayBuffer>;
  customPointsFont: GenerationFontAsset | null;
}

/**
 * Represents the uploaded form files that should be converted into generation assets.
 */
export interface UploadedGenerationFiles {
  baseFontFile: File | null;
  customFlagFiles: File[];
  pointsFontFile: File | null;
}

/**
 * Builds the logical `Custom/...` flag reference for one uploaded custom flag file.
 *
 * @param fileName The original uploaded file name selected in the browser.
 * @returns A normalized `Custom/...` logical flag reference when the file name is safe to use, or
 * `null` when the name would produce an invalid or unsafe reference.
 */
function createCustomFlagReference(fileName: string): string | null {
  return normalizeFlagReference(`Custom/${fileName}`);
}

/**
 * Validates the currently selected custom flag uploads before generation begins.
 *
 * @param customFlagFiles The custom flag files currently selected in the form for the `Custom`
 * flag pack.
 * @returns A list of blocking validation errors covering invalid file names and duplicate logical
 * `Custom/...` references.
 */
export function validateCustomFlagUploads(customFlagFiles: File[]): ContestParseError[] {
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
 * Builds the set of logical `Custom/...` references currently available from uploaded flags.
 *
 * @param customFlagFiles The custom flag files currently selected in the form.
 * @returns A set of normalized `Custom/...` references that can be matched against contest entry
 * flag values.
 */
export function createCustomFlagReferenceSet(customFlagFiles: File[]): Set<string> {
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
 * Loads one optional uploaded font file into the in-memory asset format used by rendering.
 *
 * @param fontFile The uploaded font file selected in the form, or `null` when no custom font was
 * provided for that slot.
 * @returns A `GenerationFontAsset` containing the uploaded file name and raw bytes, or `null` when
 * no custom font was supplied.
 */
async function loadFontAsset(fontFile: File | null): Promise<GenerationFontAsset | null> {
  if (fontFile === null) {
    return null;
  }

  return {
    bytes: await fontFile.arrayBuffer(),
    fileName: fontFile.name,
  };
}

/**
 * Builds the in-memory asset payload used by the worker and renderer for one export run.
 *
 * @param uploadedFiles The current set of uploaded custom font and flag files selected in the UI.
 * @returns A `GenerationAssets` object containing raw font bytes and a map of logical custom flag
 * references to image bytes.
 * @throws When a custom flag file name is invalid or when multiple uploaded files would resolve to
 * the same logical `Custom/...` reference.
 */
export async function buildGenerationAssets(uploadedFiles: UploadedGenerationFiles): Promise<GenerationAssets> {
  const customFlags: Record<string, ArrayBuffer> = {};

  for (const customFlagFile of uploadedFiles.customFlagFiles) {
    const normalizedReference = createCustomFlagReference(customFlagFile.name);

    if (normalizedReference === null) {
      throw new Error(`Invalid uploaded custom flag file: ${customFlagFile.name || '(empty)'}`);
    }

    if (normalizedReference in customFlags) {
      throw new Error(`Duplicate uploaded custom flag file: ${normalizedReference}`);
    }

    customFlags[normalizedReference] = await customFlagFile.arrayBuffer();
  }

  return {
    customBaseFont: await loadFontAsset(uploadedFiles.baseFontFile),
    customFlags,
    customPointsFont: await loadFontAsset(uploadedFiles.pointsFontFile),
  };
}
