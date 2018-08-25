global.fetch = require('jest-fetch-mock');
const App = require('../src/app');

const selector = 'main-app';
// Set up the document and return the App options appropriate for it.
function setUpDocument() {
  document.body.innerHTML = `\
    <div>\
      <h1>Test Content</h1>\
      <div id="${selector}">\
        Uninitialized
      </div>\
    </div>\
  `;

  return {
    contentSelector: selector,
  };
}

describe('Application framework', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Initializes', () => {
    const app = new App(setUpDocument());
    return app.setup()
      .then(() => {
        const content = document.querySelector(`#${selector}`).innerHTML;
        expect(content.includes('Uninitialized')).toBe(false);
        expect(content.includes('header')).toBe(true);
        expect(content.includes('Password:')).toBe(true);
      });
  });

  test('Looks up password and sets view on garbled user response', () => {
    global.fetch.mockResponseOnce('???');

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => expect(app.view).toEqual(0))
      .then(() => app.setUserNameAndPassword('Jonathan', 's3cr3t'))
      .then(() => expect(app.view).toEqual(0));
  });

  test('Looks up password and sets view on success', () => {
    global.fetch.mockResponseOnce('37');

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => expect(app.view).toEqual(0))
      .then(() => app.setUserNameAndPassword('Jonathan', 's3cr3t'))
      .then(() => expect(app.view).toEqual(2));
  });
});
