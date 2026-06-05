import ExcelJS from 'exceljs';

import type {
  ContestData,
  ContestEntry,
  ContestParseError,
  ContestParseResult,
} from './contestTypes';

const MIN_REQUIRED_COLUMNS_WITHOUT_COUNT = 7;
const MIN_REQUIRED_COLUMNS_WITH_COUNT = 8;
const VOTE_START_COLUMN_WITHOUT_COUNT = 7;
const VOTE_START_COLUMN_WITH_COUNT = 8;
const FIRST_DATA_ROW_NUMBER = 2;
const HEADER_ROW_NUMBER = 1;
const COUNTRY_COLUMN = 2;
const FLAG_COLUMN = 3;
const ARTIST_COLUMN = 4;
const SONG_COLUMN = 5;
type WorkbookLoadInput = Parameters<ExcelJS.Workbook['xlsx']['load']>[0];

/**
 * Creates a standardized parse failure result from one or more messages.
 */
function createErrorResult(messages: string[]): ContestParseResult {
  return {
    errors: messages.map<ContestParseError>((message) => ({ message })),
    ok: false,
  };
}

/**
 * Returns trimmed display text for a worksheet cell.
 */
function getTrimmedCellText(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  columnNumber: number,
): string {
  return worksheet.getRow(rowNumber).getCell(columnNumber).text.trim();
}

/**
 * Builds one parsed contest entry from a worksheet row.
 */
function buildContestEntry(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  voteStartColumn: number,
  totalColumns: number,
): ContestEntry {
  const votes: string[] = [];

  for (
    let columnNumber = voteStartColumn;
    columnNumber <= totalColumns;
    columnNumber += 1
  ) {
    votes.push(getTrimmedCellText(worksheet, rowNumber, columnNumber));
  }

  return {
    artist: getTrimmedCellText(worksheet, rowNumber, ARTIST_COLUMN),
    country: getTrimmedCellText(worksheet, rowNumber, COUNTRY_COLUMN),
    flag: getTrimmedCellText(worksheet, rowNumber, FLAG_COLUMN),
    song: getTrimmedCellText(worksheet, rowNumber, SONG_COLUMN),
    votes,
  };
}

/**
 * Parses contest data from workbook bytes using Melbourne-compatible rules.
 */
export async function parseContestWorkbook(
  fileContents: ArrayBuffer,
  hasCountColumn: boolean,
): Promise<ContestParseResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(
      new Uint8Array(fileContents) as unknown as WorkbookLoadInput,
    );
  } catch {
    return createErrorResult(['Unable to read the Excel workbook.']);
  }

  const worksheet = workbook.worksheets[0];

  if (worksheet === undefined) {
    return createErrorResult([
      'Excel workbook does not contain any worksheets.',
    ]);
  }

  const minRequiredColumns = hasCountColumn
    ? MIN_REQUIRED_COLUMNS_WITH_COUNT
    : MIN_REQUIRED_COLUMNS_WITHOUT_COUNT;
  const voteStartColumn = hasCountColumn
    ? VOTE_START_COLUMN_WITH_COUNT
    : VOTE_START_COLUMN_WITHOUT_COUNT;
  const totalColumns = worksheet.actualColumnCount;
  const totalRows = worksheet.actualRowCount;

  if (totalColumns < minRequiredColumns) {
    return createErrorResult(['Excel sheet does not have enough columns.']);
  }

  if (totalRows < 2) {
    return createErrorResult(['Excel sheet does not have enough rows.']);
  }

  const voterNames: string[] = [];

  for (
    let columnNumber = voteStartColumn;
    columnNumber <= totalColumns;
    columnNumber += 1
  ) {
    voterNames.push(
      getTrimmedCellText(worksheet, HEADER_ROW_NUMBER, columnNumber),
    );
  }

  const entries: ContestEntry[] = [];

  for (
    let rowNumber = FIRST_DATA_ROW_NUMBER;
    rowNumber <= totalRows;
    rowNumber += 1
  ) {
    const entry = buildContestEntry(
      worksheet,
      rowNumber,
      voteStartColumn,
      totalColumns,
    );

    if (
      entry.country.length === 0 ||
      entry.artist.length === 0 ||
      entry.song.length === 0
    ) {
      break;
    }

    entries.push(entry);
  }

  const contest: ContestData = {
    entries,
    hasCountColumn,
    numEntries: entries.length,
    numVoters: voterNames.length,
    voterNames,
  };

  return { contest, ok: true };
}
