import '@mantine/core/styles.css';

import { createTheme, localStorageColorSchemeManager, MantineProvider } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

const theme = createTheme({
  fontFamily: '"Google Sans Flex", "Google Sans", Arial, sans-serif',
  headings: {
    fontFamily: '"Google Sans Flex", "Google Sans", Arial, sans-serif',
  },
});
const colorSchemeManager = localStorageColorSchemeManager({
  key: 'melbourne-color-scheme',
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Unable to find root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider colorSchemeManager={colorSchemeManager} defaultColorScheme="dark" theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
);
