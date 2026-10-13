import { useSyncExternalStore } from 'react';
import { tv, subscribe, getVersion } from '../engine/state.js';

// Relê o estado da TV sempre que o motor avisa uma mudança (emit).
export function useTv() {
  useSyncExternalStore(subscribe, getVersion);
  return tv;
}
