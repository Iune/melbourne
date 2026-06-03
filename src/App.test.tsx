import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
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
  it('renders the project scaffold shell', () => {
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
      screen.getByRole('heading', { name: 'Melbourne' }),
    ).toBeInTheDocument();
  });
});
