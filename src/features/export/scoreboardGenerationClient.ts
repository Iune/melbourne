import type { GenerationAssets } from '../assets/generationAssets';
import type { ContestData } from '../contest/contestTypes';
import type { ScoreboardRenderConfig } from '../render/scoreboardRenderer';
import type {
  ScoreboardGenerationRequest,
  ScoreboardGenerationWorkerMessage,
} from './generationWorkerTypes';

/**
 * Represents the callbacks used by the UI while a worker is generating exports.
 */
export interface ScoreboardGenerationCallbacks {
  onError: (message: string) => void;
  onProgress: (completed: number, total: number) => void;
  onSuccess: (archiveBytes: Uint8Array, zipFileName: string) => void;
}

/**
 * Represents the running worker controller returned for one generation job.
 */
export interface ScoreboardGenerationController {
  cancel: () => void;
}

/**
 * Starts a scoreboard export job inside a dedicated worker and wires its messages back to the UI.
 *
 * @param contest The parsed contest data whose scoreboards should be generated.
 * @param generationAssets The in-memory asset bundle for the current export run, including any
 * uploaded custom flags or fonts.
 * @param renderConfig The rendering options controlling title text, colors, and flag display.
 * @param callbacks The UI callbacks that should receive progress, success, and error updates from
 * the worker.
 * @returns A controller that can cancel the active worker job.
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
