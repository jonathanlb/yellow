global.fetch = require('jest-fetch-mock');
const App = require('../src/app');
const Views = require('../views/views');

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

  test('Creates cards', () => {
    const content = 'Hello, World!';
    global.fetch.mockResponseOnce('29');
    const card = {
      author: 'Jonathan',
      content,
      created: 1,
      id: 29,
    };
    global.fetch.mockResponseOnce(JSON.stringify(card));

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => app.render(Views.post))
      .then(() => app.createNote(content))
      .then(() => {
        const appContent = document.getElementById(selector).innerHTML;
        expect(appContent.includes(content), `looking for note in\n${appContent}`)
          .toBe(true);
      });
  });

  test('Creates formatted cards', () => {
    const content = '# Hello, World!';
    global.fetch.mockResponseOnce('29');
    const card = {
      author: 'Jonathan',
      content,
      created: 1,
      id: 29,
      renderHint: 1,
    };
    global.fetch.mockResponseOnce(JSON.stringify(card));

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => app.render(Views.post))
      .then(() => app.createNote(content, { renderHint: 1 }))
      .then(() => { // XXX we don't check that opts are passed along
        const appContent = document.getElementById(selector).innerHTML;
        expect(appContent.includes('Hello, World!</h1>'), `looking for note in\n${appContent}`)
          .toBe(true);
      });
  });

  test('Gets default server host', () => {
    const server = App.getServerPrefix({});
    expect(server.endsWith(':3000/'), `host ${server} ends with port`).toBe(true);
    expect(server.includes('undefined', `host ${server} has no undefined portions`)).toBe(false);
    const serverStr = 'http://bilbo.com:3456/';
    expect(App.getServerPrefix({ serverPrefix: serverStr })).toEqual(serverStr);
  });

  test('Initializes', () => {
    const app = new App(setUpDocument());
    return app.setup()
      .then(() => {
        const content = document.getElementById(selector).innerHTML;
        expect(content.includes('Uninitialized')).toBe(false);
        expect(content.includes('header')).toBe(true);
        expect(content.includes('Password:')).toBe(true);
      });
  });

  test('Loads cards', () => {
    const userId = 19;
    const secret = 'zz';
    const cardId = 13;
    const message = 'Hello, Unit Tests!';
    const card = {
      author: 'Jonathan',
      content: message,
      created: 1,
      id: cardId,
    };
    global.fetch.mockResponseOnce(JSON.stringify(card));

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => {
        app.userId = userId;
        app.fetchOpts.headers['x-access-token'] = secret;
        return app.loadCard(cardId);
      })
      .then(() => app.render(Views.view))
      .then(() => {
        expect(global.fetch.mock.calls.length).toBe(1);
        expect(global.fetch.mock.calls[0][0])
          .toEqual(`http://localhost:3000/note/get/${userId}/${cardId}`);

        const content = document.getElementById(selector).innerHTML;
        expect(content.includes(message), `Looking for card in ${content}`)
          .toBe(true);
      });
  });

  test('Looks up password and sets view on garbled user response', () => {
    global.fetch.mockResponseOnce('???');

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => expect(app.view).toEqual(Views.login))
      .then(() => app.setUserNameAndPassword('Jonathan', 's3cr3t'))
      .then(() => expect(app.view).toEqual(Views.login));
  });

  test('Looks up password and sets view on success', () => {
    global.fetch.mockResponseOnce('37');
    global.fetch.mockResponseOnce('[]'); // send empty search results unless we mock more

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => expect(app.view).toEqual(Views.login))
      .then(() => app.setUserNameAndPassword('Jonathan', 's3cr3t'))
      .then(() => expect(app.view).toEqual(Views.view));
  });

  test('Resets user name and password on logout', () => {
    const app = new App(setUpDocument());
    return app.setup()
      .then(() => {
        app.userId = 11;
        app.fetchOpts.headers['x-access-token'] = 'secret';
        app.userName = 'Bozo';
        return app.logout();
      })
      .then(() => {
        expect(app.userId).toBe(-1);
        expect(app.fetchOpts.headers['x-access-token']).toBeUndefined();
        expect(app.userName).toBeUndefined();
      });
  });

  test('Sends search requests', () => {
    const userId = 19;
    const secret = 'zz';
    const query = 'author = 37';
    const cardId = 13;
    const message = 'Hello, Unit Tests!';
    const card = {
      author: 'Jonathan',
      content: message,
      created: 1,
      id: cardId,
    };
    const searchResponse = [3, 4, 5];
    global.fetch.mockResponseOnce(JSON.stringify(searchResponse));
    searchResponse.forEach((id) => {
      card.id = id;
      global.fetch.mockResponseOnce(JSON.stringify(card));
    });

    const app = new App(setUpDocument());
    return app.setup()
      .then(() => {
        expect(document.getElementsByClassName('cardContainer').length).toBe(0);
      })
      .then(() => {
        app.userId = userId;
        app.fetchOpts.headers['x-access-token'] = secret;
        return app.doSearch(query);
      })
      .then(() => {
        expect(global.fetch.mock.calls.length, 'search + 3 cards').toBe(4);
        expect(global.fetch.mock.calls[0][0])
          .toEqual(`http://localhost:3000/note/search/${userId}/${encodeURIComponent(query)}`);
        expect(document.getElementsByClassName('cardContainer').length).toBe(3);
      });
  });
});
