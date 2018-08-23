const express = require('express');
const request = require('supertest');
const Repo = require('./inMemoryRepo');
const Server = require('../src/server');

function createServer(app) {
  const repo = new Repo();
  const server = new Server(app, repo);
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
  test('Handles note create', () => {
    const app = express();
    const content = encodeURIComponent('<h1>My Day</h1><p>Some note</p>');

    return createServer(app).
      then(() => request(app).get(`/note/create/sEcr3t/noobe/${content}`)).
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
      then(() => request(app).get(`/note/create/sEcr3t/noobe/${content}`)).
      then(response => request(app).get('/note/delete/sEcr3t/noobe/0')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('true');
      });
  });

  test('Handles note delete failure', () => {
    const app = express();
    return createServer(app).
      then(() => request(app).get('/note/delete/sEcr3t/noobe/1')).
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
      then(() => request(app).get(`/note/create/sEcr3t/noobe/${content}`)).
      then(response => request(app).get(`/note/get/sEcr3t/noobe/0`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual(rawContent);
      });
  });

  test('Handles note get failure', () => {
    const app = express();
    return createServer(app).
      then(() => request(app).get(`/note/get/sEcr3t/noobe/1`)).
      then(response => {
        expect(response.statusCode).toBe(404);
      });
  });

  test('Handles note search', () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);
    const search = encodeURIComponent('Some note');

    return createServer(app).
      then(() => request(app).get(`/note/create/sEcr3t/noobe/${content}`)).
      then(response => request(app).get(`/note/search/sEcr3t/noobe/${search}`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual(JSON.stringify([rawContent]));
      });
  });

  test('Handles note search failure', () => {
    const app = express();
    const search = encodeURIComponent('Some note');

    return createServer(app).
      then(() => request(app).get(`/note/search/sEcr3t/noobe/${search}`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('[]');
      });
  });

});

describe('Test user routing', () => {
  test('Handles user create', () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');

    return createServer(app).
      then(() => request(app).get(`/user/create/sEcr3t/${user}`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles user get', () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');

    return createServer(app).
      then(() => request(app).get(`/user/create/sEcr3t/${user}`)).
      then(response => request(app).get(`/user/get/sEcr3t/0/${user}`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles user get failure', () => {
    const app = express();
    return createServer(app).
      then(() => request(app).get(`/user/get/sEcr3t/1/noobe`)).
      then(response => {
        expect(response.statusCode).toBe(404);
      });
  });
});
