import { findRsWorkingBatteryCandidates } from "../utils/rsFeebasRecovery";

self.onmessage = event => {
  try {
    const result = findRsWorkingBatteryCandidates(
      event.data
    );

    self.postMessage({
      ok: true,
      result
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Working-battery calculation failed."
    });
  }
};
