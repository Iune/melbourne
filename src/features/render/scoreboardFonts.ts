import baseFontUrl from '../../assets/fonts/ZillaSlab-Regular.otf?url';
import pointsFontUrl from '../../assets/fonts/FiraSans-Regular.otf?url';
import type {
  GenerationAssets,
  GenerationFontAsset,
} from '../assets/generationAssets';

const DEFAULT_BASE_FONT_FAMILY = 'Zilla Slab';
const DEFAULT_POINTS_FONT_FAMILY = 'Fira Sans';
const CUSTOM_BASE_FONT_FAMILY = 'Melbourne Custom Base Font';
const CUSTOM_POINTS_FONT_FAMILY = 'Melbourne Custom Points Font';

/**
 * Represents the resolved font families and bytes used during one render.
 */
export interface ResolvedRenderFonts {
  baseFontBytes: ArrayBuffer;
  baseFontFamily: string;
  pointsFontBytes: ArrayBuffer;
  pointsFontFamily: string;
}

let cachedBaseFontBytes: Promise<ArrayBuffer> | null = null;
let cachedPointsFontBytes: Promise<ArrayBuffer> | null = null;

/**
 * Loads bundled font bytes once and reuses them across renders.
 */
async function loadFontBytes(
  fontUrl: string,
  fileName: string,
): Promise<ArrayBuffer> {
  const response = await fetch(fontUrl);

  if (!response.ok) {
    throw new Error(`Unable to load bundled font data for ${fileName}.`);
  }

  return response.arrayBuffer();
}

/**
 * Loads the bundled base font bytes once for reuse across renders.
 */
async function loadBaseFontBytes(): Promise<ArrayBuffer> {
  if (cachedBaseFontBytes === null) {
    cachedBaseFontBytes = loadFontBytes(baseFontUrl, 'ZillaSlab-Regular.otf');
  }

  return cachedBaseFontBytes;
}

/**
 * Loads the bundled points font bytes once for reuse across renders.
 */
async function loadPointsFontBytes(): Promise<ArrayBuffer> {
  if (cachedPointsFontBytes === null) {
    cachedPointsFontBytes = loadFontBytes(
      pointsFontUrl,
      'FiraSans-Regular.otf',
    );
  }

  return cachedPointsFontBytes;
}

/**
 * Returns the correct font family name and bytes for one optional custom font.
 */
function resolveFontAsset(
  customFont: GenerationFontAsset | null,
  customFamilyName: string,
  fallbackFamilyName: string,
  fallbackBytes: ArrayBuffer,
): { bytes: ArrayBuffer; familyName: string } {
  if (customFont === null) {
    return {
      bytes: fallbackBytes,
      familyName: fallbackFamilyName,
    };
  }

  return {
    bytes: customFont.bytes,
    familyName: customFamilyName,
  };
}

/**
 * Resolves bundled or custom font assets for one render.
 */
export async function resolveRenderFonts(
  generationAssets: GenerationAssets,
): Promise<ResolvedRenderFonts> {
  const [defaultBaseFontBytes, defaultPointsFontBytes] = await Promise.all([
    loadBaseFontBytes(),
    loadPointsFontBytes(),
  ]);
  const baseFont = resolveFontAsset(
    generationAssets.customBaseFont,
    CUSTOM_BASE_FONT_FAMILY,
    DEFAULT_BASE_FONT_FAMILY,
    defaultBaseFontBytes,
  );
  const pointsFont = resolveFontAsset(
    generationAssets.customPointsFont,
    CUSTOM_POINTS_FONT_FAMILY,
    DEFAULT_POINTS_FONT_FAMILY,
    defaultPointsFontBytes,
  );

  return {
    baseFontBytes: baseFont.bytes,
    baseFontFamily: baseFont.familyName,
    pointsFontBytes: pointsFont.bytes,
    pointsFontFamily: pointsFont.familyName,
  };
}
