import { useMemo, useEffect } from 'react';
import { AppShell } from './layout/AppShell';
import { preloadGoogleIdentityScript } from '@/services/sync/adapters/googleDriveAuth';
import {
  ServicesProvider,
  ThemeProvider,
  TypographyProvider,
  createAppServices,
} from './providers';

export function App() {
  const services = useMemo(() => createAppServices(), []);

  useEffect(() => {
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      preloadGoogleIdentityScript();
    }
  }, []);

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
