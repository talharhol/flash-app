// Runs once before all integration test suites.
// Verifies the Firebase emulator is reachable so tests fail fast with a clear message.
module.exports = async function globalSetup() {
  const url =
    'http://127.0.0.1:8080/emulator/v1/projects/demo-flash/databases/(default)/documents';
  let ok = false;
  try {
    const res = await fetch(url, { method: 'GET' });
    ok = res.status < 500;
  } catch {
    ok = false;
  }
  if (!ok) {
    throw new Error(
      '\n\nFirebase Emulator not running.\nStart it first: npm run emulator:start\n',
    );
  }
};
