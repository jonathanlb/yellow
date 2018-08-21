const express = require('express');
const request = require('supertest');
const Repo = require('./inMemoryRepo');
const Server = require('../src/server');

function createServer(app) {
  const repo = new Repo();
  const server = new Server(app, repo);
  server.setup();
  return server;
}

describe('Test routing', () => {
  test('Handles create', () => {
    const app = express();
    const server = createServer(app);
    const content = encodeURIComponent('<h1>My Day</h1><p>Some note</p>');

    return request(app).
      get(`/create/sEcr3t/noobe/${content}`).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('0');
      });
  });

  test('Handles delete', () => {
    const app = express();
    const server = createServer(app);
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);

    return request(app).
      get(`/create/sEcr3t/noobe/${content}`).
      then(response => request(app).get('/delete/sEcr3t/noobe/0')).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('true');
      });
  });

  test('Handles delete failure', () => {
    const app = express();
    const server = createServer(app);
    return request(app).
      get('/delete/sEcr3t/noobe/1').
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('false');
      });
  });

  test('Handles get', () => {
    const app = express();
    const server = createServer(app);
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);

    return request(app).
      get(`/create/sEcr3t/noobe/${content}`).
      then(response => request(app).get(`/get/sEcr3t/noobe/0`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual(rawContent);
      });
  });

  test('Handles get failure', () => {
    const app = express();
    const server = createServer(app);
    return request(app).
      get(`/get/sEcr3t/noobe/1`).
      then(response => {
        expect(response.statusCode).toBe(404);
        // expect(response.text).toEqual('1');
      });
  });

  test('Handles root', () => {
    const app = express();
    const server = createServer(app);
    return request(app).
      get('/').
      then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test('Handles search', () => {
    const app = express();
    const server = createServer(app);
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);
    const search = encodeURIComponent('Some note');

    return request(app).
      get(`/create/sEcr3t/noobe/${content}`).
      then(response => request(app).get(`/search/sEcr3t/noobe/${search}`)).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual(JSON.stringify([rawContent]));
      });
  });

  test('Handles search failure', () => {
    const app = express();
    const server = createServer(app);
    const search = encodeURIComponent('Some note');

    return request(app).
      get(`/search/sEcr3t/noobe/${search}`).
      then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toEqual('[]');
      });
  });


});
