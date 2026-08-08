/**
 * Rolling-window speed in pixels per second. The readout needs a stable
 * number, so this averages over a window rather than reporting the last delta.
 */
export function createSpeedTracker(windowMs = 500) {
  let samples = [];

  function prune(nowMs) {
    const cutoff = nowMs - windowMs;
    while (samples.length && samples[0].at < cutoff) samples.shift();
  }

  return {
    record(deltaPx, nowMs) {
      samples.push({ px: Math.abs(deltaPx), at: nowMs });
      prune(nowMs);
    },
    speed(nowMs) {
      prune(nowMs);
      if (samples.length < 2) return 0;
      const elapsed = nowMs - samples[0].at;
      if (elapsed <= 0) return 0;
      let total = 0;
      for (let i = 0; i < samples.length; i++) total += samples[i].px;
      return (total / elapsed) * 1000;
    },
    reset() {
      samples = [];
    }
  };
}
