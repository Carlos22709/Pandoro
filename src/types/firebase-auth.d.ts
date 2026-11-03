import type { Persistence } from 'firebase/auth';

// Existe en la versión React Native del SDK, pero los tipos de firebase/auth solo describen la web.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
