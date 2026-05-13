import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** User-selected mode (persisted in localStorage). */
  mode: ThemeMode;
  /** Currently applied scheme — resolves 'system' to the OS preference. */
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  /** Toggles between light & dark (skips system). */
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
