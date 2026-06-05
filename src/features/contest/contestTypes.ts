/**
 * Represents one entry row parsed from the contest spreadsheet.
 */
export interface ContestEntry {
  artist: string;
  country: string;
  flag: string;
  song: string;
  votes: string[];
}

/**
 * Represents the parsed contest workbook in a normalized in-memory format.
 */
export interface ContestData {
  entries: ContestEntry[];
  hasCountColumn: boolean;
  numEntries: number;
  numVoters: number;
  voterNames: string[];
}

/**
 * Represents a blocking validation or parsing error that can be shown directly in the UI.
 */
export interface ContestParseError {
  message: string;
}

/**
 * Represents the success or failure result of parsing a contest workbook.
 */
export type ContestParseResult = { contest: ContestData; ok: true } | { errors: ContestParseError[]; ok: false };
