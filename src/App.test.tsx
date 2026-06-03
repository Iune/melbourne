import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';

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

describe('App', () => {
  it('renders the scaffold navigation and form fields', () => {
    renderApp();

    expect(screen.getByRole('link', { name: 'Melbourne' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '#',
    );
    expect(screen.getByRole('link', { name: 'Flags' })).toHaveAttribute(
      'href',
      '#',
    );
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
    expect(
      screen.getByRole('checkbox', { name: 'Include flags' }),
    ).toBeChecked();
    expect(
      screen.getByText('Flags', { selector: 'legend' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Draw flag borders' }),
    ).toBeChecked();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });

  it('enables generation when contest name and file are present', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

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

    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  it('preserves the flag-border value while flags are disabled', async () => {
    const user = userEvent.setup();
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
});
