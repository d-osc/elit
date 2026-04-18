import { runtime } from '../../shares/runtime';

/**
 * Get current runtime.
 */
export function getRuntime(): 'node' | 'bun' | 'deno' {
  return runtime;
}