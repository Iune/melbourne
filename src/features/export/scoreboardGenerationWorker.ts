/// <reference lib="webworker" />

import { buildScoreboardArchive } from './scoreboardArchive';
import type {
  ScoreboardGenerationRequest,
  ScoreboardGenerationWorkerMessage,
} from './generationWorkerTypes';

let wasCancelled = false;

/**
 * Posts a typed message back to the main thread.
 */
function postWorkerMessage(message: ScoreboardGenerationWorkerMessage): void {
  self.postMessage(message);
}

self.onmessage = async (
  event: MessageEvent<ScoreboardGenerationRequest | 'cancel'>,
) => {
  if (event.data === 'cancel') {
    wasCancelled = true;
    return;
  }

  wasCancelled = false;

  try {
    const archive = await buildScoreboardArchive(
      event.data.contest,
      event.data.generationAssets,
      event.data.renderConfig,
      {
        isCancelled: () => wasCancelled,
        onProgress: (completed, total) => {
          postWorkerMessage({
            completed,
            total,
            type: 'progress',
          });
        },
      },
    );

    if (wasCancelled) {
      return;
    }

    postWorkerMessage({
      archiveBytes: archive.archiveBytes,
      type: 'success',
      zipFileName: archive.zipFileName,
    });
  } catch (error) {
    if (wasCancelled) {
      return;
    }

    postWorkerMessage({
      message:
        error instanceof Error
          ? error.message
          : 'Unable to generate scoreboard exports.',
      type: 'error',
    });
  }
};

export {};
