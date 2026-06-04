import JSZip from 'jszip';

import type { GenerationAssets } from '../assets/generationAssets';
import { buildRankedContest } from '../contest/contestResults';
import type { ContestData } from '../contest/contestTypes';
import { createPlaceholderFileName, createZipFileName } from './fileNames';
import {
  renderScoreboardPng,
  type ScoreboardRenderConfig,
} from '../render/scoreboardRenderer';

/**
 * Represents the generated placeholder ZIP archive.
 */
export interface PlaceholderArchiveResult {
  archiveBytes: Uint8Array;
  generatedCount: number;
  zipFileName: string;
}

/**
 * Represents callbacks used while generating placeholder exports.
 */
export interface PlaceholderArchiveCallbacks {
  isCancelled: () => boolean;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Waits one task turn so worker progress can be observed incrementally.
 */
function waitForNextTask(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Generates scoreboard PNG files and packages them into a ZIP archive.
 */
export async function buildPlaceholderArchive(
  contest: ContestData,
  generationAssets: GenerationAssets,
  renderConfig: ScoreboardRenderConfig,
  callbacks: PlaceholderArchiveCallbacks,
): Promise<PlaceholderArchiveResult> {
  const zip = new JSZip();
  const totalVoters = contest.voterNames.length;
  const rankedContest = buildRankedContest(contest);

  for (let voterIndex = 0; voterIndex < totalVoters; voterIndex += 1) {
    if (callbacks.isCancelled()) {
      throw new Error('Generation was cancelled.');
    }

    const renderedImageBytes = await renderScoreboardPng(
      rankedContest,
      renderConfig,
      voterIndex,
      generationAssets,
    );
    const fileName = createPlaceholderFileName(
      contest.voterNames[voterIndex] ?? '',
      voterIndex,
      totalVoters,
    );

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
