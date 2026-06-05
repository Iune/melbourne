import {
  ActionIcon,
  Alert,
  Accordion,
  Anchor,
  AppShell,
  Button,
  Checkbox,
  ColorInput,
  Code,
  Container,
  Fieldset,
  FileInput,
  Group,
  List,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconBrandGithub,
  IconCheck,
  IconDownload,
  IconFlag,
  IconHelp,
  IconLoader2,
  IconMoon,
  IconRefresh,
  IconSun,
} from '@tabler/icons-react';
import type { FormEventHandler, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { buildGenerationAssets } from './features/assets/generationAssets';
import { parseContestWorkbook } from './features/contest/contestParser';
import type {
  ContestData,
  ContestParseError,
} from './features/contest/contestTypes';
import type { ScoreboardGenerationController } from './features/export/scoreboardGenerationClient';
import { startScoreboardGeneration } from './features/export/scoreboardGenerationClient';
import { getBundledFlagAssetEntriesByPack } from './features/flags/flagAssets';
import { validateFlagReferences } from './features/flags/flagValidation';
import { HELP_SECTIONS, type HelpRichText } from './helpContent';
import type { ScoreboardRenderConfig } from './features/render/scoreboardRenderer';

const DEFAULT_MAIN_COLOR = '#2F292B';
const DEFAULT_ACCENT_COLOR = '#FCB906';

type AppState = 'idle' | 'generating' | 'succeeded' | 'validationFailed';
type AppView = 'generator' | 'flags' | 'help';

/**
 * Renders the Melbourne app shell and initial scoreboard generation form.
 */
export function App() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isMobileHeader = useMediaQuery('(max-width: 48em)');
  const [currentView, setCurrentView] = useState<AppView>('generator');
  const [contestName, setContestName] = useState('');
  const [contestFile, setContestFile] = useState<File | null>(null);
  const [hasCountColumn, setHasCountColumn] = useState(false);
  const [mainColor, setMainColor] = useState(DEFAULT_MAIN_COLOR);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [baseFontFile, setBaseFontFile] = useState<File | null>(null);
  const [pointsFontFile, setPointsFontFile] = useState<File | null>(null);
  const [includeFlags, setIncludeFlags] = useState(true);
  const [drawFlagBorders, setDrawFlagBorders] = useState(true);
  const [customFlagFiles, setCustomFlagFiles] = useState<File[]>([]);
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
  const generationControllerRef = useRef<ScoreboardGenerationController | null>(
    null,
  );

  const canGenerate = contestName.trim().length > 0 && contestFile !== null;
  const isGenerating = appState === 'generating';
  const hasSucceeded = appState === 'succeeded';
  const hasValidationFailed = appState === 'validationFailed';
  const progressPercent =
    progressTotal === 0 ? 0 : (progressValue / progressTotal) * 100;
  const hasStatusContent =
    isGenerating ||
    hasSucceeded ||
    generationErrorMessage.length > 0 ||
    (hasValidationFailed && validationErrors.length > 0);
  const isDarkMode = computedColorScheme === 'dark';
  const bundledFlagEntriesByPack = getBundledFlagAssetEntriesByPack();

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
   * Starts worker-based scoreboard generation after validation succeeds.
   */
  function beginScoreboardGeneration(
    contest: ContestData,
    customGenerationAssets: Awaited<ReturnType<typeof buildGenerationAssets>>,
  ): void {
    clearGeneratedArchive();
    setGenerationErrorMessage('');
    setProgressValue(0);
    setProgressTotal(contest.numVoters);
    setAppState('generating');

    const renderConfig: ScoreboardRenderConfig = {
      accentColor,
      displayFlagBorders: drawFlagBorders,
      displayFlags: includeFlags,
      mainColor,
      title: contestName.trim(),
    };

    generationControllerRef.current = startScoreboardGeneration(
      contest,
      customGenerationAssets,
      renderConfig,
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

    const activeCustomFlagFiles = includeFlags ? customFlagFiles : [];

    if (includeFlags) {
      const flagValidationErrors = validateFlagReferences(
        parseResult.contest,
        activeCustomFlagFiles,
      );

      if (flagValidationErrors.length > 0) {
        setValidationErrors(flagValidationErrors);
        setAppState('validationFailed');
        setProgressValue(0);
        return;
      }
    }

    let customGenerationAssets: Awaited<
      ReturnType<typeof buildGenerationAssets>
    >;

    try {
      customGenerationAssets = await buildGenerationAssets({
        baseFontFile,
        customFlagFiles: activeCustomFlagFiles,
        pointsFontFile,
      });
    } catch (error) {
      setValidationErrors([
        {
          message:
            error instanceof Error
              ? error.message
              : 'Unable to load the selected custom assets.',
        },
      ]);
      setAppState('validationFailed');
      setProgressValue(0);
      return;
    }

    beginScoreboardGeneration(parseResult.contest, customGenerationAssets);
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

  /**
   * Toggles the Mantine color scheme between light and dark modes.
   */
  function handleToggleColorScheme(): void {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  }

  /**
   * Renders one structured help paragraph or list item.
   */
  function renderHelpRichText(content: HelpRichText): ReactNode {
    return content.map((fragment, index) => {
      const key = `${fragment.type}-${fragment.text}-${index}`;

      if (fragment.type === 'bold') {
        return (
          <Text component="span" fw={700} key={key}>
            {fragment.text}
          </Text>
        );
      }

      if (fragment.type === 'code') {
        return <Code key={key}>{fragment.text}</Code>;
      }

      if (fragment.type === 'link') {
        return (
          <Anchor href={fragment.href} key={key} underline="hover">
            {fragment.text}
          </Anchor>
        );
      }

      return (
        <Text component="span" key={key}>
          {fragment.text}
        </Text>
      );
    });
  }

  return (
    <AppShell header={{ height: isMobileHeader ? 112 : 64 }} padding="md">
      <AppShell.Header>
        <Container h="100%" py={isMobileHeader ? 'xs' : 0} size="lg">
          {isMobileHeader ? (
            <Stack gap={6} h="100%" justify="center">
              <Anchor
                fw={700}
                href="/"
                onClick={(event) => {
                  event.preventDefault();
                  setCurrentView('generator');
                }}
                style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)' }}
                ta="center"
                underline="never"
                variant="gradient"
                gradient={{ from: '#ff5e3a', to: '#ff2a68' }}
              >
                Melbourne Scoreboard Generator
              </Anchor>
              <Group gap="md" justify="center" wrap="wrap">
                <Anchor
                  href="#help"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentView('help');
                  }}
                  underline="hover"
                >
                  <Group gap={4} wrap="nowrap">
                    <IconHelp size={16} />
                    <span>Help</span>
                  </Group>
                </Anchor>
                <Anchor
                  href="#flags"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentView('flags');
                  }}
                  underline="hover"
                >
                  <Group gap={4} wrap="nowrap">
                    <IconFlag size={16} />
                    <span>Flags</span>
                  </Group>
                </Anchor>
                <Anchor
                  href="https://github.com/Iune/melbourne"
                  underline="hover"
                >
                  <Group gap={4} wrap="nowrap">
                    <IconBrandGithub size={16} />
                    <span>GitHub</span>
                  </Group>
                </Anchor>
                <Tooltip
                  label={
                    isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
                  }
                >
                  <ActionIcon
                    aria-label={
                      isDarkMode
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                    }
                    onClick={handleToggleColorScheme}
                    size="lg"
                    variant="subtle"
                  >
                    {isDarkMode ? (
                      <IconSun size={18} stroke={1.8} />
                    ) : (
                      <IconMoon size={18} stroke={1.8} />
                    )}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Stack>
          ) : (
            <Group h="100%" justify="space-between" wrap="nowrap">
              <Anchor
                fw={700}
                href="/"
                onClick={(event) => {
                  event.preventDefault();
                  setCurrentView('generator');
                }}
                size="xl"
                underline="never"
                variant="gradient"
                gradient={{ from: '#ff5e3a', to: '#ff2a68' }}
              >
                Melbourne Scoreboard Generator
              </Anchor>
              <Group gap="lg" wrap="nowrap">
                <Anchor
                  href="#help"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentView('help');
                  }}
                  underline="hover"
                >
                  <Group gap={4} wrap="nowrap">
                    <IconHelp size={16} />
                    <span>Help</span>
                  </Group>
                </Anchor>
                <Anchor
                  href="#flags"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentView('flags');
                  }}
                  underline="hover"
                >
                  <Group gap={4} wrap="nowrap">
                    <IconFlag size={16} />
                    <span>Flags</span>
                  </Group>
                </Anchor>
                <Anchor
                  href="https://github.com/Iune/melbourne"
                  underline="hover"
                >
                  <Group gap={4} wrap="nowrap">
                    <IconBrandGithub size={16} />
                    <span>GitHub</span>
                  </Group>
                </Anchor>
                <Tooltip
                  label={
                    isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
                  }
                >
                  <ActionIcon
                    aria-label={
                      isDarkMode
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                    }
                    onClick={handleToggleColorScheme}
                    size="lg"
                    variant="subtle"
                  >
                    {isDarkMode ? (
                      <IconSun size={18} stroke={1.8} />
                    ) : (
                      <IconMoon size={18} stroke={1.8} />
                    )}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          )}
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          {currentView === 'generator' ? (
            <Stack gap="lg" py="xl">
              <Title order={1}>Generate Scoreboards</Title>
              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <SimpleGrid
                    cols={{ base: 1, md: 2 }}
                    spacing="md"
                    verticalSpacing="md"
                  >
                    <Stack gap="md">
                      <Fieldset legend="Contest Details">
                        <Stack gap="md">
                          <TextInput
                            disabled={isGenerating}
                            label="Contest Title"
                            onChange={(event) =>
                              setContestName(event.currentTarget.value)
                            }
                            placeholder="Contest Results"
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
                                  onClick={() =>
                                    setMainColor(DEFAULT_MAIN_COLOR)
                                  }
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
                                  onClick={() =>
                                    setAccentColor(DEFAULT_ACCENT_COLOR)
                                  }
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
                    </Stack>
                    <Stack gap="md">
                      <Fieldset legend="Flags">
                        <Stack gap="md">
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
                          <FileInput
                            accept=".png,.jpg"
                            clearable
                            disabled={!includeFlags || isGenerating}
                            label="Custom Flag Files"
                            multiple
                            onChange={(files) =>
                              setCustomFlagFiles(files ?? [])
                            }
                            placeholder="Select .png or .jpg file(s)"
                            value={customFlagFiles}
                          />
                        </Stack>
                      </Fieldset>
                      <Fieldset legend="Custom Fonts">
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <FileInput
                            accept=".ttf,.otf"
                            clearable
                            disabled={isGenerating}
                            label="Base Font"
                            onChange={setBaseFontFile}
                            placeholder="Select .ttf or .otf file"
                            value={baseFontFile}
                          />
                          <FileInput
                            accept=".ttf,.otf"
                            clearable
                            disabled={isGenerating}
                            label="Points Font"
                            onChange={setPointsFontFile}
                            placeholder="Select .ttf or .otf file"
                            value={pointsFontFile}
                          />
                        </SimpleGrid>
                      </Fieldset>
                    </Stack>
                  </SimpleGrid>
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
                    {hasStatusContent ? <Title order={3}>Status</Title> : null}
                    {isGenerating ? (
                      <Alert
                        icon={<IconLoader2 size={18} />}
                        title="Generating Scoreboards"
                        variant="default"
                      >
                        <Stack gap="xs">
                          <Text size="sm">
                            {progressValue} of {progressTotal} scoreboards
                            generated
                          </Text>
                          <Progress
                            size="xl"
                            aria-label="Generation progress"
                            value={progressPercent}
                          />
                        </Stack>
                      </Alert>
                    ) : null}
                    {hasSucceeded ? (
                      <Alert
                        icon={<IconCheck size={18} />}
                        title="Generation Complete"
                        variant="default"
                      >
                        <Stack gap="xs">
                          <Text size="sm">
                            Scoreboards are ready for download.
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
          ) : currentView === 'flags' ? (
            <Stack gap="lg" py="xl">
              <Title order={1}>Bundled Flags</Title>
              <Text c="dimmed" size="sm">
                The bundled flag packs below are available for spreadsheet
                references. Use the reference shown in the Details column.
              </Text>
              <Accordion chevronPosition="right" multiple variant="separated">
                {[...bundledFlagEntriesByPack.entries()].map(
                  ([packName, entries]) => (
                    <Accordion.Item key={packName} value={packName}>
                      <Accordion.Control>
                        {packName} ({entries.length})
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Table highlightOnHover striped>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>File Name</Table.Th>
                              <Table.Th>Details</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {entries.map((entry) => (
                              <Table.Tr key={entry.reference}>
                                <Table.Td>{entry.fileName}</Table.Td>
                                <Table.Td>{entry.details}</Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ),
                )}
              </Accordion>
            </Stack>
          ) : (
            <Stack gap="lg" py="xl">
              <Title order={1}>Help</Title>
              {HELP_SECTIONS.map((section) => (
                <Stack gap="sm" key={section.title}>
                  <Title order={section.titleLevel}>{section.title}</Title>
                  {section.body?.map((paragraph) => (
                    <Text
                      key={paragraph.map((fragment) => fragment.text).join('')}
                    >
                      {renderHelpRichText(paragraph)}
                    </Text>
                  ))}
                  {section.items !== undefined ? (
                    <List spacing="xs">
                      {section.items.map((item) => (
                        <List.Item
                          key={item.map((fragment) => fragment.text).join('')}
                        >
                          {renderHelpRichText(item)}
                        </List.Item>
                      ))}
                    </List>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
