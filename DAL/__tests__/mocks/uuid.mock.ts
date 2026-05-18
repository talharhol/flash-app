// Deterministic UUID mock. Call resetUuidCounter() in beforeEach for predictable IDs.
let _counter = 0;

export function resetUuidCounter() {
  _counter = 0;
}

const uuid = {
  v4: () => `test-uuid-${++_counter}`,
};

export default uuid;
