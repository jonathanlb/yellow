const express = require('express');
const request = require('supertest');
const Repo = require('./inMemoryNoteRepo');
const Server = require('../src/server');

function createServer(app, opts) {
  const repo = new Repo();
  const server = new Server(app, repo, opts || { routeUserCreate: true });
  return server.setup();
}

describe('Test routing instantiation', () => {
    test('Handles note root', () => {
      const app = express();
      return createServer(app).
        then(() => request(app).get('/')).
        then(response => {
          expect(response.statusCode).toBe(200);
        });
    });
});

describe('Test note routing', () => {
  test('Checks permissions', () => {
    const app = express();
    return createServer(app).
      then(server => {
        server.repo.checkSecret = () => Promise.resolve(false);
      }).
      then(() => 
        request(app).
          get(`/note/create/noobe/foobar`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(403);
      });
  });

  test('Handles note create', () => {
    const app = express();
    const content = encodeURIComponent('<h1>My Day</h1><p>Some note</p>');

    return createServer(app).
      then(() =>
        request(app).
          get(`/note/create/noobe/${content}`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles note create with options', () => {
    const app = express();
    const content = encodeURIComponent('<h1>My Day</h1><p>Some note</p>');
    const opts = encodeURIComponent(JSON.stringify({ access:0 }));

    return createServer(app).
      then(() =>
        request(app).
          get(`/note/create/noobe/${content}/${opts}`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles note delete', () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);

    return createServer(app).
      then(() =>
        request(app).
          get(`/note/create/noobe/${content}`).
          set('x-access-token', 'sEcr3t')).
      then(response =>
        request(app).
          get('/note/delete/noobe/0').
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('true');
      });
  });

  test('Handles note delete failure', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get('/note/delete/noobe/1').
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('false');
      });
  });

  test('Handles note get', () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);

    return createServer(app).
      then(() =>
        request(app).
          get(`/note/create/noobe/${content}`).
          set('x-access-token', 'sEcr3t')).
      then(response =>
        request(app).
          get(`/note/get/noobe/0`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        const note = JSON.parse(response.text);
        expect(note.content).toEqual(rawContent);
      });
  });

  test('Handles note get failure', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get(`/note/get/noobe/1`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(404);
      });
  });

  test('Handles note privacy updates', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get(`/note/setAccess/19/31/0`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('');
      });
  });

  test('Handles note privacy update errors around malformed user id', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get(`/note/setAccess/nineteen/31/0`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(500);
        expect(response.text.includes('invalid user id: NaN')).toBe(true);
      });
  });

  test('Handles note search', () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);
    const search = encodeURIComponent('Some note');

    return createServer(app).
      then(() =>
        request(app).
          get(`/note/create/noobe/${content}`).
          set('x-access-token', 'sEcr3t')).
      then(response =>
        request(app).
          get(`/note/search/noobe/${search}`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual(JSON.stringify([0]));
      });
  });

  test('Handles note search failure', () => {
    const app = express();
    const search = encodeURIComponent('Some note');

    return createServer(app).
      then(() =>
        request(app).
          get(`/note/search/noobe/${search}`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('[]');
      });
  });

});

describe('Test user routing', () => {
  test('Handles user bootstrap get success', () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');
    const secret = 'sEcr3t';

    return createServer(app).
      then(() =>
        request(app).
          get(`/user/create/${user}`).
          set('x-access-token', secret)).
      then(response =>
        expect(response.statusCode).toBe(200)).
      then(() =>
        request(app).
          get(`/user/get/-1/${user}`).
          set('x-access-token', secret)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles user bootstrap get failure', () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');
    const secret = 'sEcr3t';

    return createServer(app).
      then(server =>
        server.repo.checkSecret = () => Promise.resolve(false)).
      then(() =>
        request(app).
          get(`/user/get/-1/${user}`).
          set('x-access-token', secret)).
      then(response =>
        expect(response.statusCode).toBe(403));
  });

  test('Handles user get', () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');
    const secret = 'sEcr3t';

    return createServer(app).
      then(() =>
        request(app).
          get(`/user/create/${user}`).
          set('x-access-token', secret)).
      then(response =>
        request(app).
          get(`/user/get/0/${user}`).
          set('x-access-token', secret)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles user get failure', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get(`/user/get/1/noobe`).
          set('x-access-token', 'sEcr3t')).
      then(response => {
        expect(response.statusCode).toBe(404);
      });
  });

  test('Handles user block', () => {
    const app = express();
    const userName = encodeURIComponent('The "Real" Twit');

    return createServer(app).
      then(() =>
        request(app).
          get(`/user/blocks/19/${userName}`).
          set('x-access-token', 'secret')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('');
      });
  });

  test('Handles user block error from bad user id', () => {
    const app = express();
    const userName = encodeURIComponent('The "Real" Twit');

    return createServer(app).
      then(() =>
        request(app).
          get(`/user/blocks/nineteen/${userName}`).
          set('x-access-token', 'secret')).
      then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.text).toEqual('invalid userId: NaN');
      });
  });

  test('Handles user share', () => {
    const app = express();
    const userName = encodeURIComponent('My #1 Friend');

    return createServer(app).
      then(() =>
        request(app).
          get(`/user/shares/19/${userName}`).
          set('x-access-token', 'secret')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('');
      });
  });

  test('Handles user share error from bad user id', () => {
    const app = express();
    const userName = encodeURIComponent('My #1 Friend');

    return createServer(app).
      then(() =>
        request(app).
          get(`/user/shares/nineteen/${userName}`).
          set('x-access-token', 'secret')).
      then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.text).toEqual('invalid userId: NaN');
      });
  });

  test('Handles user get sharing partners', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get(`/user/sharesWith/19`).
          set('x-access-token', 'secret')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('[]');
      });
  });

  test('Handles user get sharing partners error from malformed user id', () => {
    const app = express();
    return createServer(app).
      then(() =>
        request(app).
          get(`/user/sharesWith/nineteen`).
          set('x-access-token', 'secret')).
      then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.text).toEqual('invalid userId: NaN');
      });
  });
});
