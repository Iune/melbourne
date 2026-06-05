import type { GenerationAssets } from '../assets/generationAssets';
import type { ContestData } from '../contest/contestTypes';
import type { ScoreboardRenderConfig } from '../render/scoreboardRenderer';

/**
 * Represents a scoreboard export job sent from the UI thread to the generation worker.
 */
export interface ScoreboardGenerationRequest {
  contest: ContestData;
  generationAssets: GenerationAssets;
  renderConfig: ScoreboardRenderConfig;
}

/**
 * Represents an incremental progress update emitted by the generation worker.
 */
export interface ScoreboardGenerationProgressMessage {
  completed: number;
  total: number;
  type: 'progress';
}

/**
 * Represents a successful generation result emitted by the worker.
 */
export interface ScoreboardGenerationSuccessMessage {
  archiveBytes: Uint8Array;
  type: 'success';
  zipFileName: string;
}

/**
 * Represents a generation failure emitted by the worker.
 */
export interface ScoreboardGenerationErrorMessage {
  message: string;
  type: 'error';
}

/**
 * Represents any typed message posted from the generation worker back to the UI thread.
 */
export type ScoreboardGenerationWorkerMessage =
  | ScoreboardGenerationErrorMessage
  | ScoreboardGenerationProgressMessage
  | ScoreboardGenerationSuccessMessage;
