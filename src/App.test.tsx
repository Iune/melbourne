import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { parseContestWorkbook } from './features/contest/contestParser';
import { startScoreboardGeneration } from './features/export/scoreboardGenerationClient';

vi.mock('./features/contest/contestParser', () => ({
  parseContestWorkbook: vi.fn(),
}));
vi.mock('./features/export/scoreboardGenerationClient', () => ({
  startScoreboardGeneration: vi.fn(),
}));

const mockedParseContestWorkbook = vi.mocked(parseContestWorkbook);
const mockedStartScoreboardGeneration = vi.mocked(startScoreboardGeneration);

/**
 * Renders the app with providers required by Mantine components.
 */
function renderApp() {
  return render(
    <MantineProvider>
      <App />
    </MantineProvider>,
  );
}

/**
 * Populates the required fields so the mocked generate flow can start.
 */
async function populateRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) {
  const fileInput = container.querySelector('input[type="file"]');

  if (!(fileInput instanceof HTMLInputElement)) {
    throw new Error('Unable to find contest file input');
  }

  await user.type(screen.getByLabelText(/Contest Title/), 'Contest 1988');
  await user.upload(
    fileInput,
    new File([''], 'contest.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
}

afterEach(() => {
  if (vi.isFakeTimers()) {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  }

  mockedParseContestWorkbook.mockReset();
  mockedStartScoreboardGeneration.mockReset();
});

describe('App', () => {
  it('renders the scaffold navigation and form fields', () => {
    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 0,
        voterNames: [],
      },
      ok: true,
    });
    renderApp();

    expect(
      screen.getByRole('link', { name: 'Melbourne Scoreboard Generator' }),
    ).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '#help',
    );
    expect(screen.getByRole('link', { name: 'Flags' })).toHaveAttribute(
      'href',
      '#flags',
    );
    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Generate Scoreboards' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Contest Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contest File/)).toBeInTheDocument();
    expect(
      screen.getByText('Contest Details', { selector: 'legend' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: 'Contest file contains ‘Count’ column',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Colors', { selector: 'legend' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Main color')).toHaveValue('#2F292B');
    expect(screen.getByLabelText('Accent color')).toHaveValue('#FCB906');
    expect(screen.getByLabelText(/Base Font/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Points Font/)).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Include flags' }),
    ).toBeChecked();
    expect(
      screen.getByText('Flags', { selector: 'legend' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Draw flag borders' }),
    ).toBeChecked();
    expect(screen.getByLabelText(/Flag Files/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });

  it('toggles between light and dark mode from the header control', async () => {
    const user = userEvent.setup();
    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 0,
        voterNames: [],
      },
      ok: true,
    });
    renderApp();

    const colorSchemeToggle = screen.getByRole('button', {
      name: 'Switch to dark mode',
    });

    await user.click(colorSchemeToggle);

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument();
  });

  it('shows the bundled flags view from the navbar', async () => {
    const user = userEvent.setup();
    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 0,
        voterNames: [],
      },
      ok: true,
    });
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Flags' }));

    expect(
      screen.getByRole('heading', { name: 'Bundled Flags' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ISC \(\d+\)/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Rect \(\d+\)/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /World \(\d+\)/ })).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Generate Scoreboards' }),
    ).not.toBeInTheDocument();
  });

  it('shows the help view from the navbar', async () => {
    const user = userEvent.setup();
    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 0,
        voterNames: [],
      },
      ok: true,
    });
    renderApp();

    await user.click(screen.getByRole('link', { name: 'Help' }));

    expect(screen.getByRole('heading', { name: 'Help' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Input File Format' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Generating Scoreboards' }),
    ).toBeInTheDocument();
    expect(screen.getByText('DQ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1988.xlsx' })).toHaveAttribute(
      'href',
      '/1988.xlsx',
    );
  });

  it('runs the mocked generation flow through success', async () => {
    const { container } = renderApp();
    const user = userEvent.setup();

    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 2,
        voterNames: ['Denmark', 'Sweden'],
      },
      ok: true,
    });
    mockedStartScoreboardGeneration.mockImplementation(
      (_contest, _generationAssets, _renderConfig, callbacks) => {
        callbacks.onProgress(0, 2);
        callbacks.onProgress(1, 2);
        callbacks.onSuccess(new Uint8Array([1, 2, 3]), 'Contest 1988.zip');

        return { cancel: vi.fn() };
      },
    );
    await populateRequiredFields(user, container);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    });

    expect(
      screen.getByRole('link', { name: 'Download ZIP' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Scoreboards are ready for download.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  it('cancels the placeholder generation flow and returns to idle', async () => {
    const { container } = renderApp();
    const user = userEvent.setup();
    const cancelSpy = vi.fn();

    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 2,
        voterNames: ['Denmark', 'Sweden'],
      },
      ok: true,
    });
    mockedStartScoreboardGeneration.mockImplementation(
      (_contest, _generationAssets, _renderConfig, callbacks) => {
        callbacks.onProgress(0, 2);

        return { cancel: cancelSpy };
      },
    );
    await populateRequiredFields(user, container);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByText('0 of 2 scoreboards generated'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(cancelSpy).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole('button', { name: 'Download ZIP' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/scoreboards generated/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  it('preserves the flag-border value while flags are disabled', async () => {
    const user = userEvent.setup();
    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 0,
        voterNames: [],
      },
      ok: true,
    });
    renderApp();

    const includeFlags = screen.getByRole('checkbox', {
      name: 'Include flags',
    });
    const drawFlagBorders = screen.getByRole('checkbox', {
      name: 'Draw flag borders',
    });

    await user.click(includeFlags);

    expect(includeFlags).not.toBeChecked();
    expect(drawFlagBorders).toBeChecked();
    expect(drawFlagBorders).toBeDisabled();

    await user.click(includeFlags);

    expect(drawFlagBorders).toBeChecked();
    expect(drawFlagBorders).toBeEnabled();
  });

  it('disables custom flag uploads while preserving the current selection state', async () => {
    const user = userEvent.setup();
    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [],
        hasCountColumn: false,
        numEntries: 0,
        numVoters: 0,
        voterNames: [],
      },
      ok: true,
    });
    renderApp();

    const includeFlags = screen.getByRole('checkbox', {
      name: 'Include flags',
    });
    const customFlagFiles = screen.getByLabelText(/Flag Files/);

    expect(customFlagFiles).toBeEnabled();

    await user.click(includeFlags);

    expect(includeFlags).not.toBeChecked();
    expect(customFlagFiles).toBeDisabled();

    await user.click(includeFlags);

    expect(customFlagFiles).toBeEnabled();
  });

  it('shows blocking validation errors when parsing fails', async () => {
    const { container } = renderApp();
    const user = userEvent.setup();

    mockedParseContestWorkbook.mockResolvedValue({
      errors: [{ message: 'Excel sheet does not have enough columns.' }],
      ok: false,
    });
    await populateRequiredFields(user, container);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
      await Promise.resolve();
    });

    expect(screen.getByText('Validation Failed')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Error' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Excel sheet does not have enough columns.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });

  it('shows blocking flag validation errors and does not start generation', async () => {
    const { container } = renderApp();
    const user = userEvent.setup();

    mockedParseContestWorkbook.mockResolvedValue({
      contest: {
        entries: [
          {
            artist: 'Artist A',
            country: 'Alpha',
            flag: '../World/is.png',
            song: 'Song A',
            votes: [],
          },
          {
            artist: 'Artist B',
            country: 'Beta',
            flag: 'World/not-real.png',
            song: 'Song B',
            votes: [],
          },
        ],
        hasCountColumn: false,
        numEntries: 2,
        numVoters: 2,
        voterNames: ['Voter A', 'Voter B'],
      },
      ok: true,
    });
    await populateRequiredFields(user, container);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
      await Promise.resolve();
    });

    expect(screen.getByText('Validation Failed')).toBeInTheDocument();
    expect(
      screen.getByText('Invalid flag reference for Alpha: ../World/is.png'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Missing bundled flag for Beta: World/not-real.png'),
    ).toBeInTheDocument();
    expect(mockedStartScoreboardGeneration).not.toHaveBeenCalled();
  });
});
