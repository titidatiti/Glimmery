import { createContext, useContext, type ReactNode } from 'react';
import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';
import type { AudioEngine } from '@/services/audio';

export interface ServicesContextValue {
  storage: StorageProvider;
  sync: SyncProvider;
  audio: AudioEngine;
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

export interface ServicesProviderProps {
  value: ServicesContextValue;
  children: ReactNode;
}

export function ServicesProvider({ value, children }: ServicesProviderProps) {
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): ServicesContextValue {
  const ctx = useContext(ServicesContext);
  if (!ctx) {
    throw new Error('useServices 必须在 ServicesProvider 内使用');
  }
  return ctx;
}
