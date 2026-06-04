import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit.js';
import canvasKitWasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url';

const BACKGROUND_COLOR = Float32Array.of(1, 1, 1, 1);
const FOREGROUND_COLOR = Float32Array.of(0, 0, 0, 1);
const FONT_FAMILY = 'Fira Sans';
const FONT_SIZE = 32;
const HELLO_WORLD_TEXT = 'Hello world';
const IMAGE_PADDING = 20;
const PARAGRAPH_LAYOUT_WIDTH = 1024;
const bundledFontUrl = new URL(
  '../../../assets/fonts/FiraSans-Regular.otf',
  import.meta.url,
);
const isNodeRuntime =
  typeof process !== 'undefined' && process.versions.node !== undefined;
type CanvasKitModule = Awaited<ReturnType<typeof CanvasKitInit>>;

let cachedCanvasKit: Promise<CanvasKitModule> | null = null;
let cachedFontBytes: Promise<ArrayBuffer> | null = null;

/**
 * Loads the CanvasKit runtime once for reuse across renders.
 */
async function loadCanvasKit(): Promise<CanvasKitModule> {
  if (cachedCanvasKit === null) {
    cachedCanvasKit = CanvasKitInit({
      locateFile: () => {
        return isNodeRuntime
          ? `${process.cwd()}/node_modules/canvaskit-wasm/bin/full/canvaskit.wasm`
          : canvasKitWasmUrl;
      },
    });
  }

  return cachedCanvasKit;
}

/**
 * Loads the bundled Fira Sans font bytes once for reuse across renders.
 */
async function loadBundledFontBytes(): Promise<ArrayBuffer> {
  if (cachedFontBytes === null) {
    cachedFontBytes = (async () => {
      if (isNodeRuntime) {
        const { readFile } = await import('node:fs/promises');
        const fileBuffer = await readFile(
          `${process.cwd()}/assets/fonts/FiraSans-Regular.otf`,
        );

        return fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength,
        );
      }

      const response = await fetch(bundledFontUrl);

      if (!response.ok) {
        throw new Error('Unable to load bundled font data.');
      }

      return response.arrayBuffer();
    })();
  }

  return cachedFontBytes;
}

/**
 * Renders a centered Hello world PNG using the bundled font and CanvasKit.
 */
export async function renderHelloWorldPng(): Promise<Uint8Array> {
  const [CanvasKit, fontBytes] = await Promise.all([
    loadCanvasKit(),
    loadBundledFontBytes(),
  ]);
  const fontProvider = CanvasKit.TypefaceFontProvider.Make();

  fontProvider.registerFont(fontBytes, FONT_FAMILY);

  const paragraphStyle = new CanvasKit.ParagraphStyle({
    disableHinting: false,
    textStyle: {
      color: FOREGROUND_COLOR,
      fontFamilies: [FONT_FAMILY],
      fontSize: FONT_SIZE,
    },
  });
  const paragraphBuilder = CanvasKit.ParagraphBuilder.MakeFromFontProvider(
    paragraphStyle,
    fontProvider,
  );

  paragraphBuilder.addText(HELLO_WORLD_TEXT);

  const paragraph = paragraphBuilder.build();

  paragraph.layout(PARAGRAPH_LAYOUT_WIDTH);

  const textWidth = Math.ceil(paragraph.getLongestLine());
  const textHeight = Math.ceil(paragraph.getHeight());
  const imageWidth = textWidth + IMAGE_PADDING * 2;
  const imageHeight = textHeight + IMAGE_PADDING * 2;
  const paragraphX = (imageWidth - textWidth) / 2;
  const paragraphY = (imageHeight - textHeight) / 2;
  const surface = CanvasKit.MakeSurface(imageWidth, imageHeight);

  if (surface === null) {
    throw new Error('Unable to create CanvasKit surface.');
  }

  const canvas = surface.getCanvas();

  canvas.clear(BACKGROUND_COLOR);
  canvas.drawParagraph(paragraph, paragraphX, paragraphY);

  const image = surface.makeImageSnapshot();
  const encodedBytes = image.encodeToBytes();

  if (encodedBytes === null) {
    throw new Error('Unable to encode PNG image.');
  }

  image.delete();
  paragraph.delete();
  paragraphBuilder.delete();
  fontProvider.delete();
  surface.delete();

  return encodedBytes;
}
