let active = false;
const listeners = new Set<(v: boolean) => void>();

export function startPageTransition() {
  active = true;
  listeners.forEach((fn) => fn(true));
}
export function endPageTransition() {
  active = false;
  listeners.forEach((fn) => fn(false));
}
export function subscribePageTransition(fn: (v: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}