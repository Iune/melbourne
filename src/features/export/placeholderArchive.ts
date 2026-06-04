import JSZip from 'jszip';

import type { ContestData } from '../contest/contestTypes';
import { createPlaceholderFileName, createZipFileName } from './fileNames';

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
 * Generates placeholder text files and packages them into a ZIP archive.
 */
export async function buildPlaceholderArchive(
  contestName: string,
  contest: ContestData,
  callbacks: PlaceholderArchiveCallbacks,
): Promise<PlaceholderArchiveResult> {
  const zip = new JSZip();
  const totalVoters = contest.voterNames.length;

  for (let voterIndex = 0; voterIndex < totalVoters; voterIndex += 1) {
    if (callbacks.isCancelled()) {
      throw new Error('Generation was cancelled.');
    }

    const fileName = createPlaceholderFileName(
      contest.voterNames[voterIndex] ?? '',
      voterIndex,
      totalVoters,
    );

    zip.file(fileName, '');
    callbacks.onProgress?.(voterIndex + 1, totalVoters);

    await waitForNextTask();
  }

  if (callbacks.isCancelled()) {
    throw new Error('Generation was cancelled.');
  }

  return {
    archiveBytes: await zip.generateAsync({ type: 'uint8array' }),
    generatedCount: totalVoters,
    zipFileName: createZipFileName(contestName),
  };
}
