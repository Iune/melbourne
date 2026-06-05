import type { Canvas, TypefaceFontProvider } from 'canvaskit-wasm';

import type { GenerationAssets } from '../assets/generationAssets';
import { drawFlag } from './scoreboardFlags';
import {
  drawFilledRectangle,
  drawLine,
  drawStrokedRectangle,
  drawText,
  type CanvasKitModule,
} from './scoreboardUtilities';

/**
 * Wraps the canvas-bound drawing helpers needed for rendering one scoreboard.
 */
export class ScoreboardPainter {
  /**
   * Creates a painter bound to one scoreboard render surface and asset set.
   *
   * @param CanvasKit The initialized CanvasKit module that provides paint, text, and image APIs.
   * @param canvas The destination canvas belonging to the scoreboard surface being rendered.
   * @param fontProvider The font provider containing the font families registered for the current
   * render.
   * @param generationAssets The in-memory asset bundle for the current export run, including any
   * uploaded flags or fonts that downstream helpers may need.
   */
  constructor(
    private readonly CanvasKit: CanvasKitModule,
    private readonly canvas: Canvas,
    private readonly fontProvider: TypefaceFontProvider,
    private readonly generationAssets: GenerationAssets,
  ) {}

  /**
   * Draws a filled rectangle on the current scoreboard canvas.
   *
   * @param x The rectangle's left edge in scoreboard pixels.
   * @param y The rectangle's top edge in scoreboard pixels.
   * @param width The rectangle's width in scoreboard pixels.
   * @param height The rectangle's height in scoreboard pixels.
   * @param color The fill color to apply to the rectangle.
   */
  filledRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: Float32Array,
  ): void {
    drawFilledRectangle(
      this.CanvasKit,
      this.canvas,
      x,
      y,
      width,
      height,
      color,
    );
  }

  /**
   * Draws a stroked rectangle border on the current scoreboard canvas.
   *
   * @param x The border's left edge in scoreboard pixels.
   * @param y The border's top edge in scoreboard pixels.
   * @param width The border's width in scoreboard pixels.
   * @param height The border's height in scoreboard pixels.
   * @param color The stroke color to apply to the border.
   * @param strokeWidth The thickness of the rectangle outline in scoreboard pixels.
   */
  strokedRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: Float32Array,
    strokeWidth: number,
  ): void {
    drawStrokedRectangle(
      this.CanvasKit,
      this.canvas,
      x,
      y,
      width,
      height,
      color,
      strokeWidth,
    );
  }

  /**
   * Draws a straight line segment on the current scoreboard canvas.
   *
   * @param startX The horizontal position of the line's starting point.
   * @param startY The vertical position of the line's starting point.
   * @param endX The horizontal position of the line's ending point.
   * @param endY The vertical position of the line's ending point.
   * @param color The stroke color to apply to the line.
   * @param strokeWidth The thickness of the line in scoreboard pixels.
   */
  line(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: Float32Array,
    strokeWidth: number,
  ): void {
    drawLine(
      this.CanvasKit,
      this.canvas,
      startX,
      startY,
      endX,
      endY,
      color,
      strokeWidth,
    );
  }

  /**
   * Draws a text label on the current scoreboard canvas.
   *
   * @param fontFamily The registered font family name to use for the label.
   * @param fontSize The font size, in scoreboard pixels, to use for the label.
   * @param color The resolved text color to apply to the label.
   * @param text The text content to draw.
   * @param x The horizontal anchor position for the label. For centered text this represents the
   * midpoint; for left-aligned text it represents the left edge.
   * @param y The vertical midpoint around which the paragraph is positioned.
   * @param alignment Whether `x` should be treated as a left edge or a center point.
   */
  text(
    fontFamily: string,
    fontSize: number,
    color: Float32Array,
    text: string,
    x: number,
    y: number,
    alignment: 'center' | 'left' = 'left',
  ): void {
    drawText(
      this.CanvasKit,
      this.canvas,
      this.fontProvider,
      fontFamily,
      fontSize,
      color,
      text,
      x,
      y,
      alignment,
    );
  }

  /**
   * Draws a bundled or uploaded flag into an entry row on the current scoreboard canvas.
   *
   * @param entryFlagReference The logical flag reference from the contest entry, such as
   * `World/is.png` or `Custom/A.png`.
   * @param xOffset The horizontal offset for the current scoreboard column, already scaled for the
   * left or right half of the layout.
   * @param yOffset The zero-based row offset within the current column.
   * @param scalingRatio The global scoreboard scaling ratio used to convert layout constants into
   * rendered pixel sizes.
   * @param drawBorder Whether a border should be drawn around the resized flag image.
   * @param borderColor The resolved border color to use when `drawBorder` is enabled.
   */
  async flag(
    entryFlagReference: string,
    xOffset: number,
    yOffset: number,
    scalingRatio: number,
    drawBorder: boolean,
    borderColor: Float32Array,
  ): Promise<void> {
    await drawFlag(
      this.CanvasKit,
      this.canvas,
      entryFlagReference,
      this.generationAssets,
      xOffset,
      yOffset,
      scalingRatio,
      drawBorder,
      borderColor,
    );
  }
}
