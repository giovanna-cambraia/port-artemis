let lastCorruption = 0;
const listeners = new Set<(v: number) => void>();

export function setHandoffCorruption(value: number) {
  lastCorruption = value;
  listeners.forEach((fn) => fn(value));
}

export function getHandoffCorruption() {
  return lastCorruption;
}

export function subscribeHandoffCorruption(fn: (v: number) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
