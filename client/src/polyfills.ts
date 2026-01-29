// src/polyfills.ts
import { Buffer } from 'buffer';

// Polyfill Buffer
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = { env: {}, version: '' };
  
  // Ensure globalThis has Buffer
  (globalThis as any).Buffer = Buffer;
}