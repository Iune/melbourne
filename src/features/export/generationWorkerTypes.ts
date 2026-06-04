import type { GenerationAssets } from '../assets/generationAssets';
import type { ContestData } from '../contest/contestTypes';
import type { ScoreboardRenderConfig } from '../render/scoreboardRenderer';

/**
 * Represents a scoreboard export job sent from the UI to the worker.
 */
export interface PlaceholderGenerationRequest {
  contest: ContestData;
  generationAssets: GenerationAssets;
  renderConfig: ScoreboardRenderConfig;
}

/**
 * Represents a progress update from the generation worker.
 */
export interface PlaceholderGenerationProgressMessage {
  completed: number;
  total: number;
  type: 'progress';
}

/**
 * Represents a successful generation result from the worker.
 */
export interface PlaceholderGenerationSuccessMessage {
  archiveBytes: Uint8Array;
  type: 'success';
  zipFileName: string;
}

/**
 * Represents a worker failure.
 */
export interface PlaceholderGenerationErrorMessage {
  message: string;
  type: 'error';
}

/**
 * Represents any message posted from the generation worker.
 */
export type PlaceholderGenerationWorkerMessage =
  | PlaceholderGenerationErrorMessage
  | PlaceholderGenerationProgressMessage
  | PlaceholderGenerationSuccessMessage;
