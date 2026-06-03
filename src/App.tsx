import {
  ActionIcon,
  Alert,
  Anchor,
  AppShell,
  Button,
  Checkbox,
  ColorInput,
  Container,
  Fieldset,
  FileInput,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconDownload, IconRefresh } from '@tabler/icons-react';
import type { FormEventHandler } from 'react';
import { useEffect, useState } from 'react';

const DEFAULT_MAIN_COLOR = '#2F292B';
const DEFAULT_ACCENT_COLOR = '#FCB906';
const MOCK_PROGRESS_STEPS = 10;
const MOCK_PROGRESS_INTERVAL_MS = 500;

type AppState = 'idle' | 'generating' | 'succeeded';

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
  const [appState, setAppState] = useState<AppState>('idle');
  const [progressValue, setProgressValue] = useState(0);

  const canGenerate = contestName.trim().length > 0 && contestFile !== null;
  const isGenerating = appState === 'generating';
  const hasSucceeded = appState === 'succeeded';
  const progressPercent = (progressValue / MOCK_PROGRESS_STEPS) * 100;

  /**
   * Enters the mocked generation state when the required fields are populated.
   */
  function handleStartGeneration() {
    if (!canGenerate || isGenerating) {
      return;
    }

    setProgressValue(0);
    setAppState('generating');
  }

  useEffect(() => {
    if (!isGenerating) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setProgressValue((currentValue) => {
        if (currentValue >= MOCK_PROGRESS_STEPS) {
          return currentValue;
        }

        const nextValue = currentValue + 1;

        if (nextValue >= MOCK_PROGRESS_STEPS) {
          window.clearInterval(intervalId);
          setAppState('succeeded');
        }

        return nextValue;
      });
    }, MOCK_PROGRESS_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isGenerating]);

  /**
   * Starts the mocked generation flow used during the UI state prototype.
   */
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    handleStartGeneration();
  };

  /**
   * Cancels the in-progress mock generation flow and returns to editable state.
   */
  function handleCancel() {
    setAppState('idle');
    setProgressValue(0);
  }

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
                      disabled={isGenerating}
                      label="Contest Title"
                      onChange={(event) =>
                        setContestName(event.currentTarget.value)
                      }
                      value={contestName}
                    />
                    <FileInput
                      accept=".xlsx"
                      clearable
                      disabled={isGenerating}
                      label="Contest File"
                      onChange={setContestFile}
                      placeholder="Select .xlsx file"
                      value={contestFile}
                    />
                    <Checkbox
                      checked={hasCountColumn}
                      disabled={isGenerating}
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
                      disabled={isGenerating}
                      format="hex"
                      label="Main Color"
                      onChange={setMainColor}
                      rightSection={
                        <Tooltip label="Reset main color">
                          <ActionIcon
                            aria-label="Reset main color"
                            disabled={isGenerating}
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
                      disabled={isGenerating}
                      format="hex"
                      label="Accent Color"
                      onChange={setAccentColor}
                      rightSection={
                        <Tooltip label="Reset accent color">
                          <ActionIcon
                            aria-label="Reset accent color"
                            disabled={isGenerating}
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
                      disabled={isGenerating}
                      label="Include flags"
                      onChange={(event) =>
                        setIncludeFlags(event.currentTarget.checked)
                      }
                    />
                    <Checkbox
                      checked={drawFlagBorders}
                      disabled={!includeFlags || isGenerating}
                      label="Draw flag borders"
                      onChange={(event) =>
                        setDrawFlagBorders(event.currentTarget.checked)
                      }
                    />
                  </Group>
                </Fieldset>
                <Group justify="flex-start">
                  <Button
                    color={isGenerating ? 'red' : undefined}
                    disabled={!isGenerating && !canGenerate}
                    onClick={isGenerating ? handleCancel : handleStartGeneration}
                    type="button"
                  >
                    {isGenerating ? 'Cancel' : 'Generate'}
                  </Button>
                </Group>
                <Stack aria-live="polite" gap="sm">
                  {isGenerating ? (
                    <Alert title="Generating" variant="light">
                      <Stack gap="xs">
                        <Text size="sm">
                          {progressValue} of {MOCK_PROGRESS_STEPS} mock
                          scoreboards generated
                        </Text>
                        <Progress aria-label="Generation progress" value={progressPercent} />
                      </Stack>
                    </Alert>
                  ) : null}
                  {hasSucceeded ? (
                    <Alert
                      color="green"
                      icon={<IconCheck size={16} />}
                      title="Generation complete"
                      variant="light"
                    >
                      <Group justify="space-between">
                        <Text size="sm">
                          Mock scoreboards are ready for download.
                        </Text>
                        <Button
                          color="green"
                          leftSection={<IconDownload size={16} />}
                          type="button"
                          variant="light"
                        >
                          Download ZIP
                        </Button>
                      </Group>
                    </Alert>
                  ) : null}
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
