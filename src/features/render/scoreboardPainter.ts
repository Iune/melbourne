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
  constructor(
    private readonly CanvasKit: CanvasKitModule,
    private readonly canvas: Canvas,
    private readonly fontProvider: TypefaceFontProvider,
    private readonly generationAssets: GenerationAssets,
  ) {}

  /**
   * Draws one filled rectangle on the current scoreboard canvas.
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
   * Draws one stroked rectangle border on the current scoreboard canvas.
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
   * Draws one divider line on the current scoreboard canvas.
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
   * Draws one text label on the current scoreboard canvas.
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
   * Draws one bundled or uploaded flag into the Melbourne row slot.
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
