const App = require('../src/app');

describe('Application framework', () => {
  test('Initializes', () => {
    const selector = 'main-app';
    document.body.innerHTML = `\
			<div>\
        <h1>Test Content</h1>\
        <div id="${selector}">\
					Uninitialized
        </div>\
      </div>\
    `;

    const app = new App(selector);
    return app.setup()
      .then(() => {
        const content = document.querySelector(`#${selector}`).innerHTML;
        expect(content.includes('Uninitialized')).toBe(false);
        expect(content.includes('header')).toBe(true);
        expect(content.includes('Password:')).toBe(true);
      });
  });
});
