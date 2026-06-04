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
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconDownload,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import type { FormEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';

import { parseContestWorkbook } from './features/contest/contestParser';
import type {
  ContestData,
  ContestParseError,
} from './features/contest/contestTypes';
import type { PlaceholderGenerationController } from './features/export/placeholderGenerationClient';
import { startPlaceholderGeneration } from './features/export/placeholderGenerationClient';
import { validateBundledFlags } from './features/flags/flagValidation';

const DEFAULT_MAIN_COLOR = '#2F292B';
const DEFAULT_ACCENT_COLOR = '#FCB906';

type AppState = 'idle' | 'generating' | 'succeeded' | 'validationFailed';

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
  const [progressTotal, setProgressTotal] = useState(0);
  const [generatedArchiveUrl, setGeneratedArchiveUrl] = useState<string | null>(
    null,
  );
  const [generatedZipFileName, setGeneratedZipFileName] = useState('');
  const [generationErrorMessage, setGenerationErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<ContestParseError[]>(
    [],
  );
  const generationControllerRef =
    useRef<PlaceholderGenerationController | null>(null);

  const canGenerate = contestName.trim().length > 0 && contestFile !== null;
  const isGenerating = appState === 'generating';
  const hasSucceeded = appState === 'succeeded';
  const hasValidationFailed = appState === 'validationFailed';
  const progressPercent =
    progressTotal === 0 ? 0 : (progressValue / progressTotal) * 100;

  /**
   * Clears any generated download artifact from the previous run.
   */
  function clearGeneratedArchive(): void {
    if (generatedArchiveUrl !== null) {
      URL.revokeObjectURL(generatedArchiveUrl);
    }

    setGeneratedArchiveUrl(null);
    setGeneratedZipFileName('');
  }

  /**
   * Starts worker-based placeholder generation after validation succeeds.
   */
  function beginPlaceholderGeneration(contest: ContestData): void {
    clearGeneratedArchive();
    setGenerationErrorMessage('');
    setProgressValue(0);
    setProgressTotal(contest.numVoters);
    setAppState('generating');

    generationControllerRef.current = startPlaceholderGeneration(
      contestName,
      contest,
      {
        onError: (message) => {
          generationControllerRef.current = null;
          setGenerationErrorMessage(message);
          setAppState('idle');
          setProgressValue(0);
          setProgressTotal(0);
        },
        onProgress: (completed, total) => {
          setProgressValue(completed);
          setProgressTotal(total);
        },
        onSuccess: (archiveBytes, zipFileName) => {
          generationControllerRef.current = null;
          const normalizedArchiveBytes = new Uint8Array(
            archiveBytes.byteLength,
          );

          normalizedArchiveBytes.set(archiveBytes);

          const archiveBlob = new Blob([normalizedArchiveBytes], {
            type: 'application/zip',
          });
          const archiveUrl = URL.createObjectURL(archiveBlob);

          setGeneratedArchiveUrl(archiveUrl);
          setGeneratedZipFileName(zipFileName);
          setAppState('succeeded');
        },
      },
    );
  }

  /**
   * Validates the selected workbook and starts generation when it succeeds.
   */
  async function handleStartGeneration() {
    if (!canGenerate || contestFile === null || isGenerating) {
      return;
    }

    clearGeneratedArchive();
    setValidationErrors([]);
    setGenerationErrorMessage('');
    setAppState('idle');
    setProgressValue(0);
    setProgressTotal(0);

    const parseResult = await parseContestWorkbook(
      await contestFile.arrayBuffer(),
      hasCountColumn,
    );

    if (!parseResult.ok) {
      setValidationErrors(parseResult.errors);
      setAppState('validationFailed');
      setProgressValue(0);
      return;
    }

    if (includeFlags) {
      const flagValidationErrors = validateBundledFlags(parseResult.contest);

      if (flagValidationErrors.length > 0) {
        setValidationErrors(flagValidationErrors);
        setAppState('validationFailed');
        setProgressValue(0);
        return;
      }
    }

    beginPlaceholderGeneration(parseResult.contest);
  }

  useEffect(() => {
    return () => {
      generationControllerRef.current?.cancel();

      if (generatedArchiveUrl !== null) {
        URL.revokeObjectURL(generatedArchiveUrl);
      }
    };
  }, [generatedArchiveUrl]);

  /**
   * Starts generation from form submission when the enter key is used.
   */
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    void handleStartGeneration();
  };

  /**
   * Cancels the current generation job and returns to editable state.
   */
  function handleCancel() {
    generationControllerRef.current?.cancel();
    generationControllerRef.current = null;
    setAppState('idle');
    setProgressValue(0);
    setProgressTotal(0);
    clearGeneratedArchive();
    setGenerationErrorMessage('');
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
                    onClick={
                      isGenerating
                        ? handleCancel
                        : () => {
                            void handleStartGeneration();
                          }
                    }
                    type="button"
                  >
                    {isGenerating ? 'Cancel' : 'Generate'}
                  </Button>
                </Group>
                <Stack aria-live="polite" gap="sm">
                  {isGenerating ? (
                    <Alert
                      icon={<IconLoader2 size={16} />}
                      title="Generating Scoreboards"
                      variant="default"
                    >
                      <Stack gap="xs">
                        <Text size="sm">
                          {progressValue} of {progressTotal} placeholder exports
                          generated
                        </Text>
                        <Progress
                          aria-label="Generation progress"
                          value={progressPercent}
                        />
                      </Stack>
                    </Alert>
                  ) : null}
                  {hasSucceeded ? (
                    <Alert
                      icon={<IconCheck size={16} />}
                      title="Generating Scoreboards"
                      variant="default"
                    >
                      <Stack gap="xs">
                        <Text size="sm">
                          Placeholder exports are ready for download.
                        </Text>
                        <Progress
                          size="xl"
                          aria-label="Generation progress"
                          value={progressPercent}
                        />
                        <Group justify="flex-start">
                          <Button
                            component="a"
                            download={generatedZipFileName}
                            href={generatedArchiveUrl ?? undefined}
                            leftSection={<IconDownload size={16} />}
                          >
                            Download ZIP
                          </Button>
                        </Group>
                      </Stack>
                    </Alert>
                  ) : null}
                  {generationErrorMessage.length > 0 ? (
                    <Alert title="Generation Failed" variant="default">
                      <Text size="sm">{generationErrorMessage}</Text>
                    </Alert>
                  ) : null}
                  {hasValidationFailed && validationErrors.length > 0 ? (
                    <Alert title="Validation Failed" variant="default">
                      <Table highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Error</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {validationErrors.map((error) => (
                            <Table.Tr key={error.message}>
                              <Table.Td>{error.message}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
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
