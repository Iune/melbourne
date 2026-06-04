import ExcelJS from 'exceljs';

/**
 * Represents options for building a valid contest workbook fixture.
 */
export interface ContestWorkbookFixtureOptions {
  hasCountColumn?: boolean;
  numVoters?: number;
}

/**
 * Converts workbook output into a browser-friendly ArrayBuffer.
 */
function normalizeWorkbookBuffer(buffer: ExcelJS.Buffer): ArrayBuffer {
  const normalizedBytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  return normalizedBytes.buffer.slice(
    normalizedBytes.byteOffset,
    normalizedBytes.byteOffset + normalizedBytes.byteLength,
  );
}

/**
 * Builds a minimal valid contest workbook fixture.
 */
export async function createValidContestWorkbookBuffer(
  options: ContestWorkbookFixtureOptions = {},
): Promise<ArrayBuffer> {
  const { hasCountColumn = false, numVoters = 2 } = options;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Contest');
  const voterHeaders = Array.from({ length: numVoters }, (_, index) => {
    return `Voter ${String.fromCharCode(65 + index)}`;
  });
  const firstEntryVotes = Array.from({ length: numVoters }, (_, index) => {
    return index === 0 ? '5' : '';
  });
  const secondEntryVotes = Array.from({ length: numVoters }, (_, index) => {
    return index === 1 ? '3' : '';
  });
  const headerRow = hasCountColumn
    ? [
        '#',
        'Country',
        'Flag',
        'Artist',
        'Song',
        'Total',
        '# Voters',
        ...voterHeaders,
      ]
    : ['#', 'Country', 'Flag', 'Artist', 'Song', 'Total', ...voterHeaders];
  const firstEntryRow = hasCountColumn
    ? [
        '1',
        'Alpha',
        'World/aa.png',
        'Artist A',
        'Song A',
        '5',
        '1',
        ...firstEntryVotes,
      ]
    : [
        '1',
        'Alpha',
        'World/aa.png',
        'Artist A',
        'Song A',
        '5',
        ...firstEntryVotes,
      ];
  const secondEntryRow = hasCountColumn
    ? [
        '2',
        'Beta',
        'World/bb.png',
        'Artist B',
        'Song B',
        '3',
        '1',
        ...secondEntryVotes,
      ]
    : [
        '2',
        'Beta',
        'World/bb.png',
        'Artist B',
        'Song B',
        '3',
        ...secondEntryVotes,
      ];

  worksheet.addRow(headerRow);
  worksheet.addRow(firstEntryRow);
  worksheet.addRow(secondEntryRow);

  return normalizeWorkbookBuffer(await workbook.xlsx.writeBuffer());
}

/**
 * Builds a malformed workbook fixture that does not contain enough columns.
 */
export async function createTooFewColumnsWorkbookBuffer(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Contest');

  worksheet.addRow(['#', 'Country']);
  worksheet.addRow(['1', 'Alpha']);

  return normalizeWorkbookBuffer(await workbook.xlsx.writeBuffer());
}
