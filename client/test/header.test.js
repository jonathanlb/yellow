const header = require('../views/header');
const Views = require('../views/views');

describe('Header component', () => {
  test('renders', () => {
    const elt = header({});
    expect(elt.innerHTML.includes('Post')).toBe(true);
    expect(elt.innerHTML.includes('Search')).toBe(true);
    expect(elt.innerHTML.includes('Logout')).toBe(true);
  });

  test('clears', () => {
    let clicked = false;
    const app = {
      discardNotes: () => undefined,
      render: () => { clicked = true; },
    };

    document.createElement('body');
    const elt = header(app);
    document.body.appendChild(elt);

    const span = Array.from(elt.childNodes)
      .find(e => e.textContent === 'Unclutter');
    span.onclick();
    expect(clicked).toBe(true);
  });

  test('posts', () => {
    let view = -1;
    const app = {
      render: (viewNum) => { view = viewNum; },
    };

    document.createElement('body');
    const elt = header(app);
    document.body.appendChild(elt);

    const span = Array.from(elt.childNodes)
      .find(e => e.textContent === 'Post');
    span.onclick();
    expect(view).toBe(Views.post);
  });

  test('searches', () => {
    let view = -1;
    const app = {
      render: (viewNum) => { view = viewNum; },
    };

    document.createElement('body');
    const elt = header(app);
    document.body.appendChild(elt);

    const span = Array.from(elt.childNodes)
      .find(e => e.textContent === 'Search');
    span.onclick();
    expect(view).toBe(Views.search);
  });

  test('logs out', () => {
    let clicked = false;
    const app = {
      logout: () => { clicked = true; },
    };

    document.createElement('body');
    const elt = header(app);
    document.body.appendChild(elt);

    const span = Array.from(elt.childNodes)
      .find(e => e.textContent === 'Logout');
    span.click();
    expect(clicked).toBe(true);
  });
});
