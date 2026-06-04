import type { GenerationAssets } from '../assets/generationAssets';
import type { ContestData } from '../contest/contestTypes';
import type { ScoreboardRenderConfig } from '../render/scoreboardRenderer';

/**
 * Represents a scoreboard export job sent from the UI to the worker.
 */
export interface ScoreboardGenerationRequest {
  contest: ContestData;
  generationAssets: GenerationAssets;
  renderConfig: ScoreboardRenderConfig;
}

/**
 * Represents a progress update from the generation worker.
 */
export interface ScoreboardGenerationProgressMessage {
  completed: number;
  total: number;
  type: 'progress';
}

/**
 * Represents a successful generation result from the worker.
 */
export interface ScoreboardGenerationSuccessMessage {
  archiveBytes: Uint8Array;
  type: 'success';
  zipFileName: string;
}

/**
 * Represents a worker failure.
 */
export interface ScoreboardGenerationErrorMessage {
  message: string;
  type: 'error';
}

/**
 * Represents any message posted from the generation worker.
 */
export type ScoreboardGenerationWorkerMessage =
  | ScoreboardGenerationErrorMessage
  | ScoreboardGenerationProgressMessage
  | ScoreboardGenerationSuccessMessage;
