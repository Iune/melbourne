import type { GenerationAssets } from '../assets/generationAssets';
import type { ContestData } from '../contest/contestTypes';
import type { ScoreboardRenderConfig } from '../render/scoreboardRenderer';
import type {
  ScoreboardGenerationRequest,
  ScoreboardGenerationWorkerMessage,
} from './generationWorkerTypes';

/**
 * Represents callbacks used while the worker is generating exports.
 */
export interface ScoreboardGenerationCallbacks {
  onError: (message: string) => void;
  onProgress: (completed: number, total: number) => void;
  onSuccess: (archiveBytes: Uint8Array, zipFileName: string) => void;
}

/**
 * Represents the running worker controller for one generation job.
 */
export interface ScoreboardGenerationController {
  cancel: () => void;
}

/**
 * Starts scoreboard export generation inside a dedicated worker.
 */
export function startScoreboardGeneration(
  contest: ContestData,
  generationAssets: GenerationAssets,
  renderConfig: ScoreboardRenderConfig,
  callbacks: ScoreboardGenerationCallbacks,
): ScoreboardGenerationController {
  const worker = new Worker(
    new URL('./scoreboardGenerationWorker.ts', import.meta.url),
    { type: 'module' },
  );

  worker.onmessage = (
    event: MessageEvent<ScoreboardGenerationWorkerMessage>,
  ) => {
    if (event.data.type === 'progress') {
      callbacks.onProgress(event.data.completed, event.data.total);
      return;
    }

    if (event.data.type === 'success') {
      callbacks.onSuccess(event.data.archiveBytes, event.data.zipFileName);
      worker.terminate();
      return;
    }

    callbacks.onError(event.data.message);
    worker.terminate();
  };

  worker.onerror = () => {
    callbacks.onError('Unable to generate scoreboard exports.');
    worker.terminate();
  };

  const request: ScoreboardGenerationRequest = {
    contest,
    generationAssets,
    renderConfig,
  };

  worker.postMessage(request);

  return {
    cancel: () => {
      worker.postMessage('cancel');
      worker.terminate();
    },
  };
}
