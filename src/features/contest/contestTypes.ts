/**
 * Represents one contest entry row parsed from the spreadsheet.
 */
export interface ContestEntry {
  artist: string;
  country: string;
  flag: string;
  song: string;
  votes: string[];
}

/**
 * Represents contest data parsed from the spreadsheet.
 */
export interface ContestData {
  entries: ContestEntry[];
  hasCountColumn: boolean;
  numEntries: number;
  numVoters: number;
  voterNames: string[];
}

/**
 * Represents a blocking validation error surfaced to the UI.
 */
export interface ContestParseError {
  message: string;
}

/**
 * Represents the success or failure result of contest parsing.
 */
export type ContestParseResult =
  | { contest: ContestData; ok: true }
  | { errors: ContestParseError[]; ok: false };
