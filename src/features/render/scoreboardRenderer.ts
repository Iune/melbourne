import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit.js';
import canvasKitWasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url';

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
 * Loads and caches the CanvasKit runtime used by all scoreboard renders.
 *
 * @returns The initialized CanvasKit module, ready for surface creation, paragraph layout, and
 * image work.
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
 * Normalizes the contest title that will be shown in the scoreboard header.
 *
 * @param config The render configuration for the current export run, including the user-specified
 * title text.
 * @returns The trimmed contest title that should appear in the rendered scoreboard header.
 */
function getContestHeaderText(config: ScoreboardRenderConfig): string {
  return config.title.trim();
}

/**
 * Normalizes the vote label shown for the current voter when a vote badge is drawn.
 *
 * @param vote The raw vote string from the contest spreadsheet for the current entry and voter.
 * @returns A display-ready vote string with unnecessary trailing `.0` removed when the value is a
 * whole number.
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
 * Draws every entry row for the scoreboard state after a specific voter reveal.
 *
 * @param contest The fully ranked contest data containing entries, vote history, and per-voter
 * standings.
 * @param config The render configuration controlling title text, colors, and flag display.
 * @param voterIndex The zero-based voter index whose post-vote standings should be rendered.
 * @param painter The painter bound to the current scoreboard surface and asset set.
 * @param renderFonts The resolved font families and bytes already chosen for this render pass.
 * @param fonts The computed font sizes for the current scaling ratio.
 * @param colors The resolved scoreboard color palette for the current export run.
 * @param sizes The computed scoreboard geometry and offsets for the current contest and voter.
 */
async function drawScoreboardEntries(
  contest: RankedContestData,
  config: ScoreboardRenderConfig,
  voterIndex: number,
  painter: ScoreboardPainter,
  renderFonts: ResolvedRenderFonts,
  fonts: ReturnType<typeof createScoreboardFonts>,
  colors: ReturnType<typeof createScoreboardColors>,
  sizes: ReturnType<typeof calculateScoreboardSizes>,
): Promise<void> {
  const numLeft = Math.floor(contest.numEntries / 2) + (contest.numEntries % 2);
  const entries = getResultsAfterVoter(contest, voterIndex);

  for (const [index, entry] of entries.entries()) {
    const xOffset =
      index < numLeft ? 0 : 10 * sizes.scalingRatio + sizes.rectangle;
    const yOffset = index < numLeft ? index : index - numLeft;
    const baseX = 20 * sizes.scalingRatio + xOffset + sizes.flagOffset;

    // Draw entry flag
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

    // Draw entry details
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

    // Draw entry's total number of received points
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

    // Draw entry's number of points received by the current voter
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

    // Draw a dividing line between entries
    painter.line(
      10 * sizes.scalingRatio + xOffset,
      104.5 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      10 * sizes.scalingRatio + xOffset + sizes.rectangle,
      104.5 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      colors.dividerLine,
      0.5 * sizes.scalingRatio,
    );
  }
}

/**
 * Renders a PNG scoreboard image for the standings after the given voter has voted.
 *
 * @param contest The fully ranked contest data to render, including entries, votes, and voter
 * names.
 * @param config The render configuration controlling title text, colors, and whether flags should
 * be displayed.
 * @param voterIndex The zero-based voter index identifying which reveal state should be rendered.
 * @param generationAssets The in-memory asset bundle for the current export run, including any
 * uploaded custom fonts or flags.
 * @returns The encoded PNG bytes for the rendered scoreboard image.
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

  // Fill in scoreboard background color
  canvas.clear(colors.background);

  // Draw voter details
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

  // Draw contest title
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

  // Draw background rectangles for entry details
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

  // Draw entry details
  await drawScoreboardEntries(
    contest,
    config,
    voterIndex,
    painter,
    renderFonts,
    fonts,
    colors,
    sizes,
  );

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
