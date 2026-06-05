import JSZip from 'jszip';

import type { GenerationAssets } from '../assets/generationAssets';
import { buildRankedContest } from '../contest/contestResults';
import type { ContestData } from '../contest/contestTypes';
import { createScoreboardFileName, createZipFileName } from './fileNames';
import { renderScoreboardPng, type ScoreboardRenderConfig } from '../render/scoreboardRenderer';

/**
 * Represents the completed ZIP archive produced by one export run.
 */
export interface ScoreboardArchiveResult {
  archiveBytes: Uint8Array;
  generatedCount: number;
  zipFileName: string;
}

/**
 * Represents callbacks consulted while generating scoreboard exports.
 */
export interface ScoreboardArchiveCallbacks {
  isCancelled: () => boolean;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Yields to the event loop so progress updates can be observed between generated images.
 *
 * @returns A promise that resolves on the next task turn.
 */
function waitForNextTask(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Generates one scoreboard image per voter and packages the results into a ZIP archive.
 *
 * @param contest The parsed contest data whose voters and entries should be rendered.
 * @param generationAssets The in-memory asset bundle for the current export run, including any
 * uploaded custom flags or fonts.
 * @param renderConfig The rendering options controlling title text, colors, and flag display.
 * @param callbacks The cancellation and progress callbacks used to coordinate with the worker or
 * UI layer.
 * @returns The generated ZIP archive bytes, the number of generated images, and the final ZIP file
 * name.
 */
export async function buildScoreboardArchive(
  contest: ContestData,
  generationAssets: GenerationAssets,
  renderConfig: ScoreboardRenderConfig,
  callbacks: ScoreboardArchiveCallbacks,
): Promise<ScoreboardArchiveResult> {
  const zip = new JSZip();
  const totalVoters = contest.voterNames.length;
  const rankedContest = buildRankedContest(contest);

  for (let voterIndex = 0; voterIndex < totalVoters; voterIndex += 1) {
    if (callbacks.isCancelled()) {
      throw new Error('Generation was cancelled.');
    }

    const renderedImageBytes = await renderScoreboardPng(rankedContest, renderConfig, voterIndex, generationAssets);
    const fileName = createScoreboardFileName(contest.voterNames[voterIndex] ?? '', voterIndex, totalVoters);

    zip.file(fileName, renderedImageBytes);
    callbacks.onProgress?.(voterIndex + 1, totalVoters);

    await waitForNextTask();
  }

  if (callbacks.isCancelled()) {
    throw new Error('Generation was cancelled.');
  }

  return {
    archiveBytes: await zip.generateAsync({ type: 'uint8array' }),
    generatedCount: totalVoters,
    zipFileName: createZipFileName(renderConfig.title),
  };
}
