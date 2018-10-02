const header = require('../views/header');
const Views = require('../views/views');

const loginName = 'Some User';

describe('Header component', () => {
  test('renders', () => {
    const elt = header({
      userName: loginName,
    });
    expect(elt.innerHTML.includes('Post')).toBe(true);
    expect(elt.innerHTML.includes('Search')).toBe(true);
    expect(elt.innerHTML.includes('Logout')).toBe(true);
  });

  test('renders blank navbar before login', () => {
    const elt = header({});
    expect(elt.innerHTML.includes('Post')).toBe(false);
    expect(elt.innerHTML.includes('Search')).toBe(false);
    expect(elt.innerHTML.includes('Logout')).toBe(false);
  });

  test('clears', () => {
    let clicked = false;
    const app = {
      discardNotes: () => undefined,
      render: () => { clicked = true; },
      userName: loginName,
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
      userName: loginName,
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
      userName: loginName,
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
      userName: loginName,
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
