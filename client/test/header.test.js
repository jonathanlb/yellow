const header = require('../views/header');

// ??? placing App before header prevents static properties from being used
// in header?
const App = require('../src/app');

describe('Header component', () => {
  test('renders', () => {
    const elt = header({});
    expect(elt.innerHTML.includes('Post')).toBe(true);
    expect(elt.innerHTML.includes('Search')).toBe(true);
    expect(elt.innerHTML.includes('Logout')).toBe(true);
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
    expect(view).toBe(App.postView);
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
    expect(view).toBe(App.searchView);
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
