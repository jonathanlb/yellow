const error = require('../views/fatalError');

describe('Fatal Error component', () => {
  test('renders', () => {
    const message = 'Testing errors';
    const app = { lastError: message };
    const elt = error(app);
    expect(elt.innerHTML.includes(message)).toBe(true);
  });
});
