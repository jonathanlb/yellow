const debug = require('debug')('server');
const errors = require('debug')('server:error');
const express = require('express');

module.exports = class Server {
  constructor(router, repo, auth, opts) {
    this.auth = auth;
    this.router = router;
    this.repo = repo;
    this.opts = opts || {};

    ['checkSecret']
      .forEach((m) => { this[m] = this[m].bind(this); });
  }

  /**
   * Run the callback if the user id and secret match or return 403
   * on the response.
   *
   * @param params the incoming URL request parameters, including secret
   * and user fields.
   * @param res the HTTP response used to send unauthorized response.
   * @param f the callback for successful authorization.
   */
  async checkSecret(request, response, f) {
    const secret = decodeURIComponent(request.headers['x-access-token']);
    const userId = parseInt(request.params.user, 10);
    try {
      const credentials = {
        userId,
        session: secret,
      };
      const sessionOK = await this.auth.authenticateSession(credentials);
      if (sessionOK) {
        return f();
      }
    } catch (e) {
      errors('checkSecret session', e);
      response.status(440).send('Session expired');
      return false;
    }

    try {
      const credentials = {
        id: userId,
        password: secret,
      };
      const userOK = await this.auth.authenticateUser(credentials);
      if (!userOK || !userOK.session) {
        response.status(403).send('Unauthorized');
        return false;
      }
      debug('responding with session', userId, userOK.session);
      response.header('x-access-token', userOK.session);
      return f();
    } catch (e) {
      errors('checkSecret user', e);
      response.status(440).send('Unauthorized');
      return false;
    }
  }

  /**
   * Wire the routes.
   */
  async setup() {
    this.router.use(express.static('public'));
    this.setupIndex();
    this.setupNoteAccess();
    this.setupNoteCreate();
    this.setupNoteDelete();
    this.setupNoteGet();
    this.setupNoteSearch();
    if (this.opts.routeUserCreate) {
      this.setupUserCreate();
    }
    this.setupUserIdGet();
    this.setupUserShareWith();

    return this.repo.setup()
      .then(() => this);
  }

  setupIndex() {
    this.router.get('/', (req, res, next) => {
      debug('get index');
      res.status(200).send('Hello');
      return Promise.resolve(next);
    });
  }

  setupNoteAccess() {
    this.router.get(
      '/note/setAccess/:user/:note/:access',
      (req, res, next) => this.checkSecret(req, res, () => {
        const userId = parseInt(req.params.user, 10);
        const noteId = parseInt(req.params.note, 10);
        const accessMode = parseInt(req.params.access, 10);

        return this.repo.setNoteAccess(noteId, userId, accessMode)
          .then(() => {
            debug('note access', noteId, accessMode);
            res.status(200).send('');
          })
          .catch(next);
      }),
    );
  }

  setupNoteCreate() {
    // Spare some redundancy from making note creation options optional.
    const createNote = (content, user, res, opts) => this.repo.createNote(content, user, opts)
      .then((id) => {
        debug('created', id);
        res.status(200).send(id.toString());
      });

    this.router.get(
      '/note/create/:user/:content',
      (req, res, next) => this.checkSecret(req, res, () => {
        const { content } = req.params;
        return createNote(content, parseInt(req.params.user, 10), res)
          .catch(next);
      }),
    );

    this.router.get(
      '/note/create/:user/:content/:opts',
      (req, res, next) => this.checkSecret(req, res, () => {
        const { content } = req.params;
        const opts = JSON.parse(req.params.opts);
        return createNote(content, parseInt(req.params.user, 10), res, opts)
          .catch(next);
      }),
    );
  }

  setupNoteDelete() {
    this.router.get(
      '/note/delete/:user/:noteId',
      (req, res, next) => this.checkSecret(req, res, () => {
        debug('delete', req.params.noteId);
        return this.repo.removeNote(
          parseInt(req.params.noteId, 10),
          parseInt(req.params.user, 10),
        )
          .then((result) => {
            debug('deleted', result);
            res.status(200).send(result.toString());
          })
          .catch(next);
      }),
    );
  }

  setupNoteGet() {
    this.router.get(
      '/note/get/:user/:noteId',
      (req, res, next) => this.checkSecret(req, res, () => {
        const id = parseInt(req.params.noteId, 10);
        const userId = parseInt(req.params.user, 10);
        return this.repo.getNote(id, userId)
          .then((content) => {
            debug('retrieved', id, content);
            if (content) {
              // replace content.author with a user name.
              return this.repo.getUserName(content.author)
                .then((userName) => {
                  // eslint-disable-next-line no-param-reassign
                  content.author = userName;
                  res.status(200).send(content);
                });
            }
            return res.status(404).send(`Not found: ${id}`);
          })
          .catch(next);
      }),
    );
  }

  setupNoteSearch() {
    this.router.get(
      '/note/search/:user/:searchTerm',
      (req, res) => this.checkSecret(
        req,
        res,
        () => this.repo.searchNote(
          req.params.searchTerm,
          parseInt(req.params.user, 10),
        )
          .then((results) => {
            debug('found', req.params.searchTerm, results);
            res.status(200).send(JSON.stringify(results));
          }).catch((error) => {
            errors('noteSearch', error);
            res.status(500).send(error.message);
          }),
      ),
    );
  }

  /**
   * Install the logic to create a user.
   * Only install this endpoint for development.
   * TODO: handle redundant requests, permissions to create.
   */
  setupUserCreate() {
    this.router.get(
      '/user/create/:userName',
      (req, res, next) => {
        const { userName } = req.params;
        const secret = decodeURIComponent(req.headers['x-access-token']);
        debug('user create', userName);
        return this.repo.createUser(userName, secret)
          .then((id) => {
            debug('user created', id);
            res.status(200).send(id.toString());
          })
          .catch(next);
      },
    );
  }

  /**
   * Install logic to look up user ids by name.
   * Bootstrap mode: specify user name and associated password/secret and
   *  userId -1 to get the user id.
   * Normal mode: password/secret and userid must match to return user id for
   *  included user name.
   */
  setupUserIdGet() {
    this.router.get(
      '/user/get/:user/:userName',
      async (req, res) => {
        const { userName } = req.params;
        let userId = parseInt(req.params.user, 10);

        if (userId <= 0) {
          userId = await this.repo.getUserId(userName);
          if (userId !== undefined) {
            userId = userId.toString();
            req.params.user = userId;
            debug('user bootstrap', userId, userName);
            this.checkSecret(req, res, async () => {
              res.status(200).send(userId);
            });
          } else {
            res.status(404).send(`Not found: ${userName}`);
          }
        } else {
          this.checkSecret(req, res, async () => {
            debug('user get', req.params.user, userName);
            const id = await this.repo.getUserId(userName);
            debug('retrieved user', id);
            if (id >= 0) {
              res.status(200).send(id.toString());
            } else {
              res.status(404).send(`Not found: ${userName}`);
            }
          });
        }
      },
    );
  }

  /**
   * Install logic to allow users to share and revoke sharing.
   */
  setupUserShareWith() {
    this.router.get(
      '/user/blocks/:user/:otherName',
      (req, res) => this.checkSecret(
        req,
        res,
        () => {
          const userId = parseInt(req.params.user, 10);
          const { otherName } = req.params;
          return this.repo.getUserId(otherName)
            .then(otherId => this.repo.userBlocks(userId, otherId))
            .then(() => res.status(200).send(''))
            .catch(e => res.status(400).send(e.message));
        },
      ),
    );

    this.router.get(
      '/user/shares/:user/:otherName',
      (req, res) => this.checkSecret(
        req,
        res,
        () => {
          const userId = parseInt(req.params.user, 10);
          const { otherName } = req.params;
          return this.repo.getUserId(otherName)
            .then(otherId => this.repo.userSharesWith(userId, otherId))
            .then(() => res.status(200).send(''))
            .catch(e => res.status(400).send(e.message));
        },
      ),
    );

    this.router.get(
      '/user/sharesWith/:user',
      (req, res) => this.checkSecret(
        req,
        res,
        () => {
          const userId = parseInt(req.params.user, 10);
          return this.repo.getUserSharesWith(userId)
            .then(result => res.status(200).send(result))
            .catch(e => res.status(400).send(e.message));
        },
      ),
    );
  }
};
