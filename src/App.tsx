import {
  ActionIcon,
  Anchor,
  AppShell,
  Button,
  Checkbox,
  ColorInput,
  Container,
  Fieldset,
  FileInput,
  Group,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import type { FormEventHandler } from 'react';
import { useState } from 'react';

const DEFAULT_MAIN_COLOR = '#2F292B';
const DEFAULT_ACCENT_COLOR = '#FCB906';

/**
 * Renders the Melbourne app shell and initial scoreboard generation form.
 */
export function App() {
  const [contestName, setContestName] = useState('');
  const [contestFile, setContestFile] = useState<File | null>(null);
  const [hasCountColumn, setHasCountColumn] = useState(false);
  const [mainColor, setMainColor] = useState(DEFAULT_MAIN_COLOR);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [includeFlags, setIncludeFlags] = useState(true);
  const [drawFlagBorders, setDrawFlagBorders] = useState(true);

  const canGenerate = contestName.trim().length > 0 && contestFile !== null;

  /**
   * Keeps the milestone 2 form inert until generation state is implemented.
   */
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
  };

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Container h="100%" size="lg">
          <Group h="100%" justify="space-between">
            <Anchor fw={700} href="/" size="lg" underline="hover">
              Melbourne
            </Anchor>
            <Group gap="lg">
              <Anchor href="#" underline="hover">
                Help
              </Anchor>
              <Anchor href="#" underline="hover">
                Flags
              </Anchor>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <Stack gap="lg" py="xl">
            <Title order={1}>Generate Scoreboards</Title>
            <form onSubmit={handleSubmit} style={{ maxWidth: '40rem' }}>
              <Stack gap="md">
                <Fieldset legend="Contest Details">
                  <Stack gap="md">
                    <TextInput
                      label="Contest Title"
                      onChange={(event) =>
                        setContestName(event.currentTarget.value)
                      }
                      value={contestName}
                    />
                    <FileInput
                      accept=".xlsx"
                      clearable
                      label="Contest File"
                      onChange={setContestFile}
                      placeholder="Select .xlsx file"
                      value={contestFile}
                    />
                    <Checkbox
                      checked={hasCountColumn}
                      label="Contest file contains ‘Count’ column"
                      onChange={(event) =>
                        setHasCountColumn(event.currentTarget.checked)
                      }
                    />
                  </Stack>
                </Fieldset>
                <Fieldset legend="Colors">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <ColorInput
                        aria-label="Main color"
                        format="hex"
                        label="Main Color"
                        onChange={setMainColor}
                        rightSection={
                        <Tooltip label="Reset main color">
                          <ActionIcon
                            aria-label="Reset main color"
                            onClick={() => setMainColor(DEFAULT_MAIN_COLOR)}
                            size="sm"
                            type="button"
                            variant="subtle"
                          >
                            <IconRefresh size={16} stroke={1.8} />
                          </ActionIcon>
                        </Tooltip>
                      }
                      rightSectionPointerEvents="all"
                      rightSectionWidth={36}
                      swatches={[DEFAULT_MAIN_COLOR]}
                      value={mainColor}
                      w="100%"
                    />
                    <ColorInput
                        aria-label="Accent color"
                        format="hex"
                        label="Accent Color"
                        onChange={setAccentColor}
                        rightSection={
                        <Tooltip label="Reset accent color">
                          <ActionIcon
                            aria-label="Reset accent color"
                            onClick={() => setAccentColor(DEFAULT_ACCENT_COLOR)}
                            size="sm"
                            type="button"
                            variant="subtle"
                          >
                            <IconRefresh size={16} stroke={1.8} />
                          </ActionIcon>
                        </Tooltip>
                      }
                      rightSectionPointerEvents="all"
                      rightSectionWidth={36}
                      swatches={[DEFAULT_ACCENT_COLOR]}
                      value={accentColor}
                      w="100%"
                    />
                  </SimpleGrid>
                </Fieldset>
                <Fieldset legend="Flags">
                  <Group gap="xl" wrap="wrap">
                    <Checkbox
                      checked={includeFlags}
                      label="Include flags"
                      onChange={(event) =>
                        setIncludeFlags(event.currentTarget.checked)
                      }
                    />
                    <Checkbox
                      checked={drawFlagBorders}
                      disabled={!includeFlags}
                      label="Draw flag borders"
                      onChange={(event) =>
                        setDrawFlagBorders(event.currentTarget.checked)
                      }
                    />
                  </Group>
                </Fieldset>
                <Group justify="flex-start">
                  <Button disabled={!canGenerate} type="submit">
                    Generate
                  </Button>
                </Group>
                <div aria-live="polite" />
              </Stack>
            </form>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
