import { useMemo } from 'react';
import { AppShell } from './layout/AppShell';
import {
  ServicesProvider,
  ThemeProvider,
  TypographyProvider,
  createAppServices,
} from './providers';

export function App() {
  const services = useMemo(() => createAppServices(), []);

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
