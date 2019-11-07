const debug = require('debug')('server');
const express = require('express');
const request = require('supertest');
const Repo = require('./inMemoryNoteRepo');
const Server = require('../src/server');

function createServer(app, opts) {
	const authStub = {
		authenticateUser: stubTrueAuthenticateUser,
		authenticateSession: stubTrueAuthenticateSession,
	}
  const repo = new Repo();
  const server = new Server(app, repo, authStub, opts || { routeUserCreate: true });
  return server.setup();
}

function stubFalseAuthenticateSession () {
	debug('check permissions authSession stub => false');
	return Promise.resolve(false);
}

function stubFalseAuthenticateUser () {
	debug('check permissions authUser stub => false');
	return Promise.resolve(false);
}

function stubTrueAuthenticateSession () {
	debug('check permissions authSession stub => true');
	return Promise.resolve(true);
}

function stubTrueAuthenticateUser () {
	debug('check permissions authUser stub => true');
  return Promise.resolve({
		email: 'nobody@home.org',
		id: '1234',
		session: 'abcde'
	});
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
  test('Checks permissions', async () => {
    const app = express();
		const server = await createServer(app);
    server.auth.authenticateSession = stubFalseAuthenticateSession;
    server.auth.authenticateUser = stubFalseAuthenticateUser;
    
		const response = await request(app).
      get(`/note/create/noobe/foobar`).
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(403);
  });

  test('Handles session expiry', async () => {
    const app = express();
		const server = await createServer(app);
    server.auth.authenticateSession = () => {
			throw new Error('Session expired at 0');
		}

		const response = await request(app).
      get(`/note/create/noobe/foobar`).
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(440);
  });

  test('Handles authenticate user error', async () => {
    const app = express();
		const server = await createServer(app);
		server.auth.authenticateSession = stubFalseAuthenticateUser;
    server.auth.authenticateUser = () => {
			throw new Error('Internal auth error');
		}

		const response = await request(app).
      get(`/note/create/noobe/foobar`).
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(440);
  });

  test('Handles note create', async () => {
    const app = express();
    const content = encodeURIComponent('<h1>My Day</h1><p>Some note</p>');
    const server = await createServer(app);
    server.auth.authenticateUser = stubFalseAuthenticateUser;

		const response = await request(app).
			get(`/note/create/noobe/${content}`).
			set('x-access-token', 'sEcr3t');
		expect(response.statusCode).toBe(200);
    expect(response.text).toEqual('0');
  });

  test('Handles note create with options', async () => {
    const app = express();
    const content = encodeURIComponent('<h1>My Day</h1><p>Some note</p>');
    const opts = encodeURIComponent(JSON.stringify({ access:0 }));
		const server = await createServer(app);

		const response = await request(app).
			get(`/note/create/noobe/${content}/${opts}`).
			set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(200);
    expect(response.text).toEqual('0');
  });

  test('Handles note delete', async () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);
    const server = await createServer(app);

    await request(app).
      get(`/note/create/noobe/${content}`).
      set('x-access-token', 'sEcr3t');
    const response = await request(app).
      get('/note/delete/noobe/0').
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(200);
    expect(response.text).toEqual('true');
  });

  test('Handles note delete failure', async () => {
    const app = express();
    await createServer(app);
    const response = await request(app).
      get('/note/delete/noobe/1').
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(200);
    expect(response.text).toEqual('false');
  });

  test('Handles note get', async () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);

    await createServer(app);
    await request(app).
      get(`/note/create/noobe/${content}`).
      set('x-access-token', 'sEcr3t');
    let response = await request(app).
      get(`/note/get/noobe/0`).
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(200);
    const note = JSON.parse(response.text);
    expect(note.content).toEqual(rawContent);
  });

  test('Handles note get failure', async () => {
    const app = express();
    await createServer(app);
    const response = await request(app).
      get(`/note/get/noobe/1`).
      set('x-access-token', 'sEcr3t');
    expect(response.statusCode).toBe(404);
  });

  test('Handles note privacy updates', async () => {
    const app = express();
    await createServer(app);
    const response = await request(app).
			get(`/note/setAccess/19/31/0`).
			set('x-access-token', 'sEcr3t');
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual('');
	});

  test('Handles note privacy update errors around malformed user id', async () => {
    const app = express();
    await createServer(app);
		const response = await request(app).
			get(`/note/setAccess/nineteen/31/0`).
			set('x-access-token', 'sEcr3t');
		expect(response.statusCode).toBe(500);
		expect(response.text.includes('invalid user id: NaN')).toBe(true);
	});

  test('Handles note search', async () => {
    const app = express();
    const rawContent = '<h1>My Day</h1><p>Some note</p>';
    const content = encodeURIComponent(rawContent);
		const search = encodeURIComponent('Some note');

		await createServer(app);
		await request(app).
			get(`/note/create/noobe/${content}`).
			set('x-access-token', 'sEcr3t');
		const response = await request(app).
			get(`/note/search/noobe/${search}`).
			set('x-access-token', 'sEcr3t');
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual(JSON.stringify([0]));
	});

  test('Handles note search failure', async () => {
    const app = express();
    const search = encodeURIComponent('Some note');

    await createServer(app);
		const response = await request(app).
			get(`/note/search/noobe/${search}`).
			set('x-access-token', 'sEcr3t');
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual('[]');
	});

});

