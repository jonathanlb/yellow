const search = require('../views/search');

describe('Search component', () => {
  test('renders search component', () => {
    const elt = search({});
    expect(elt.innerHTML.includes('Search:')).toBe(true);
  });

  test('wires OK button', () => {
    let clicked = false;
    const app = {
      doSearch: () => { clicked = true; },
    };

    document.createElement('body');
    const elt = search(app);
    document.body.appendChild(elt);

    const button = Array.from(elt.childNodes)
      .find(e => e.textContent === 'OK');
    button.onclick();
    expect(clicked).toBe(true);
  });

  test('wires search field enter', () => {
    let clicked = false;
    const app = {
      doSearch: () => { clicked = true; },
    };

    document.createElement('body');
    const elt = search(app);
    document.body.appendChild(elt);

    const field = Array.from(elt.childNodes)
      .find(e => e.id === 'searchField');
    field.onkeyup({ key: ' ' });
    expect(clicked).toBe(false);
    field.onkeyup({ key: 'Enter' });
    expect(clicked).toBe(true);
  });
});
