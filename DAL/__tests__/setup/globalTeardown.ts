module.exports = async function globalTeardown() {
  // Nothing to clean up — Firebase app lifecycle is per-worker-process.
};
