import { useMemo } from 'react';
import { AppShell } from './layout/AppShell';
import { ServicesProvider, ThemeProvider, TypographyProvider } from './providers';
import { IndexedDBAdapter } from '@/services/storage';
import { NoopSyncAdapter } from '@/services/sync';
import { NoopAudioEngine } from '@/services/audio';

export function App() {
  const services = useMemo(
    () => ({
      storage: new IndexedDBAdapter(),
      sync: new NoopSyncAdapter(),
      audio: new NoopAudioEngine(),
    }),
    [],
  );

  return (
    <ServicesProvider value={services}>
      <ThemeProvider>
        <TypographyProvider>
          <AppShell />
        </TypographyProvider>
      </ThemeProvider>
    </ServicesProvider>
  );
}
