const WINDOWS_RESERVED_FILE_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

/**
 * Converts arbitrary user-facing text into a filesystem-safe file name segment.
 *
 * @param name The raw text to sanitize, such as a contest title or voter name.
 * @returns A cleaned file-name string with invalid characters replaced, trailing dots and spaces
 * removed, Windows reserved names avoided, and a fallback of `untitled` when nothing usable
 * remains.
 */
export function sanitizeFileName(name: string): string {
  const trimmedName = name.trim();
  const sanitizedName = trimmedName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replaceAll(/[\n\r\t]/g, '_')
    .split('')
    .map((character) => {
      return character.charCodeAt(0) < 32 ? '_' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim();

  if (sanitizedName.length === 0) {
    return 'untitled';
  }

  if (WINDOWS_RESERVED_FILE_NAMES.has(sanitizedName.toUpperCase())) {
    return `${sanitizedName}_`;
  }

  return sanitizedName;
}

/**
 * Builds the ZIP archive file name for one export run.
 *
 * @param contestName The user-specified contest title that should appear in the exported ZIP file
 * name.
 * @returns A sanitized `.zip` file name derived from the contest title.
 */
export function createZipFileName(contestName: string): string {
  return `${sanitizeFileName(contestName)}.zip`;
}

/**
 * Builds the PNG file name for one generated scoreboard image.
 *
 * @param voterName The voter name that should appear in the exported file name.
 * @param voterIndex The zero-based index of the voter whose scoreboard is being exported.
 * @param totalVoters The total number of voters in the contest, used to determine zero-padding
 * width.
 * @returns A sanitized file name in the `NN - Voter Name.png` format.
 */
export function createScoreboardFileName(
  voterName: string,
  voterIndex: number,
  totalVoters: number,
): string {
  const indexWidth = Math.max(2, String(totalVoters).length);
  const paddedIndex = String(voterIndex + 1).padStart(indexWidth, '0');

  return `${paddedIndex} - ${sanitizeFileName(voterName)}.png`;
}