describe('Test user routing', () => {
  test('Handles user bootstrap get success', async () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');
    const secret = 'sEcr3t';

		const server = await createServer(app);
		let response = await request(app).
			get(`/user/create/${user}`).
			set('x-access-token', secret);
		expect(response.statusCode).toBe(200);

		server.auth.authenticateSession = stubFalseAuthenticateSession;
		response = await request(app).
			get(`/user/get/-1/${user}`).
			set('x-access-token', secret);
		expect(response.statusCode).toBe(200);
		expect(response.get('x-access-token')).toEqual('abcde');
		expect(response.text).toEqual('0');
	});

  test('Handles user bootstrap get failure', async () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');
    const secret = 'sEcr3t';

    const server = await createServer(app);
    server.auth.authenticateSession = stubFalseAuthenticateSession;
    server.auth.authenticateUser = stubFalseAuthenticateUser;

		const response = await request(app).
			get(`/user/get/-1/${user}`).
			set('x-access-token', secret);
		expect(response.statusCode).toBe(403);
	});

  test('Handles user get', async () => {
    const app = express();
    const user = encodeURIComponent('The "Real" Twit');
    const secret = 'sEcr3t';

    await createServer(app);
    await request(app).
			get(`/user/create/${user}`).
			set('x-access-token', secret);
		const response = await request(app).
			get(`/user/get/0/${user}`).
			set('x-access-token', secret);
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual('0');
	});

  test('Handles user get failure', async () => {
    const app = express();
    await createServer(app);
    const response = await request(app).
			get(`/user/get/1/noobe`).
			set('x-access-token', 'sEcr3t');
		expect(response.statusCode).toBe(404);
	});

  test('Handles user block', async () => {
    const app = express();
    const userName = encodeURIComponent('The "Real" Twit');

    await createServer(app);
    const response = await request(app).
			get(`/user/blocks/19/${userName}`).
			set('x-access-token', 'secret');
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual('');
	});

  test('Handles user block error from bad user id', async () => {
    const app = express();
    const userName = encodeURIComponent('The "Real" Twit');

    await createServer(app);
    const response = await request(app).
			get(`/user/blocks/nineteen/${userName}`).
			set('x-access-token', 'secret');
		expect(response.statusCode).toBe(400);
		expect(response.text).toEqual('invalid userId: NaN');
	});

  test('Handles user share', async () => {
    const app = express();
    const userName = encodeURIComponent('My #1 Friend');

    await createServer(app);
    const response = await request(app).
			get(`/user/shares/19/${userName}`).
			set('x-access-token', 'secret');
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual('');
	});

  test('Handles user share error from bad user id', async () => {
    const app = express();
    const userName = encodeURIComponent('My #1 Friend');

    await createServer(app);
    const response = await request(app).
		  get(`/user/shares/nineteen/${userName}`).
			set('x-access-token', 'secret');
		expect(response.statusCode).toBe(400);
		expect(response.text).toEqual('invalid userId: NaN');
	});

  test('Handles user get sharing partners', async () => {
    const app = express();
    await createServer(app);
    const response = await request(app).
			get('/user/sharesWith/19').
			set('x-access-token', 'secret');
		expect(response.statusCode).toBe(200);
		expect(response.text).toEqual('[]');
	});

  test('Handles user get sharing partners error from malformed user id', async () => {
    const app = express();
    await createServer(app);
		const response = await request(app).
			get(`/user/sharesWith/nineteen`).
			set('x-access-token', 'secret');
		expect(response.statusCode).toBe(400);
		expect(response.text).toEqual('invalid userId: NaN');
	});
});
