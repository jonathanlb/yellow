const header = require('../views/header');

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
    span.click();
    expect(view).toBe(4);
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
    span.click();
    expect(view).toBe(2);
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
