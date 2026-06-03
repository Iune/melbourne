import {
  Anchor,
  AppShell,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';

/**
 * Renders the initial Melbourne app shell with placeholder navigation.
 */
export function App() {
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
          <Stack gap="xs" py="xl">
            <Title order={1}>Melbourne</Title>
            <Text c="dimmed">
              Browser-based scoreboard generation for online music contests.
            </Text>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
