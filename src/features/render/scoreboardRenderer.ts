import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit.js';
import canvasKitWasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url';
import type { TypefaceFontProvider } from 'canvaskit-wasm';

import type { GenerationAssets } from '../assets/generationAssets';
import {
  getResultsAfterVoter,
  parseVoteValue,
  type RankedContestData,
} from '../contest/contestResults';
import {
  resolveRenderFonts,
  type ResolvedRenderFonts,
} from './scoreboardFonts';
import { ScoreboardPainter } from './scoreboardPainter';
import {
  calculateScoreboardSizes,
  createScoreboardColors,
  createScoreboardFonts,
  type CanvasKitModule,
} from './scoreboardUtilities';

/**
 * Represents the rendering configuration for one scoreboard export run.
 */
export interface ScoreboardRenderConfig {
  accentColor: string;
  displayFlagBorders: boolean;
  displayFlags: boolean;
  mainColor: string;
  title: string;
}

let cachedCanvasKit: Promise<CanvasKitModule> | null = null;
const canvasKitWasmLocatePath =
  typeof process !== 'undefined' &&
  canvasKitWasmUrl.startsWith('/node_modules/')
    ? `${process.cwd()}${canvasKitWasmUrl}`
    : canvasKitWasmUrl;

/**
 * Loads the CanvasKit runtime once for reuse across all renders.
 */
async function loadCanvasKit(): Promise<CanvasKitModule> {
  if (cachedCanvasKit === null) {
    cachedCanvasKit = CanvasKitInit({
      locateFile: () => canvasKitWasmLocatePath,
    });
  }

  return cachedCanvasKit;
}

/**
 * Returns the displayed contest header text for one render.
 */
function getContestHeaderText(config: ScoreboardRenderConfig): string {
  return config.title.trim();
}

/**
 * Normalizes displayed vote text the same way as the C# renderer.
 */
function formatReceivedVoteText(vote: string): string {
  const trimmedVote = vote.trim();

  if (trimmedVote.endsWith('.0')) {
    const parsedVote = parseVoteValue(trimmedVote);

    if (parsedVote !== null) {
      return String(parsedVote);
    }
  }

  return trimmedVote;
}

/**
 * Renders one scoreboard PNG for the standings after one voter reveal.
 */
