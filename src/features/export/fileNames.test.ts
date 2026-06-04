import { describe, expect, it } from 'vitest';

import {
  createPlaceholderFileName,
  createZipFileName,
  sanitizeFileName,
} from './fileNames';

describe('fileNames', () => {
  it('sanitizes invalid filename characters', () => {
    expect(sanitizeFileName(' Contest: Final/Name? ')).toBe(
      'Contest_ Final_Name_',
    );
  });

  it('protects reserved windows file names', () => {
    expect(sanitizeFileName('CON')).toBe('CON_');
  });

  it('builds placeholder file names with padded indexes', () => {
    expect(createPlaceholderFileName('Denmark', 0, 12)).toBe(
      '01 - Denmark.png',
    );
    expect(createPlaceholderFileName('United/Kingdom', 11, 12)).toBe(
      '12 - United_Kingdom.png',
    );
  });

  it('builds a sanitized zip file name from the contest title', () => {
    expect(createZipFileName('FSC 281: Grand Final')).toBe(
      'FSC 281_ Grand Final.zip',
    );
  });
});
