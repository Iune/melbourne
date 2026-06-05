import baseFontUrl from '../../assets/fonts/ZillaSlab-Regular.otf?url';
import pointsFontUrl from '../../assets/fonts/FiraSans-Regular.otf?url';
import type { GenerationAssets, GenerationFontAsset } from '../assets/generationAssets';

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
 * Fetches the bytes for a bundled font file and returns them as an `ArrayBuffer`.
 *
 * @param fontUrl The resolved Vite asset URL for the bundled font file that should be fetched.
 * @param fileName The human-readable file name used when constructing error messages if the font
 * cannot be loaded.
 * @returns The raw bytes for the bundled font file.
 */
async function loadFontBytes(fontUrl: string, fileName: string): Promise<ArrayBuffer> {
  const response = await fetch(fontUrl);

  if (!response.ok) {
    throw new Error(`Unable to load bundled font data for ${fileName}.`);
  }

  return response.arrayBuffer();
}

/**
 * Lazily loads and caches the default base font bytes used for scoreboard body text.
 *
 * @returns The raw bytes for the bundled base font asset.
 */
async function loadBaseFontBytes(): Promise<ArrayBuffer> {
  if (cachedBaseFontBytes === null) {
    cachedBaseFontBytes = loadFontBytes(baseFontUrl, 'ZillaSlab-Regular.otf');
  }

  return cachedBaseFontBytes;
}

/**
 * Lazily loads and caches the default points font bytes used for scoreboard point totals.
 *
 * @returns The raw bytes for the bundled points font asset.
 */
async function loadPointsFontBytes(): Promise<ArrayBuffer> {
  if (cachedPointsFontBytes === null) {
    cachedPointsFontBytes = loadFontBytes(pointsFontUrl, 'FiraSans-Regular.otf');
  }

  return cachedPointsFontBytes;
}

/**
 * Resolves one font choice, preferring a custom upload when one is available.
 *
 * @param customFont The optional custom font uploaded by the user for the current generation run.
 * When this is `null`, the bundled fallback font is used instead.
 * @param customFamilyName The internal family name that should be registered with CanvasKit when a
 * custom font is supplied.
 * @param fallbackFamilyName The bundled family name that should be used when no custom font is
 * provided.
 * @param fallbackBytes The bundled font bytes that should be returned when no custom font is
 * provided.
 * @returns The font bytes and family name that should be registered for rendering.
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
 * Resolves the base and points fonts that should be registered for a single render pass.
 *
 * @param generationAssets The in-memory asset bundle for the current export run, including any
 * user-uploaded custom fonts.
 * @returns The font family names and raw bytes that should be registered with CanvasKit before the
 * scoreboard is drawn.
 */
export async function resolveRenderFonts(generationAssets: GenerationAssets): Promise<ResolvedRenderFonts> {
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
