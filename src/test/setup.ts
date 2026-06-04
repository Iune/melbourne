import '@testing-library/jest-dom/vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

const originalFetch = globalThis.fetch.bind(globalThis);

/**
 * Resolves a local Vite-served asset URL to an on-disk file path for tests.
 */
function resolveLocalAssetPath(url: URL): string | null {
  if (url.origin !== 'http://localhost') {
    return null;
  }

  const normalizedPath = url.pathname.startsWith('/')
    ? url.pathname.slice(1)
    : url.pathname;

  if (
    normalizedPath.startsWith('src/assets/') ||
    normalizedPath.startsWith('node_modules/')
  ) {
    return resolve(process.cwd(), normalizedPath);
  }

  return null;
}

globalThis.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const requestUrl =
    typeof input === 'string'
      ? new URL(input, 'http://localhost')
      : input instanceof URL
        ? input
        : new URL(input.url, 'http://localhost');
  const localAssetPath = resolveLocalAssetPath(requestUrl);

  if (localAssetPath !== null) {
    const fileBuffer = await readFile(localAssetPath);

    return new Response(fileBuffer, {
      status: 200,
    });
  }

  return originalFetch(input as RequestInfo, init);
};
