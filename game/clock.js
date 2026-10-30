export function createClock({ now = () => performance.now() } = {}) {
  let start = null,
    elapsed = 0;
  return {
    start() {
      start = now();
      elapsed = 0;
      return start;
    },
    read() {
      return start === null ? elapsed : now() - start;
    },
    stop(at = now()) {
      if (start !== null) {
        elapsed = at - start;
        start = null;
      }
      return elapsed;
    },
    reset() {
      start = null;
      elapsed = 0;
    },
  };
}