export async function renderScoreboardPng(
  contest: RankedContestData,
  config: ScoreboardRenderConfig,
  voterIndex: number,
  generationAssets: GenerationAssets,
): Promise<Uint8Array> {
  const [CanvasKit, renderFonts] = await Promise.all([
    loadCanvasKit(),
    resolveRenderFonts(generationAssets),
  ]);
  const fontProvider = CanvasKit.TypefaceFontProvider.Make();

  fontProvider.registerFont(
    renderFonts.baseFontBytes,
    renderFonts.baseFontFamily,
  );
  fontProvider.registerFont(
    renderFonts.pointsFontBytes,
    renderFonts.pointsFontFamily,
  );

  const colors = createScoreboardColors(config.mainColor, config.accentColor);
  const contestHeaderText = getContestHeaderText(config);
  const sizes = calculateScoreboardSizes(
    CanvasKit,
    fontProvider,
    renderFonts.baseFontFamily,
    contest,
    contestHeaderText,
    config.displayFlags,
    voterIndex,
  );
  const fonts = createScoreboardFonts(sizes.scalingRatio);
  const surface = CanvasKit.MakeSurface(sizes.width, sizes.height);

  if (surface === null) {
    fontProvider.delete();
    throw new Error('Unable to create CanvasKit surface.');
  }

  const canvas = surface.getCanvas();
  const painter = new ScoreboardPainter(
    CanvasKit,
    canvas,
    fontProvider,
    generationAssets,
  );

  canvas.clear(colors.background);

  painter.filledRectangle(
    0,
    0,
    sizes.width,
    30 * sizes.scalingRatio,
    colors.voterHeader,
  );
  painter.text(
    renderFonts.baseFontFamily,
    fonts.voterHeaderSize,
    colors.voterHeaderText,
    `Now Voting: ${contest.voterNames[voterIndex]} (${String(voterIndex + 1)}/${String(contest.numVoters)})`,
    10 * sizes.scalingRatio,
    15 * sizes.scalingRatio,
  );

  painter.filledRectangle(
    0,
    30 * sizes.scalingRatio,
    sizes.width,
    30 * sizes.scalingRatio,
    colors.contestHeader,
  );
  painter.text(
    renderFonts.baseFontFamily,
    fonts.contestHeaderSize,
    colors.contestHeaderText,
    contestHeaderText,
    10 * sizes.scalingRatio,
    45 * sizes.scalingRatio,
  );

  const numLeft = Math.floor(contest.numEntries / 2) + (contest.numEntries % 2);
  const numRight = contest.numEntries - numLeft;

  painter.filledRectangle(
    10 * sizes.scalingRatio,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numLeft,
    colors.entryDetails,
  );
  painter.strokedRectangle(
    10 * sizes.scalingRatio,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numLeft,
    colors.entryDetailsBorder,
    2,
  );
  painter.filledRectangle(
    20 * sizes.scalingRatio + sizes.rectangle,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numRight,
    colors.entryDetails,
  );
  painter.strokedRectangle(
    20 * sizes.scalingRatio + sizes.rectangle,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numRight,
    colors.entryDetailsBorder,
    2,
  );

  const entries = getResultsAfterVoter(contest, voterIndex);

  for (const [index, entry] of entries.entries()) {
    const xOffset =
      index < numLeft ? 0 : 10 * sizes.scalingRatio + sizes.rectangle;
    const yOffset = index < numLeft ? index : index - numLeft;
    const baseX = 20 * sizes.scalingRatio + xOffset + sizes.flagOffset;

    if (config.displayFlags) {
      await painter.flag(
        entry.flag,
        xOffset,
        yOffset,
        sizes.scalingRatio,
        config.displayFlagBorders,
        colors.entryDetailsBorder,
      );
    }

    painter.text(
      renderFonts.baseFontFamily,
      fonts.countrySize,
      colors.countryText,
      entry.country,
      baseX,
      80 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
    );
    painter.text(
      renderFonts.baseFontFamily,
      fonts.entryDetailsSize,
      colors.entryDetailsText,
      `${entry.artist} – ${entry.song}`,
      baseX,
      94 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
    );

    const totalPointsColor = entry.dqStatuses[voterIndex]
      ? colors.dqedPoints
      : colors.totalPoints;
    const totalPointsTextColor = entry.dqStatuses[voterIndex]
      ? colors.dqedPointsText
      : colors.totalPointsText;

    painter.filledRectangle(
      30 * sizes.scalingRatio +
        xOffset +
        sizes.flagOffset +
        sizes.entryDetailsWidth,
      77 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      29 * sizes.scalingRatio,
      20 * sizes.scalingRatio,
      totalPointsColor,
    );
    painter.text(
      renderFonts.pointsFontFamily,
      fonts.pointsSize,
      totalPointsTextColor,
      String(entry.displayPoints[voterIndex]),
      44.5 * sizes.scalingRatio +
        xOffset +
        sizes.flagOffset +
        sizes.entryDetailsWidth,
      87 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      'center',
    );

    const receivedVote = entry.votes[voterIndex]?.trim() ?? '';

    if (receivedVote.length > 0) {
      painter.filledRectangle(
        59 * sizes.scalingRatio +
          xOffset +
          sizes.flagOffset +
          sizes.entryDetailsWidth,
        77 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
        24 * sizes.scalingRatio,
        20 * sizes.scalingRatio,
        colors.receivedPoints,
      );
      painter.text(
        renderFonts.pointsFontFamily,
        fonts.pointsSize,
        colors.receivedPointsText,
        formatReceivedVoteText(receivedVote),
        71 * sizes.scalingRatio +
          xOffset +
          sizes.flagOffset +
          sizes.entryDetailsWidth,
        87 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
        'center',
      );
    }

    painter.line(
      10 * sizes.scalingRatio + xOffset,
      104.5 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      10 * sizes.scalingRatio + xOffset + sizes.rectangle,
      104.5 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      colors.dividerLine,
      0.5 * sizes.scalingRatio,
    );
  }

  const image = surface.makeImageSnapshot();
  const encodedBytes = image.encodeToBytes();

  image.delete();
  surface.delete();
  fontProvider.delete();

  if (encodedBytes === null) {
    throw new Error('Unable to encode PNG image.');
  }

  return encodedBytes;
}
