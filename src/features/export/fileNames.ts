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
 * Returns a filesystem-safe name for ZIPs and exported files.
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
 * Builds the ZIP archive file name for an export run.
 */
export function createZipFileName(contestName: string): string {
  return `${sanitizeFileName(contestName)}.zip`;
}

/**
 * Builds one placeholder export file name for a voter.
 */
export function createPlaceholderFileName(
  voterName: string,
  voterIndex: number,
  totalVoters: number,
): string {
  const indexWidth = Math.max(2, String(totalVoters).length);
  const paddedIndex = String(voterIndex + 1).padStart(indexWidth, '0');

  return `${paddedIndex} - ${sanitizeFileName(voterName)}.png`;
}
